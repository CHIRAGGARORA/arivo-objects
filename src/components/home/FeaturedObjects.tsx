import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { getFeaturedProducts, formatPrice, getMainImage } from "@/lib/products";

export function FeaturedObjects() {
  const products = getFeaturedProducts();

  return (
    <section className="py-20 md:py-28">
      <Container>
        <h2 className="font-display text-2xl md:text-3xl">The first collection</h2>
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {products.map((product) => (
            <Link key={product.slug} href={`/products/${product.slug}`} className="group block">
              <ProductPicture
                image={getMainImage(product.variants[0])}
                aspect="portrait"
                className="transition-opacity duration-400 group-hover:opacity-90"
              />
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-sm">{product.name}</p>
                <p className="text-sm text-charcoal/70">{formatPrice(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
