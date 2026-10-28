import { createHash } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { confirmPayment, markPaymentFailed, recordRefund } from "@/lib/server/orders";
import { processOrderTasks } from "@/lib/server/tasks";
import { query } from "@/lib/server/db";
import { refreshStorefront } from "@/lib/server/storefront";
import { json, runAfterResponse } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook. Subscribe ONLY to: payment.authorized, payment.captured,
 * payment.failed, order.paid, refund.processed.
 *
 * Responses: 400 for a bad signature; 500 when we couldn't record/process the
 * event (Razorpay then retries); 200 once handled or safely ignored.
 */

interface WebhookBody {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; error_description?: string | null } };
    order?: { entity?: { id?: string } };
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number } };
  };
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return json({ error: "invalid_signature" }, 400);
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const eventId = req.headers.get("x-razorpay-event-id") ?? `sha256:${createHash("sha256").update(raw).digest("hex")}`;
  const payment = body.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id ?? body.payload?.order?.entity?.id ?? null;

  try {
    const inserted = await query(
      `INSERT INTO payment_events (event_id, event_type, razorpay_order_id, payload)
       VALUES ($1, $2, $3, $4) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
      [eventId, body.event, rzpOrderId, raw]
    );
    if (!inserted.length) {
      const prior = await query<{ processed_at: Date | null }>(
        "SELECT processed_at FROM payment_events WHERE event_id = $1",
        [eventId]
      );
      if (prior[0]?.processed_at) return json({ ok: true, duplicate: true });
      // Recorded earlier but not finished (crash / timeout): process again —
      // every step below is idempotent.
    }

    switch (body.event) {
      case "payment.authorized":
      case "payment.captured":
      case "order.paid": {
        if (payment?.id && payment.order_id) {
          const result = await confirmPayment(payment.order_id, payment.id);
          if (result.outcome === "paid") {
            await runAfterResponse(() => processOrderTasks(result.orderId));
          }
        }
        break;
      }
      case "payment.failed":
        if (payment?.order_id) {
          await markPaymentFailed(payment.order_id, payment.error_description ?? "Payment failed");
        }
        break;
      case "refund.processed": {
        const refund = body.payload?.refund?.entity;
        if (refund?.id && refund.payment_id && refund.amount) {
          if ((await recordRefund(refund.payment_id, refund.id, refund.amount)) === "applied") refreshStorefront();
        }
        break;
      }
      default:
        break; // not subscribed / not used
    }

    await query("UPDATE payment_events SET processed_at = now() WHERE event_id = $1", [eventId]);
    return json({ ok: true });
  } catch (err) {
    console.error("[webhook] processing failed, Razorpay will retry:", (err as Error).message);
    return json({ error: "processing_failed" }, 500);
  }
}
