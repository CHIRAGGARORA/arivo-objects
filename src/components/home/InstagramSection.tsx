import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
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
    <section className="py-20 md:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Follow Arivo</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Objects, process and the studio — day to day.
            </p>
          </div>
          <a
            href={href}
            className="inline-block border border-charcoal px-6 py-2.5 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
          >
            {handle ? `Follow @${handle}` : "Follow on Instagram"}
          </a>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-2 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <a key={i} href={href} aria-label="View on Instagram">
              <PlaceholderImage alt="Arivo Objects on Instagram" aspect="square" />
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
