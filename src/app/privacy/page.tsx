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

        <div className="mt-6 border border-ochre/50 bg-ochre/10 px-5 py-4 text-sm text-charcoal/80">
          <strong>Draft — for review.</strong> This is a placeholder structure,
          not a final legal document. It should be reviewed and completed by
          an Indian lawyer or CA familiar with the Information Technology
          Act, 2000 (and DPDP Act, 2023 obligations) before publishing live,
          especially once real checkout, analytics and marketing tools are
          connected.
        </div>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Information we collect</h2>
            <p className="mt-2">
              Once checkout is live: name, shipping address, email, and order
              details, collected to fulfil orders. Currently, the site may
              collect an email address only if you submit the newsletter or
              contact form.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">How information is used</h2>
            <p className="mt-2">
              To be completed once analytics (Google Analytics), advertising
              (Meta Pixel) and order-processing systems are connected. Each
              tool&rsquo;s data use will be listed here before it goes live.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Contact</h2>
            <p className="mt-2">
              For privacy questions: {siteConfig.email ?? "[BUSINESS_EMAIL_PENDING]"}.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
