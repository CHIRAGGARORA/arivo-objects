import "server-only";
import { query } from "./db";
import { config } from "./config";
import {
  customerConfirmationEmail,
  EmailError,
  OrderEmailData,
  ownerOrderEmail,
  sendEmail,
  shippingAlertEmail,
} from "./email";
import { createShipmentOrder, ShiprocketError } from "./shiprocket";
import { orderStatusUrl } from "./orders";

/**
 * Durable post-payment steps.
 *
 * Each (order, task) row is claimed with a conditional UPDATE that sets a
 * short lease, so two concurrent processors (webhook + browser verify, or a
 * cron run) can never execute the same step at the same time, and a step
 * that succeeded is never run again. A crash mid-step leaves the row
 * 'processing' until the lease expires, after which it is retried.
 *
 * External calls are idempotent as well: Resend sends carry an
 * Idempotency-Key, and Shiprocket creation first looks up an existing order
 * with the same order number.
 */

export type TaskName = "customer_email" | "owner_email" | "shiprocket_order" | "shipping_alert_email";
const ORDER: TaskName[] = ["customer_email", "owner_email", "shiprocket_order", "shipping_alert_email"];
const LEASE = "2 minutes";

class NonRetryable extends Error {}

async function claim(orderId: string, task: TaskName, force: boolean): Promise<number | null> {
  const rows = await query<{ attempts: number }>(
    `UPDATE order_tasks
        SET status = 'processing', attempts = attempts + 1,
            locked_until = now() + interval '${LEASE}', updated_at = now()
      WHERE order_id = $1 AND task = $2
        AND (
          (status IN ('pending', 'failed') AND attempts < max_attempts AND ($3 OR next_run_at <= now()))
          OR (status = 'needs_attention' AND $3)
          OR (status = 'processing' AND locked_until < now())
        )
      RETURNING attempts`,
    [orderId, task, force]
  );
  return rows[0]?.attempts ?? null;
}

async function succeed(orderId: string, task: TaskName, result: unknown) {
  await query(
    `UPDATE order_tasks SET status = 'succeeded', result = $3, last_error = NULL,
            locked_until = NULL, updated_at = now()
      WHERE order_id = $1 AND task = $2`,
    [orderId, task, JSON.stringify(result ?? null)]
  );
}

async function fail(orderId: string, task: TaskName, attempts: number, err: unknown, retryable: boolean) {
  const message = (err instanceof Error ? err.message : String(err)).slice(0, 1000);
  // Backoff: 1, 5, 25, 125 minutes…
  const delayMinutes = Math.min(5 ** (attempts - 1), 24 * 60);
  await query(
    `UPDATE order_tasks
        SET status = CASE WHEN $4 AND attempts < max_attempts THEN 'failed' ELSE 'needs_attention' END,
            last_error = $3, locked_until = NULL,
            next_run_at = now() + ($5 || ' minutes')::interval, updated_at = now()
      WHERE order_id = $1 AND task = $2`,
    [orderId, task, message, retryable, String(delayMinutes)]
  );
}

async function loadOrder(orderId: string): Promise<{ data: OrderEmailData; createdAt: Date; orderNumber: string }> {
  const o = (
    await query<{
      order_number: string;
      public_token: string;
      status: string;
      subtotal_paise: number;
      coupon_code: string | null;
      discount_paise: number;
      shipping_paise: number;
      total_paise: number;
      shipping_address: {
        name: string;
        email: string;
        phone: string;
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        pincode: string;
      };
      razorpay_payment_id: string;
      created_at: Date;
    }>("SELECT * FROM orders WHERE id = $1", [orderId])
  )[0];
  // Defence in depth: never fulfil anything that isn't paid.
  if (!o || o.status !== "paid") throw new NonRetryable(`Order ${orderId} is not paid; refusing to fulfil.`);
  const items = await query<{
    product_slug: string;
    variant_id: string;
    name: string;
    variant_label: string;
    quantity: number;
    unit_price_paise: number;
  }>("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [orderId]);
  const a = o.shipping_address;
  return {
    orderNumber: o.order_number,
    createdAt: o.created_at,
    data: {
      orderNumber: o.order_number,
      customerName: a.name,
      customerEmail: a.email,
      customerPhone: a.phone,
      items: items.map((i) => ({
        productSlug: i.product_slug,
        variantId: i.variant_id,
        name: i.name,
        variantLabel: i.variant_label,
        quantity: i.quantity,
        unitPricePaise: i.unit_price_paise,
      })),
      subtotalPaise: o.subtotal_paise,
      couponCode: o.coupon_code,
      discountPaise: o.discount_paise,
      shippingPaise: o.shipping_paise,
      totalPaise: o.total_paise,
      address: { line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode },
      razorpayPaymentId: o.razorpay_payment_id,
      statusUrl: orderStatusUrl(o.public_token),
    },
  };
}

function ownerEmail(): string {
  const owner = config.resend().ownerEmail;
  if (!owner) throw new EmailError("OWNER_EMAIL is not configured", false);
  return owner;
}

async function run(orderId: string, task: TaskName): Promise<unknown> {
  const { data, createdAt, orderNumber } = await loadOrder(orderId);
  switch (task) {
    case "customer_email":
      return sendEmail({ ...customerConfirmationEmail(data), idempotencyKey: `order-${orderNumber}-customer` });
    case "owner_email":
      return sendEmail({ ...ownerOrderEmail(data, ownerEmail()), idempotencyKey: `order-${orderNumber}-owner` });
    case "shiprocket_order":
      return createShipmentOrder({
        orderNumber,
        createdAt,
        customer: { name: data.customerName, email: data.customerEmail, phone: data.customerPhone },
        address: data.address,
        items: data.items,
        subtotalPaise: data.subtotalPaise,
        discountPaise: data.discountPaise,
        shippingPaise: data.shippingPaise,
      });
    case "shipping_alert_email": {
      const reason = (
        await query<{ last_error: string | null }>(
          "SELECT last_error FROM order_tasks WHERE order_id = $1 AND task = 'shiprocket_order'",
          [orderId]
        )
      )[0]?.last_error;
      return sendEmail({
        ...shippingAlertEmail(data, reason ?? "Unknown error", ownerEmail()),
        idempotencyKey: `order-${orderNumber}-shipping-alert`,
      });
    }
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof NonRetryable) return false;
  if (err instanceof EmailError || err instanceof ShiprocketError) return err.retryable;
  return true; // unknown errors (e.g. transient DB) — retry
}

export interface TaskRunReport {
  task: TaskName;
  outcome: "succeeded" | "failed" | "skipped";
  error?: string;
}

/**
 * Runs every due step for one paid order. `force` re-runs failed or
 * needs-attention steps immediately (admin "Retry").
 */
export async function processOrderTasks(orderId: string, opts: { force?: boolean } = {}): Promise<TaskRunReport[]> {
  const report: TaskRunReport[] = [];
  for (const task of ORDER) {
    const attempts = await claim(orderId, task, Boolean(opts.force));
    if (attempts === null) {
      report.push({ task, outcome: "skipped" });
      continue;
    }
    try {
      const result = await run(orderId, task);
      await succeed(orderId, task, result);
      report.push({ task, outcome: "succeeded" });
    } catch (err) {
      await fail(orderId, task, attempts, err, isRetryable(err));
      report.push({ task, outcome: "failed", error: (err as Error).message });
      if (task === "shiprocket_order") {
        // Tell the owner (once per order) that shipping needs a hand.
        await query(
          "INSERT INTO order_tasks (order_id, task) VALUES ($1, 'shipping_alert_email') ON CONFLICT (order_id, task) DO NOTHING",
          [orderId]
        );
      }
    }
  }
  return report;
}

/** Cron / sweeper: every order with a due step. */
export async function processDueTasks(limit = 25): Promise<{ orderId: string; report: TaskRunReport[] }[]> {
  const due = await query<{ order_id: string }>(
    `SELECT DISTINCT order_id FROM order_tasks
      WHERE (status IN ('pending', 'failed') AND attempts < max_attempts AND next_run_at <= now())
         OR (status = 'processing' AND locked_until < now())
      LIMIT $1`,
    [limit]
  );
  const out = [];
  for (const { order_id } of due) out.push({ orderId: order_id, report: await processOrderTasks(order_id) });
  return out;
}
