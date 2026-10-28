import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { Reveal } from "@/components/ui/Reveal";

const rituals = [
  {
    eyebrow: "Candles",
    title: "Slow evenings",
    cta: "Shop candles",
    href: "/shop?category=candle",
    src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-evening.webp",
    alt: "Sandalwood candles burning beside a sofa in the evening",
  },
  {
    eyebrow: "Marble trays",
    title: "A place for everything",
    cta: "Shop trays",
    href: "/shop?category=tray",
    src: "/editorial/three-trays-shelf.jpg",
    alt: "Marble trays holding keys, a watch and a candle",
  },
  {
    eyebrow: "Gifting",
    title: "Made to gift",
    cta: "Shop the mini set",
    href: "/products/mini-scented-candle-jar-pack-of-4",
    src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-festive.webp",
    alt: "Mini candle tins on a festive tray with marigolds and a gift box",
  },
];

export function ShopByRitual() {
  return (
    <section className="py-20 md:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Shop by ritual</p>
          <h2 className="mt-4 text-4xl leading-tight md:text-6xl">
            Small objects for <em className="italic text-terracotta">everyday</em> rituals
          </h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {rituals.map((r, i) => (
            <Reveal key={r.title} delayMs={i * 140}>
              <Link href={r.href} className="group relative block overflow-hidden">
                <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.05]">
                  <ProductPicture image={{ src: r.src, alt: r.alt, isPlaceholder: false }} aspect="portrait" sizes="(min-width: 768px) 33vw, 100vw" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-ivory md:p-8">
                  <p className="text-[10px] font-medium uppercase tracking-luxe text-ivory/75">{r.eyebrow}</p>
                  <h3 className="mt-2 text-3xl md:text-4xl">{r.title}</h3>
                  <p className="mt-4 inline-block border-b border-ivory/60 pb-1 text-[11px] font-medium uppercase tracking-luxe transition-colors duration-400 group-hover:border-ivory">
                    {r.cta}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
