import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, verifyPaymentSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export async function POST(req: NextRequest) {
  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false, error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { verified: false, error: "Missing payment verification fields." },
      { status: 400 }
    );
  }

  // Step 1: signature proves this response genuinely came from Razorpay and
  // wasn't forged by a client that just skipped straight to "success".
  const signatureValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!signatureValid) {
    return NextResponse.json(
      { verified: false, error: "Payment signature verification failed." },
      { status: 400 }
    );
  }

  // Step 2: belt-and-braces — also fetch the payment's actual status from
  // Razorpay directly, rather than trusting signature validity alone to
  // mean "money has actually been captured."
  try {
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          verified: false,
          error: `Payment status is "${payment.status}", not captured.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (err) {
    console.error("Razorpay payment status check failed:", err);
    return NextResponse.json(
      { verified: false, error: "Could not confirm payment status." },
      { status: 500 }
    );
  }
}
