import { NextRequest, NextResponse } from "next/server";
import { computeTrustedOrder, getRazorpayClient, getPublicKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";

interface CustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: NextRequest) {
  let body: { lines?: unknown; customer?: CustomerInput; couponCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const customer = body.customer ?? {};
  const requiredCustomerFields: (keyof CustomerInput)[] = [
    "name",
    "email",
    "phone",
    "address1",
    "city",
    "state",
    "pincode",
  ];
  const missing = requiredCustomerFields.filter((f) => !isNonEmptyString(customer[f]));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required shipping details: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  // The ONLY thing we trust from the browser here is *what* they want to
  // buy (product + variant + quantity) and which coupon code they typed —
  // never the price, discount amount, or total. The actual amount (and the
  // coupon's real discount) is entirely re-derived server-side.
  const order = computeTrustedOrder(body.lines, body.couponCode);
  if (!order.ok) {
    return NextResponse.json({ error: order.message }, { status: order.status });
  }

  // Razorpay `notes` values must be strings, and there's a practical size
  // limit — keep this compact. Since this project has no database (see
  // README), this is the order record: it's visible per-order in the
  // Razorpay Dashboard, which is how you'll reconcile payments to
  // shipments for now.
  const cartSummary = order.lines
    .map((l) => `${l.quantity}x ${l.name} (${l.variantLabel}) @₹${l.unitPrice}`)
    .join("; ");
  const couponNote = order.couponCode
    ? ` | Coupon: ${order.couponCode} (-₹${order.discountRupees})`
    : "";

  const receipt = `arivo_${Date.now()}`;

  try {
    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: order.amountPaise,
      currency: "INR",
      receipt,
      notes: {
        customer_name: customer.name!,
        customer_email: customer.email!,
        customer_phone: customer.phone!,
        shipping_address: [
          customer.address1,
          customer.address2,
          customer.city,
          customer.state,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(", ")
          .slice(0, 500),
        cart: (cartSummary + couponNote).slice(0, 500),
      },
    });

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: getPublicKeyId(),
      subtotal_rupees: order.subtotalRupees,
      coupon_code: order.couponCode,
      discount_rupees: order.discountRupees,
      total_rupees: order.totalRupees,
    });
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err !== null && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    const razorpayError =
      typeof err === "object" && err !== null && "error" in err
        ? (err as { error?: { code?: string; description?: string } }).error
        : undefined;

    if (statusCode === 401) {
      // This 401 comes from Razorpay's own API rejecting our key_id/key_secret
      // (Basic Auth) — it happens here, in Step 1 of checkout, BEFORE the
      // payment modal ever opens. So it is a server↔Razorpay credential
      // problem, never a customer's card/payment failing. Never log the
      // secret itself — only Razorpay's own returned code/description, which
      // is safe diagnostic text.
      console.error(
        "[razorpay] create-order got HTTP 401 from Razorpay's API — this is a credential " +
          "problem (key_id/key_secret rejected by Razorpay), NOT a customer payment failure, " +
          "since it happens before the checkout modal even opens.\n" +
          `  Razorpay's error: code="${razorpayError?.code ?? "unknown"}" ` +
          `description="${razorpayError?.description ?? "none provided"}"\n` +
          "  Checklist:\n" +
          "  1. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local must be from the SAME " +
          "key pair in the Razorpay Dashboard (Settings → API Keys). Regenerating the secret " +
          "invalidates the old one — if you regenerated it, update .env.local with the new value.\n" +
          "  2. Check for stray quotes or extra spaces around either value in .env.local.\n" +
          "  3. You must FULLY RESTART `next dev` / `next start` after editing .env.local — " +
          "Next.js reads env files once at process start; it does not hot-reload them."
      );
      return NextResponse.json(
        { error: "Payment gateway authentication failed. Check server configuration." },
        { status: 401 }
      );
    }

    console.error("Razorpay order creation failed:", {
      statusCode,
      code: razorpayError?.code,
      description: razorpayError?.description,
      raw: err,
    });
    return NextResponse.json(
      { error: "Could not create the payment order. Please try again." },
      { status: 500 }
    );
  }
}
