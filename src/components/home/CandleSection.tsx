import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { Reveal } from "@/components/ui/Reveal";
import { formatPrice, getGalleryImages, getProductBySlug } from "@/lib/products";

export function CandleSection() {
  const large = getProductBySlug("scented-candle-jar-pack-of-4");
  const mini = getProductBySlug("mini-scented-candle-jar-pack-of-4");
  if (!large) return null;
  const evening = getGalleryImages(large.variants[0])[1] ?? getGalleryImages(large.variants[0])[0];

  return (
    <section className="bg-charcoal py-20 text-ivory md:py-28">
      <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-luxe text-ochre">New · Sandalwood</p>
          <h2 className="mt-4 max-w-md text-4xl leading-[1.05] md:text-6xl">
            Four jars. <em className="italic">One</em> warm scent.
          </h2>
          <p className="mt-6 max-w-sm text-base font-light leading-relaxed text-ivory/75">
            Soy wax candles scented with woody sandalwood, poured into patterned
            tins you&rsquo;ll keep long after the last burn. In two sizes, each a set of four.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={`/products/${large.slug}`}
              className="inline-block bg-ivory px-8 py-3.5 text-[11px] font-medium uppercase tracking-luxe text-charcoal transition-opacity duration-400 hover:opacity-90"
            >
              130 ml set · {formatPrice(large.price)}
            </Link>
            {mini && (
              <Link
                href={`/products/${mini.slug}`}
                className="inline-block border border-ivory/60 px-8 py-3.5 text-[11px] font-medium uppercase tracking-luxe transition-colors duration-400 hover:bg-ivory hover:text-charcoal"
              >
                Mini 50 ml set · {formatPrice(mini.price)}
              </Link>
            )}
          </div>
        </Reveal>
        <Reveal delayMs={150}>
          <ProductPicture image={evening} aspect="portrait" sizes="(min-width: 768px) 45vw, 100vw" />
        </Reveal>
      </Container>
    </section>
  );
}
