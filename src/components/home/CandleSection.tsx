"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { Reveal } from "@/components/ui/Reveal";
import { formatPrice, getGalleryImages, getProductBySlug } from "@/lib/products";

const SETS = [
  {
    slug: "scented-candle-jar-pack-of-4",
    label: "130 ml set",
    photo: 1, // the evening scene
    blurb: "Four 130 ml soy wax candles in sky blue, mustard, pink-and-teal and red tins. Made for long evenings and festive tables.",
  },
  {
    slug: "mini-scented-candle-jar-pack-of-4",
    label: "Mini 50 ml set",
    photo: 1, // the festive tray
    blurb: "Four petite 50 ml candles in mandala-printed tins. A thoughtful small gift, or one for every corner of the house.",
  },
] as const;

/**
 * The two candle sets side by side: the buttons switch the set shown here
 * (no navigation); tapping the photo opens that set's page.
 */
export function CandleSection() {
  const [selected, setSelected] = useState(0);
  const sets = SETS.map((s) => {
    const product = getProductBySlug(s.slug)!;
    const images = getGalleryImages(product.variants[0]);
    return { ...s, product, image: images[s.photo] ?? images[0] };
  });
  const current = sets[selected];

  return (
    <section className="relative overflow-hidden bg-charcoal py-20 text-ivory md:py-32">
      <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
        <Reveal className="md:col-span-5">
          <p className="text-xs font-medium uppercase tracking-luxe text-ochre">New · Sandalwood</p>
          <h2 className="mt-5 text-5xl leading-[1.02] md:text-7xl">
            Four jars. <em className="italic">One</em> warm scent.
          </h2>
          <p className="mt-7 max-w-sm text-base leading-relaxed text-ivory/75">
            Soy wax and cotton wicks, scented with woody sandalwood and poured into patterned tins you&rsquo;ll keep
            long after the last burn.
          </p>

          <div className="mt-10 inline-flex border border-ivory/25 p-1" role="group" aria-label="Choose a candle set">
            {sets.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
                className={`px-5 py-3 text-xs font-medium uppercase tracking-luxe transition-colors duration-400 md:px-7 ${
                  selected === i ? "bg-ivory text-charcoal" : "text-ivory/75 hover:text-ivory"
                }`}
              >
                {s.label} · {formatPrice(s.product.price)}
              </button>
            ))}
          </div>

          <p key={current.slug} className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/70" aria-live="polite">
            {current.blurb}
          </p>
          <Link
            href={`/products/${current.product.slug}`}
            className="mt-6 inline-block text-xs font-medium uppercase tracking-luxe text-ivory underline-offset-8 hover:underline"
          >
            Discover the {current.label} &rarr;
          </Link>
        </Reveal>

        <div className="md:col-span-7">
          <Link href={`/products/${current.product.slug}`} className="group relative block overflow-hidden" aria-label={`View the ${current.product.name}`}>
            {sets.map((s, i) => (
              <div
                key={s.slug}
                className={`${i === 0 ? "" : "absolute inset-0"} transition-opacity duration-700 ${selected === i ? "opacity-100" : "opacity-0"}`}
                aria-hidden={selected === i ? undefined : true}
              >
                <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.03]">
                  <ProductPicture image={s.image} aspect="portrait" sizes="(min-width: 768px) 55vw, 100vw" />
                </div>
              </div>
            ))}
            <span className="absolute bottom-5 left-5 z-10 bg-ivory/90 px-4 py-2 text-xs font-medium uppercase tracking-luxe text-charcoal">
              {current.product.name}
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
