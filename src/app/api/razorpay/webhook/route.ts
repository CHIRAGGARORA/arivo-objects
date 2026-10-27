import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook handler.
 * ---------------------------------------------------------------------------
 * Configure this URL in Razorpay Dashboard → Settings → Webhooks:
 *   https://<your-domain>/api/razorpay/webhook
 * Subscribe to: payment.captured, payment.failed, order.paid
 * The "Secret" you set there goes in RAZORPAY_WEBHOOK_SECRET — this is a
 * DIFFERENT value from RAZORPAY_KEY_SECRET.
 *
 * HONEST LIMITATION (see the project README / chat for the full tradeoff):
 * this project has no database. Signature verification below is fully
 * implemented and is the part that actually matters for security — it
 * proves a payload genuinely came from Razorpay. But true idempotent
 * de-duplication (skipping an event you've already processed) needs
 * somewhere to remember which event IDs were already seen, and a
 * serverless function has no persistent memory between invocations. For
 * now this handler verifies, logs clearly (visible in Vercel's function
 * logs) and returns fast — safe to receive duplicates since it doesn't yet
 * perform any side-effecting write (no DB row, no email) that duplicate
 * delivery could double up. Add a datastore before wiring up anything that
 * DOES have a side effect (e.g. sending a confirmation email per event).
 * ---------------------------------------------------------------------------
 */

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number } };
    order?: { entity?: { id?: string; status?: string; amount?: number } };
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("Razorpay webhook: signature verification failed.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  switch (payload.event) {
    case "payment.captured": {
      const p = payload.payload?.payment?.entity;
      console.log("[razorpay webhook] payment.captured", {
        paymentId: p?.id,
        orderId: p?.order_id,
        amount: p?.amount,
      });
      break;
    }
    case "payment.failed": {
      const p = payload.payload?.payment?.entity;
      console.log("[razorpay webhook] payment.failed", {
        paymentId: p?.id,
        orderId: p?.order_id,
      });
      break;
    }
    case "order.paid": {
      const o = payload.payload?.order?.entity;
      console.log("[razorpay webhook] order.paid", { orderId: o?.id, amount: o?.amount });
      break;
    }
    default:
      console.log("[razorpay webhook] unhandled event:", payload.event);
  }

  // Always 200 once the signature is verified, so Razorpay doesn't treat a
  // merely-unhandled event type as a delivery failure and keep retrying it.
  return NextResponse.json({ received: true });
}
