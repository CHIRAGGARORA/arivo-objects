import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Not a live Instagram feed: a mosaic of our own product photography that
 * links to the Instagram profile. Swap in a real feed once Instagram API
 * credentials (or a feed app) are connected — see README.md.
 */
const tiles = [
  { src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-row.webp", alt: "Four lit sandalwood candles in a row" },
  { src: "/products/small-oval-marble-tray/terracotta-marble/main.jpg", alt: "Terracotta marble tray with coffee and rings" },
  { src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp", alt: "Mini mandala candle tins from above" },
  { src: "/products/large-cloud-marble-tray/black-marble/main.jpg", alt: "The Large Cloud Marble Tray" },
  { src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp", alt: "Open candle tins with patterned lids" },
  { src: "/products/small-oval-marble-tray/ochre-marble/main.jpg", alt: "Ochre marble tray with glasses" },
];

export function InstagramSection() {
  const handle = siteConfig.instagramHandle;
  const href = siteConfig.instagramUrl ?? "/contact";

  return (
    <section className="pb-20 pt-6 md:pb-28">
      <Container>
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow">{handle ? `@${handle}` : "Instagram"}</p>
          <h2 className="mt-4 text-4xl md:text-6xl">
            Follow the <em className="italic">ritual</em>
          </h2>
          <p className="mt-4 max-w-md text-base text-charcoal/70">New drops, styling ideas and behind the scenes.</p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {tiles.map((t) => (
            <a key={t.src + t.alt} href={href} className="group relative block overflow-hidden" aria-label={`${t.alt} — view on Instagram`}>
              <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.06]">
                <ProductPicture image={{ ...t, isPlaceholder: false }} aspect="square" sizes="(min-width: 768px) 16vw, 33vw" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal/0 text-ivory opacity-0 transition-all duration-400 group-hover:bg-charcoal/35 group-hover:opacity-100">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
                </svg>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href={href} className="btn-outline">
            {handle ? `Follow @${handle}` : "Follow on Instagram"}
          </a>
        </div>
      </Container>
    </section>
  );
}
