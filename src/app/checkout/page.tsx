import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container } from "@/components/ui/Container";
import { checkoutBlockReason, razorpayMode } from "@/lib/server/config";
import { availableCoupons } from "@/lib/server/coupons";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  const enabled = checkoutBlockReason() === null;
  return (
    <div className="py-12 md:py-20">
      <Container className="max-w-5xl">
        <h1 className="font-display text-3xl md:text-5xl">Checkout</h1>
        {razorpayMode() === "test" && enabled && (
          <p className="mt-4 border border-terracotta/40 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
            Test mode — no real money will be charged. Use Razorpay test cards or UPI test IDs.
          </p>
        )}
        {enabled ? (
          <CheckoutForm
            shippingFeeInr={siteConfig.shippingFeeInr}
            coupons={availableCoupons()}
          />
        ) : (
          <p className="mt-8 text-sm text-charcoal/70">Online checkout isn&rsquo;t available yet.</p>
        )}
      </Container>
    </div>
  );
}
