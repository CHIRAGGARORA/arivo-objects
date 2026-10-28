import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Container className="grid grid-cols-1 items-center gap-10 pb-16 pt-10 md:pb-24 md:pt-14 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <p className="eyebrow">Arivo Objects · Home &amp; gifting</p>
          <h1 className="mt-5 text-[2.9rem] leading-[1.02] md:text-7xl">
            Decor you&rsquo;ll <em className="italic text-terracotta">want</em> to gift.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal/75 md:text-lg">
            Hand-poured marble trays and sandalwood soy wax candles, made to be
            kept, lit and passed on to the people you love.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              Shop all
            </Link>
            <Link href="/shop?category=candle" className="btn-outline">
              Shop candles
            </Link>
          </div>
        </div>

        <div className="order-1 grid grid-cols-2 gap-3 md:gap-5 lg:order-2 lg:col-span-7">
          <ProductPicture
            image={{
              src: "/editorial/three-trays-styled.jpg",
              alt: "Arivo marble trays in black, terracotta and ochre, styled together",
              isPlaceholder: false,
            }}
            aspect="portrait"
            sizes="(min-width: 1024px) 30vw, 50vw"
            priority
          />
          <ProductPicture
            image={{
              src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-row.webp",
              alt: "Four lit sandalwood candles in patterned jars",
              isPlaceholder: false,
            }}
            aspect="portrait"
            className="mt-10 md:mt-16"
            sizes="(min-width: 1024px) 30vw, 50vw"
            priority
          />
        </div>
      </Container>
    </section>
  );
}
