import { verifySchema } from "@/lib/server/validation";
import { checkoutBlockReason } from "@/lib/server/config";
import { verifyPaymentSignature } from "@/lib/server/razorpay";
import { confirmPayment } from "@/lib/server/orders";
import { processOrderTasks } from "@/lib/server/tasks";
import { isDbDown, json, readJson, runAfterResponse } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Called by the browser after Razorpay Checkout reports success. The
 * signature proves the ids came from Razorpay; the order is only marked paid
 * after Razorpay's API confirms the payment is captured for the right amount.
 * The webhook does the same independently, so a closed tab loses nothing.
 */
export async function POST(req: Request) {
  if (checkoutBlockReason()) return json({ error: "checkout_unavailable" }, 503);

  const parsed = verifySchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return json({ error: "invalid_signature", status: "unverified" }, 400);
  }

  try {
    const result = await confirmPayment(razorpay_order_id, razorpay_payment_id);
    switch (result.outcome) {
      case "paid":
        await runAfterResponse(() => processOrderTasks(result.orderId));
        return json({ status: "paid" });
      case "failed":
        return json({ status: "failed" });
      case "pending":
        return json({ status: "pending" });
      case "mismatch":
        return json({ status: "needs_review" }, 409);
      case "unknown_order":
        return json({ error: "unknown_order" }, 404);
    }
  } catch (err) {
    if (isDbDown(err)) return json({ status: "pending", error: "unavailable" }, 503);
    // Razorpay unreachable etc. The webhook will settle the order.
    console.error("[checkout/verify] could not confirm:", (err as Error).message);
    return json({ status: "pending", error: "confirmation_delayed" }, 502);
  }
}
