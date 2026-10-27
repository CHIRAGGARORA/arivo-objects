import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function Hero() {
  return (
    <section className="relative">
      <ProductPicture
        image={{
          src: "/editorial/three-trays-shelf.jpg",
          alt: "Three Arivo marble trays in black, terracotta and ochre, styled together on a shelf",
          isPlaceholder: false,
        }}
        aspect="wide"
        className="w-full"
        priority
      />
      <Container className="py-10 md:py-14">
        <h1 className="max-w-2xl font-display text-4xl leading-[1.1] md:text-6xl">
          Decor you&rsquo;ll want to gift.
        </h1>
        <p className="mt-5 max-w-md text-base text-charcoal/75 md:text-lg">
          Candles, trays and small objects for your space, and for the people you love.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-block bg-charcoal px-7 py-3 text-sm tracking-wide text-ivory transition-opacity duration-400 hover:opacity-90"
          >
            Shop all
          </Link>
          <Link
            href="/shop?category=candle"
            className="inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
          >
            Shop candles
          </Link>
        </div>
      </Container>
    </section>
  );
}
