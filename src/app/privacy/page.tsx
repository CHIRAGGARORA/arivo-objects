import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Arivo Objects handles personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Privacy Policy</h1>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Information we collect</h2>
            <p className="mt-2">
              When you check out: your name, shipping address, email and
              phone number, collected to fulfil and communicate about your
              order. If you submit the newsletter or contact form, we
              collect the email address or details you provide there.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Payment processing</h2>
            <p className="mt-2">
              Payments are processed by Razorpay. We do not see, handle, or
              store your card, UPI or banking details — Razorpay processes
              these directly and according to their own privacy and
              security practices. We only receive confirmation that a
              payment was made, along with the order details you provided.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">How information is used</h2>
            <p className="mt-2">
              Order details (name, shipping address, email, phone) are used
              to fulfil and communicate about that order. Analytics
              (Google Analytics) and advertising (Meta Pixel) are not yet
              connected; this section will be completed with their specific
              data use before either is added.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Contact</h2>
            <p className="mt-2">
              {siteConfig.email ? (
                <>For privacy questions: {siteConfig.email}.</>
              ) : (
                <>
                  A dedicated privacy contact email will be added here before
                  launch. In the meantime, reach out via the{" "}
                  <a href="/contact" className="underline hover:no-underline">
                    Contact page
                  </a>
                  .
                </>
              )}
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
