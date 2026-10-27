import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/siteConfig";

/**
 * This is intentionally NOT a live Instagram feed and does not use mock post
 * data. It's a static, on-brand grid plus a clear follow CTA. Swap in a real
 * feed once Instagram API credentials (or a feed app) are connected — see
 * README.md, "Connecting Instagram", for exact steps.
 */
export function InstagramSection() {
  const handle = siteConfig.instagramHandle;
  const href = siteConfig.instagramUrl ?? "/contact";

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Follow Arivo</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              New drops and behind the scenes.
            </p>
          </div>
          <a
            href={href}
            className="inline-block border border-charcoal px-6 py-2.5 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
          >
            {handle ? `Follow @${handle}` : "Follow on Instagram"}
          </a>
        </div>
      </Container>
    </section>
  );
}
