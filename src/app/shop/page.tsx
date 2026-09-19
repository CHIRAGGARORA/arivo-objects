import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shop",
  description: "The first Arivo Objects collection — trays and a candle vessel, cast by hand in Jesmonite.",
  path: "/shop",
});

export default function ShopPage() {
  return (
    <div className="py-16 md:py-20">
      <Container>
        <h1 className="font-display text-3xl md:text-4xl">Shop</h1>
        <p className="mt-3 max-w-md text-sm text-charcoal/70">
          The first collection. Each piece is individually cast, so expect
          natural variation in marbling from the image shown.
        </p>

        <div id="collection" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </Container>
    </div>
  );
}
