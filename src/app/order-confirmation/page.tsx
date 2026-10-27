import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getRazorpayClient } from "@/lib/razorpay";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Order Confirmation",
  description: "Your Arivo Objects order confirmation.",
  path: "/order-confirmation",
});

/**
 * Deliberately a Server Component that re-fetches the payment from Razorpay
 * directly on render, rather than trusting `order_id`/`payment_id` query
 * params at face value. Anyone could type a plausible-looking URL here —
 * only an actual, server-verified "captured" status from Razorpay, matched
 * to the order_id in the URL, unlocks the success view.
 */
export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { order_id?: string; payment_id?: string };
}) {
  const { order_id, payment_id } = searchParams;

  let verified = false;
  let errorMessage = "";
  let amountPaise: number | null = null;

  if (!order_id || !payment_id) {
    errorMessage = "Missing order reference.";
  } else {
    try {
      const razorpay = getRazorpayClient();
      const payment = await razorpay.payments.fetch(payment_id);

      if (payment.status === "captured" && payment.order_id === order_id) {
        verified = true;
        amountPaise =
          typeof payment.amount === "number" ? payment.amount : Number(payment.amount);
      } else {
        errorMessage = "This payment could not be confirmed as captured.";
      }
    } catch (err) {
      console.error("Order confirmation: verification failed:", err);
      errorMessage = "We couldn't verify this payment right now.";
    }
  }

  if (!verified) {
    return (
      <div className="py-16 md:py-24">
        <Container className="max-w-xl text-center">
          <h1 className="font-display text-3xl md:text-5xl">We couldn&rsquo;t confirm this order</h1>
          <p className="mt-4 text-sm text-charcoal/70">
            {errorMessage ||
              "Please check your email for a payment confirmation, or contact us with your payment reference."}
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
          >
            Contact us
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-xl text-center">
        <h1 className="font-display text-3xl md:text-5xl">Thank you</h1>
        <p className="mt-4 text-sm text-charcoal/70">
          Your order has been received and payment confirmed.
        </p>

        <div className="mt-8 border border-sand/60 p-6 text-left text-sm text-charcoal/80">
          <p>
            Order reference: <span className="font-medium">{order_id}</span>
          </p>
          <p className="mt-1">
            Payment ID: <span className="font-medium">{payment_id}</span>
          </p>
          {amountPaise !== null && (
            <p className="mt-1">
              Amount paid:{" "}
              <span className="font-medium">
                ₹{(amountPaise / 100).toLocaleString("en-IN")}
              </span>
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-charcoal/70">
          Your order will be dispatched within 48 hours, and we&rsquo;ll be in touch with
          dispatch details. See{" "}
          <Link href="/shipping-returns" className="underline hover:no-underline">
            Shipping &amp; Returns
          </Link>{" "}
          for more.
        </p>

        <Link
          href="/shop"
          className="mt-8 inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
        >
          Continue shopping
        </Link>
      </Container>
    </div>
  );
}
