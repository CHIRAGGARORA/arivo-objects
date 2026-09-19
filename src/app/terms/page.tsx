import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for using the Arivo Objects website.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Terms &amp; Conditions</h1>

        <div className="mt-6 border border-ochre/50 bg-ochre/10 px-5 py-4 text-sm text-charcoal/80">
          <strong>Draft — for review.</strong> Placeholder structure only.
          Should be completed and reviewed by an Indian lawyer/CA before
          launch — particularly the sections on GSTIN, business identity,
          payment terms, and liability, which cannot be finalised until GST
          registration and a payment gateway are in place.
        </div>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Business identity</h2>
            <p className="mt-2">
              Legal business name: [BUSINESS_NAME_PENDING]. GSTIN:
              [GST_PENDING]. This section will be completed once registration
              is finalised.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Orders and payment</h2>
            <p className="mt-2">
              Online payment is not yet live: [GATEWAY_PENDING]. Terms
              governing order acceptance, pricing, and payment will be added
              once a payment gateway is connected.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Product variation</h2>
            <p className="mt-2">
              Each Arivo object is individually hand-cast. Marble patterns and
              minor surface characteristics vary naturally between pieces;
              this is expected and does not, by itself, constitute a defect.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
