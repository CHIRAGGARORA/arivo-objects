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
          <strong>GST registration pending.</strong> Arivo Objects is not yet
          GST-registered. Our legal business name and GSTIN will be added to
          this page once registration is complete.
        </div>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Business identity</h2>
            <p className="mt-2">
              Our legal business name and GSTIN will be added here once
              registration is finalised.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Orders and payment</h2>
            <p className="mt-2">
              Online payment is processed securely through Razorpay. By
              placing an order, you confirm the shipping and contact details
              you provide are accurate. An order is confirmed once payment is
              successfully captured; prices and availability are as shown at
              checkout.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Returns &amp; refunds</h2>
            <p className="mt-2">
              See our{" "}
              <a href="/shipping-returns" className="underline hover:no-underline">
                Shipping &amp; Returns
              </a>{" "}
              page for our full policy.
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
