import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

export const metadata = pageMetadata({
  title: "Shipping & Returns",
  description: "Shipping and returns information for Arivo Objects orders.",
  path: "/shipping-returns",
});

export default function ShippingReturnsPage() {
  const { transitDays } = siteConfig.delivery;
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Shipping &amp; Returns</h1>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Shipping</h2>
            <p className="mt-2">
              <strong>Free shipping on every order.</strong> Orders are
              dispatched within 48 hours of payment, and delivery usually takes
              a further {transitDays.min}–{transitDays.max} working days
              (Monday to Saturday), depending on your pin code. Orders placed
              after {siteConfig.delivery.orderCutoffIst} IST count from the next
              working day.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Returns &amp; Refunds</h2>
            <p className="mt-2">
              We do not accept returns or exchanges for change of mind.
              Please choose carefully before ordering.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Damaged or incorrect items</h2>
            <p className="mt-2">
              If your order arrives damaged, defective, or different from
              what you ordered, contact us within{" "}
              <strong>{siteConfig.damageClaimDays} days of delivery</strong>{" "}
              with your order details and photos of the item and packaging,
              and we&rsquo;ll replace it or refund you at no cost. Reports made
              after {siteConfig.damageClaimDays} days can&rsquo;t be accepted.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
