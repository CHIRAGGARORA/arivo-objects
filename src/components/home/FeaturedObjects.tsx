import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { getFeaturedProducts } from "@/lib/products";

export function FeaturedObjects() {
  const products = getFeaturedProducts();

  return (
    <section className="py-20 md:py-28">
      <Container>
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Objects for slow living</h2>
          </div>
          <Link href="/shop" className="hidden text-[11px] uppercase tracking-luxe underline-offset-4 hover:underline sm:block">
            View all
          </Link>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.slug} delayMs={i * 120}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
