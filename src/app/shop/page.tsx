import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shop",
  description: "Home decor and gifts — scented candle jar sets and marble trays. Free shipping, dispatched within 48 hours.",
  path: "/shop",
});

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ colour?: string; category?: string }>;
}) {
  const params = await searchParams;
  const colour = params.colour;
  const category = params.category === "candle" || params.category === "tray"
    ? params.category
    : undefined;

  // "Shop by colourway" on the homepage links here with ?colour=<variant id>.
  // Filter to products that actually offer that variant, rather than
  // ignoring the parameter — same grid, same cards, just a subset of them.
  const matchedVariant = colour
    ? products.flatMap((p) => p.variants).find((v) => v.id === colour)
    : undefined;
  const byColour = colour
    ? products.filter((p) => p.variants.some((v) => v.id === colour))
    : products;
  const visibleProducts = category ? byColour.filter((p) => p.category === category) : byColour;

  const tabs = [
    { label: "All", href: "/shop", active: !category },
    { label: "Candles", href: "/shop?category=candle", active: category === "candle" },
    { label: "Trays", href: "/shop?category=tray", active: category === "tray" },
  ];

  return (
    <div className="py-16 md:py-20">
      <Container>
        <p className="eyebrow">Arivo Objects</p>
        <h1 className="mt-3 text-5xl md:text-6xl">Shop</h1>
        <p className="mt-3 max-w-md text-sm text-charcoal/70">
          Home decor and gifts. Free shipping on every order, dispatched within 48 hours.
        </p>

        <nav aria-label="Filter by category" className="mt-6 flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`rounded-full border px-5 py-2 text-[11px] font-medium uppercase tracking-luxe transition-colors duration-400 ${
                t.active
                  ? "border-charcoal bg-charcoal text-ivory"
                  : "border-sand text-charcoal/80 hover:border-charcoal"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {colour && (
          <p className="mt-4 text-sm text-charcoal/70">
            Showing: {matchedVariant?.label ?? colour}
            {" · "}
            <Link href="/shop" className="underline hover:no-underline">
              View all
            </Link>
          </p>
        )}

        <div id="collection" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
          {visibleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </Container>
    </div>
  );
}
