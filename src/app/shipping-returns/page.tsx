import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shipping & Returns",
  description: "Shipping and returns information for Arivo Objects orders.",
  path: "/shipping-returns",
});

export default function ShippingReturnsPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Shipping &amp; Returns</h1>

        <div className="mt-6 border border-ochre/50 bg-ochre/10 px-5 py-4 text-sm text-charcoal/80">
          <strong>Draft — not final.</strong> This page is a placeholder structure.
          Shipping partner, timelines, costs, and the returns/refund policy have
          not been finalised and should be reviewed with an Indian CA or lawyer
          before launch, and before this page is published live.
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Shipping</h2>
            <p className="mt-2">
              Shipping partner: <em>[SHIPPING_PROVIDER_PENDING]</em>. Dispatch
              timelines will be confirmed once a shipping partner is selected.
              Because each object is individually cast and finished by hand,
              dispatch may take longer than a mass-produced item.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Returns &amp; Refunds</h2>
            <p className="mt-2">
              Return and refund policy: <em>[RETURNS_POLICY_PENDING]</em>. This
              section will state clearly what can be returned, the return
              window, condition requirements, and how refunds are processed,
              once finalised.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Damaged or incorrect items</h2>
            <p className="mt-2">
              Process for reporting damaged or incorrect items:{" "}
              <em>[DAMAGE_POLICY_PENDING]</em>.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
