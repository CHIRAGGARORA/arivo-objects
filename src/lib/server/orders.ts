import "server-only";
import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { ensureDatabaseEnvironment, query, withTransaction } from "./db";
import { reviewableItems } from "./reviews";
import { CartError, CartItemInput, priceCart } from "./catalog";
import { CouponError } from "./coupons";
import {
  capturePayment,
  createRazorpayOrder,
  fetchPayment,
  RazorpayError,
  RazorpayPayment,
} from "./razorpay";
import { config } from "./config";

/**
 * Order lifecycle
 * ---------------------------------------------------------------------------
 *   pending ──(payment verified + captured, amount matches)──▶ paid
 *   pending ──(payment.failed)──▶ failed ──(later successful attempt)──▶ paid
 *   pending ──(abandoned > 48h)──▶ cancelled ──(late capture)──▶ paid
 *
 * The pending→paid transition is a single conditional UPDATE, so when the
 * browser verify call and the Razorpay webhook race, exactly one of them
 * wins and enqueues fulfilment; the other sees the order already paid.
 * Nothing is fulfilled unless Razorpay itself reports the payment captured
 * for this exact order, amount and currency.
 * ---------------------------------------------------------------------------
 */

export const FULFILMENT_TASKS = ["customer_email", "owner_email", "shiprocket_order"] as const;

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
}
export interface AddressInput {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateOrderInput {
  clientRequestId: string;
  couponCode?: string | null;
  items: CartItemInput[];
  customer: CustomerInput;
  address: AddressInput;
}

export interface CreatedOrder {
  orderNumber: string;
  publicToken: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: "INR";
}

export class OrderError extends Error {
  constructor(public readonly code: "payment_provider_unavailable" | "request_conflict", message: string) {
    super(message);
    this.name = "OrderError";
  }
}

function newOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  // Crockford-ish alphabet without look-alike characters.
  const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `ARV-${ymd}-${suffix}`;
}

async function assertStock(client: PoolClient, items: { productSlug: string; variantId: string; quantity: number }[]) {
  for (const item of items) {
    const rows = (
      await client.query<{ quantity: number }>(
        "SELECT quantity FROM inventory WHERE product_slug = $1 AND variant_id = $2",
        [item.productSlug, item.variantId]
      )
    ).rows;
    const available = rows[0]?.quantity ?? 0;
    if (available < item.quantity) {
      throw new CartError(
        "out_of_stock",
        available === 0 ? "This item is currently out of stock." : `Only ${available} left in stock.`,
        { slug: item.productSlug, variantId: item.variantId }
      );
    }
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  // Throws CartError on any invalid line, CouponError on an unknown code.
  const priced = priceCart(input.items, input.couponCode);
  await ensureDatabaseEnvironment();
  const email = input.customer.email.trim().toLowerCase();

  // A repeated submit of the same checkout attempt returns the same order.
  const prior = await query<{
    order_number: string;
    public_token: string;
    razorpay_order_id: string | null;
    total_paise: number;
    status: string;
  }>(
    "SELECT order_number, public_token, razorpay_order_id, total_paise, status FROM orders WHERE client_request_id = $1",
    [input.clientRequestId]
  );
  if (prior[0]) {
    const p = prior[0];
    if (p.status === "pending" && p.razorpay_order_id && p.total_paise === priced.totalPaise) {
      return {
        orderNumber: p.order_number,
        publicToken: p.public_token,
        razorpayOrderId: p.razorpay_order_id,
        amountPaise: p.total_paise,
        currency: "INR",
      };
    }
    throw new OrderError("request_conflict", "This checkout was already submitted. Please refresh and try again.");
  }

  // 1. Persist the pending order first, so a database outage stops checkout
  //    before any Razorpay order exists.
  const order = await withTransaction(async (client) => {
    await assertStock(client, priced.lines);
    if (priced.coupon?.firstOrderOnly) {
      const prior = await client.query(
        `SELECT 1 FROM orders o JOIN customers c ON c.id = o.customer_id
          WHERE c.email = $1 AND o.status = 'paid' LIMIT 1`,
        [email]
      );
      if (prior.rowCount) {
        throw new CouponError("coupon_not_eligible", `${priced.coupon.code} is only valid on your first order.`);
      }
    }
    const customer = (
      await client.query<{ id: string }>(
        `INSERT INTO customers (email, name, phone) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, updated_at = now()
         RETURNING id`,
        [email, input.customer.name.trim(), input.customer.phone]
      )
    ).rows[0];

    const orderNumber = newOrderNumber();
    const shippingAddress = {
      name: input.customer.name.trim(),
      phone: input.customer.phone,
      email,
      line1: input.address.line1.trim(),
      line2: input.address.line2?.trim() || null,
      city: input.address.city.trim(),
      state: input.address.state.trim(),
      pincode: input.address.pincode,
      country: "India",
    };
    let row: { id: string; public_token: string };
    try {
      row = (
        await client.query<{ id: string; public_token: string }>(
          `INSERT INTO orders (order_number, public_token, client_request_id, customer_id,
             subtotal_paise, coupon_code, discount_paise, shipping_paise, total_paise, shipping_address)
           VALUES ($1, gen_random_uuid(), $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, public_token`,
          [
            orderNumber,
            input.clientRequestId,
            customer.id,
            priced.subtotalPaise,
            priced.coupon?.code ?? null,
            priced.discountPaise,
            priced.shippingPaise,
            priced.totalPaise,
            JSON.stringify(shippingAddress),
          ]
        )
      ).rows[0];
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        throw new OrderError("request_conflict", "This checkout was already submitted. Please refresh and try again.");
      }
      throw err;
    }
    for (const l of priced.lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_slug, variant_id, name, variant_label, unit_price_paise, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [row.id, l.productSlug, l.variantId, l.name, l.variantLabel, l.unitPricePaise, l.quantity]
      );
    }
    return { id: row.id, orderNumber, publicToken: row.public_token };
  });

  // 2. Create the Razorpay order for the server-computed total.
  let rzpOrderId: string;
  try {
    const rzp = await createRazorpayOrder({
      amountPaise: priced.totalPaise,
      receipt: order.orderNumber,
      notes: { order_number: order.orderNumber },
    });
    if (rzp.amount !== priced.totalPaise || rzp.currency !== "INR") {
      throw new RazorpayError("Razorpay order amount/currency mismatch");
    }
    rzpOrderId = rzp.id;
  } catch (err) {
    await query(
      "UPDATE orders SET status = 'failed', failure_reason = $2, updated_at = now() WHERE id = $1 AND status = 'pending'",
      [order.id, `Could not create Razorpay order: ${(err as Error).message}`.slice(0, 500)]
    );
    throw new OrderError("payment_provider_unavailable", "Payment could not be started. Please try again shortly.");
  }

  await query("UPDATE orders SET razorpay_order_id = $2, updated_at = now() WHERE id = $1", [order.id, rzpOrderId]);
  return {
    orderNumber: order.orderNumber,
    publicToken: order.publicToken,
    razorpayOrderId: rzpOrderId,
    amountPaise: priced.totalPaise,
    currency: "INR",
  };
}

// ---------------------------------------------------------------------------
// Payment confirmation (shared by the browser verify call and the webhook)
// ---------------------------------------------------------------------------

export type ConfirmResult =
  | { outcome: "paid"; orderId: string; newlyPaid: boolean }
  | { outcome: "failed"; orderId: string }
  | { outcome: "pending"; orderId: string; paymentStatus: string }
  | { outcome: "mismatch"; orderId: string }
  | { outcome: "unknown_order" };

interface OrderRow {
  id: string;
  status: string;
  total_paise: number;
  razorpay_payment_id: string | null;
}

async function flagAttention(orderId: string, reason: string) {
  await query(
    `UPDATE orders SET attention_reason = COALESCE(attention_reason || E'\\n', '') || $2, updated_at = now()
     WHERE id = $1 AND (attention_reason IS NULL OR position($2 in attention_reason) = 0)`,
    [orderId, reason.slice(0, 500)]
  );
}

/**
 * Asks Razorpay for the authoritative payment state and applies it.
 * Safe to call any number of times, concurrently, from any path.
 */
export async function confirmPayment(razorpayOrderId: string, razorpayPaymentId: string): Promise<ConfirmResult> {
  await ensureDatabaseEnvironment();
  const order = (
    await query<OrderRow>(
      "SELECT id, status, total_paise, razorpay_payment_id FROM orders WHERE razorpay_order_id = $1",
      [razorpayOrderId]
    )
  )[0];
  if (!order) return { outcome: "unknown_order" };
  if (order.status === "paid" && order.razorpay_payment_id === razorpayPaymentId) {
    return { outcome: "paid", orderId: order.id, newlyPaid: false };
  }

  let payment: RazorpayPayment = await fetchPayment(razorpayPaymentId);

  if (payment.order_id !== razorpayOrderId || payment.currency !== "INR" || payment.amount !== order.total_paise) {
    await flagAttention(
      order.id,
      `Payment ${payment.id} does not match this order (order ${payment.order_id}, ${payment.currency} ${payment.amount} vs expected INR ${order.total_paise}). Not fulfilled.`
    );
    return { outcome: "mismatch", orderId: order.id };
  }

  if (payment.status === "authorized") {
    try {
      payment = await capturePayment(payment.id, order.total_paise);
    } catch {
      // Another path may have captured it first; trust Razorpay's current state.
      payment = await fetchPayment(razorpayPaymentId);
    }
  }

  if (payment.status === "captured") {
    return markPaid(order.id, payment);
  }
  if (payment.status === "failed") {
    await query(
      `UPDATE orders SET status = 'failed', failure_reason = $2, updated_at = now()
       WHERE id = $1 AND status = 'pending'`,
      [order.id, (payment.error_description ?? "Payment failed").slice(0, 500)]
    );
    return { outcome: "failed", orderId: order.id };
  }
  return { outcome: "pending", orderId: order.id, paymentStatus: payment.status };
}

async function markPaid(orderId: string, payment: RazorpayPayment): Promise<ConfirmResult> {
  return withTransaction(async (client) => {
    const won = (
      await client.query(
        `UPDATE orders
            SET status = 'paid', razorpay_payment_id = $2, payment_method = $3,
                paid_at = now(), failure_reason = NULL, updated_at = now()
          WHERE id = $1 AND status IN ('pending', 'failed', 'cancelled')
          RETURNING id`,
        [orderId, payment.id, payment.method ?? null]
      )
    ).rowCount;

    if (!won) {
      const current = (
        await client.query<{ status: string; razorpay_payment_id: string | null }>(
          "SELECT status, razorpay_payment_id FROM orders WHERE id = $1",
          [orderId]
        )
      ).rows[0];
      if (current?.status === "paid" && current.razorpay_payment_id !== payment.id) {
        // The customer paid twice for one order (e.g. two tabs). Keep the
        // first; the second needs a refund.
        await client.query(
          `UPDATE orders SET attention_reason = COALESCE(attention_reason || E'\\n', '') || $2, updated_at = now()
           WHERE id = $1 AND (attention_reason IS NULL OR position($2 in attention_reason) = 0)`,
          [orderId, `Second captured payment ${payment.id} for an already-paid order — refund it in Razorpay.`]
        );
      }
      return { outcome: "paid", orderId, newlyPaid: false } as const;
    }

    // Decrement stock. If it can't cover the order (oversold between checkout
    // and payment), keep the order paid but flag it for the owner.
    const items = (
      await client.query<{ product_slug: string; variant_id: string; quantity: number }>(
        "SELECT product_slug, variant_id, quantity FROM order_items WHERE order_id = $1",
        [orderId]
      )
    ).rows;
    const short: string[] = [];
    for (const item of items) {
      const ok = (
        await client.query(
          `UPDATE inventory SET quantity = quantity - $3, updated_at = now()
            WHERE product_slug = $1 AND variant_id = $2 AND quantity >= $3`,
          [item.product_slug, item.variant_id, item.quantity]
        )
      ).rowCount;
      if (!ok) short.push(`${item.product_slug}/${item.variant_id} x${item.quantity}`);
    }
    if (short.length) {
      await client.query("UPDATE orders SET attention_reason = COALESCE(attention_reason || E'\\n', '') || $2 WHERE id = $1", [
        orderId,
        `Paid but stock was insufficient for: ${short.join(", ")}. Contact the customer or refund.`,
      ]);
    }

    for (const task of FULFILMENT_TASKS) {
      await client.query(
        "INSERT INTO order_tasks (order_id, task) VALUES ($1, $2) ON CONFLICT (order_id, task) DO NOTHING",
        [orderId, task]
      );
    }
    return { outcome: "paid", orderId, newlyPaid: true } as const;
  });
}

/**
 * refund.processed webhook. Each refund id is applied once. A full refund
 * marks the order 'refunded' (pending fulfilment steps then stop, because
 * they only run for 'paid' orders). Stock is not restored automatically —
 * the item may already have shipped — so the order is flagged instead.
 */
export async function recordRefund(
  razorpayPaymentId: string,
  refundId: string,
  amountPaise: number
): Promise<"applied" | "duplicate" | "unknown_payment"> {
  await ensureDatabaseEnvironment();
  return withTransaction(async (client) => {
    const order = (
      await client.query<{ id: string; total_paise: number; refunded_paise: number }>(
        "SELECT id, total_paise, refunded_paise FROM orders WHERE razorpay_payment_id = $1 FOR UPDATE",
        [razorpayPaymentId]
      )
    ).rows[0];
    if (!order) return "unknown_payment";
    const inserted = (
      await client.query(
        "INSERT INTO refunds (refund_id, order_id, amount_paise) VALUES ($1, $2, $3) ON CONFLICT (refund_id) DO NOTHING",
        [refundId, order.id, amountPaise]
      )
    ).rowCount;
    if (!inserted) return "duplicate";
    const refunded = order.refunded_paise + amountPaise;
    const full = refunded >= order.total_paise;
    const note = full
      ? `Refunded in full (${refundId}). Stock was not restored automatically — add it back in Stock if the item was not shipped.`
      : `Partial refund ₹${(amountPaise / 100).toFixed(2)} (${refundId}); ₹${(refunded / 100).toFixed(2)} of ₹${(order.total_paise / 100).toFixed(2)} refunded so far.`;
    await client.query(
      `UPDATE orders SET refunded_paise = $2, refunded_at = now(),
              status = CASE WHEN $3 THEN 'refunded' ELSE status END,
              attention_reason = COALESCE(attention_reason || E'\n', '') || $4, updated_at = now()
        WHERE id = $1`,
      [order.id, refunded, full, note]
    );
    return "applied";
  });
}

/** payment.failed webhook: only moves a still-pending order to failed. */
export async function markPaymentFailed(razorpayOrderId: string, reason: string): Promise<void> {
  await query(
    `UPDATE orders SET status = 'failed', failure_reason = $2, updated_at = now()
     WHERE razorpay_order_id = $1 AND status = 'pending'`,
    [razorpayOrderId, reason.slice(0, 500)]
  );
}

/** Abandoned checkouts. A late capture can still move these to paid. */
export async function cancelStalePendingOrders(): Promise<number> {
  const rows = await query(
    `UPDATE orders SET status = 'cancelled', failure_reason = 'Checkout abandoned', updated_at = now()
     WHERE status = 'pending' AND created_at < now() - interval '48 hours' RETURNING id`
  );
  return rows.length;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface PublicOrderView {
  orderNumber: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  items: { name: string; variantLabel: string; quantity: number; unitPricePaise: number }[];
  subtotalPaise: number;
  couponCode: string | null;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  firstName: string;
  createdAt: string;
  shipment: { awbCode: string | null; courierName: string | null } | null;
  /** Paid orders only: products the customer can review from this page. */
  reviewable: { productSlug: string; name: string; reviewed: boolean }[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOrderByPublicToken(token: string): Promise<PublicOrderView | null> {
  if (!UUID_RE.test(token)) return null;
  const order = (
    await query<{
      id: string;
      order_number: string;
      status: PublicOrderView["status"];
      subtotal_paise: number;
      coupon_code: string | null;
      discount_paise: number;
      shipping_paise: number;
      total_paise: number;
      shipping_address: { name: string };
      created_at: Date;
    }>(
      `SELECT id, order_number, status, subtotal_paise, coupon_code, discount_paise, shipping_paise, total_paise, shipping_address, created_at
       FROM orders WHERE public_token = $1`,
      [token]
    )
  )[0];
  if (!order) return null;
  const items = await query<{ name: string; variant_label: string; quantity: number; unit_price_paise: number }>(
    "SELECT name, variant_label, quantity, unit_price_paise FROM order_items WHERE order_id = $1 ORDER BY id",
    [order.id]
  );
  const ship = (
    await query<{ result: { awbCode?: string | null; courierName?: string | null } | null }>(
      "SELECT result FROM order_tasks WHERE order_id = $1 AND task = 'shiprocket_order' AND status = 'succeeded'",
      [order.id]
    )
  )[0];
  return {
    orderNumber: order.order_number,
    status: order.status,
    items: items.map((i) => ({
      name: i.name,
      variantLabel: i.variant_label,
      quantity: i.quantity,
      unitPricePaise: i.unit_price_paise,
    })),
    subtotalPaise: order.subtotal_paise,
    couponCode: order.coupon_code,
    discountPaise: order.discount_paise,
    shippingPaise: order.shipping_paise,
    totalPaise: order.total_paise,
    firstName: order.shipping_address.name.split(/\s+/)[0],
    createdAt: order.created_at.toISOString(),
    shipment: ship?.result ? { awbCode: ship.result.awbCode ?? null, courierName: ship.result.courierName ?? null } : null,
    reviewable: order.status === "paid" ? await reviewableItems(order.id) : [],
  };
}

export function orderStatusUrl(publicToken: string): string {
  return `${config.siteUrl()}/order/${publicToken}`;
}
