import { NextRequest, NextResponse } from "next/server";
import { computeTrustedOrder } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Lets the checkout UI preview a coupon's discount before the customer
 * pays — no Razorpay order is created here. Re-uses computeTrustedOrder so
 * the previewed discount is computed exactly the same way the real charge
 * will be, from trusted server-side data (never from the browser).
 */
export async function POST(req: NextRequest) {
  let body: { lines?: unknown; couponCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const order = computeTrustedOrder(body.lines, body.couponCode);
  if (!order.ok) {
    return NextResponse.json({ error: order.message }, { status: order.status });
  }

  return NextResponse.json({
    coupon_code: order.couponCode,
    subtotal_rupees: order.subtotalRupees,
    discount_rupees: order.discountRupees,
    total_rupees: order.totalRupees,
  });
}
