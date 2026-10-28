import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopFilter, ShopGrid, type ShopCard } from "@/components/shop/ShopFilter";
import { products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shop",
  description: "Home decor and gifts — scented candle jar sets and marble trays. Free shipping, dispatched within 48 hours.",
  path: "/shop",
});

// Prebuilt and served from the cache (filtering happens in the browser);
// refreshed in the background so "Sold out" stays current.
export const revalidate = 300;

export default function ShopPage() {
  // A product sold in several colours gets one card per colour.
  const cards: ShopCard[] = products.flatMap((product) =>
    product.variants.length > 1 && (product.variantLabel ?? "Colour") === "Colour"
      ? product.variants.map((v) => ({
          key: `${product.slug}/${v.id}`,
          category: product.category,
          variantIds: [v.id],
          node: <ProductCard product={product} variant={v} />,
        }))
      : [
          {
            key: product.slug,
            category: product.category,
            variantIds: product.variants.map((v) => v.id),
            node: <ProductCard product={product} />,
          },
        ]
  );
  const colourLabels = Object.fromEntries(products.flatMap((p) => p.variants.map((v) => [v.id, v.label])));

  return (
    <div className="py-16 md:py-20">
      <Container>
        <p className="eyebrow">Arivo Objects</p>
        <h1 className="mt-3 text-5xl md:text-6xl">Shop</h1>
        <p className="mt-3 max-w-md text-sm text-charcoal/70">
          Home decor and gifts. Free shipping on every order, dispatched within 48 hours.
        </p>
        <Suspense fallback={<ShopGrid cards={cards} />}>
          <ShopFilter cards={cards} colourLabels={colourLabels} />
        </Suspense>
      </Container>
    </div>
  );
}
