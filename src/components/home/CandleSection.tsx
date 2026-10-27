import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { formatPrice, getMainImage, getProductBySlug } from "@/lib/products";

export function CandleSection() {
  const product = getProductBySlug("scented-candle-jar-pack-of-4");
  if (!product) return null;

  return (
    <section className="bg-charcoal py-16 text-ivory md:py-24">
      <Container className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20">
        <div>
          <p className="text-xs uppercase tracking-wide2 text-ivory/60">New · Scented candles</p>
          <h2 className="mt-3 max-w-md font-display text-3xl leading-tight md:text-5xl">
            Four jars. One scent.
          </h2>
          <p className="mt-5 max-w-sm text-base text-ivory/75">
            A pack of four patterned candle jars in sandalwood. Easy to gift, easy
            to keep. More fragrances coming soon.
          </p>
          <Link
            href={`/products/${product.slug}`}
            className="mt-8 inline-block bg-ivory px-7 py-3 text-sm tracking-wide text-charcoal transition-opacity duration-400 hover:opacity-90"
          >
            Shop the 4-pack · {formatPrice(product.price)}
          </Link>
        </div>
        <ProductPicture image={getMainImage(product.variants[0])} aspect="square" />
      </Container>
    </section>
  );
}
