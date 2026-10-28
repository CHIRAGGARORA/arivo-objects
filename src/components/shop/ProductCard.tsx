import Link from "next/link";
import { Product, ProductVariant } from "@/types/product";
import { discountPercent, getGalleryImages, getMainImage, isSellable } from "@/lib/products";
import { PriceTag } from "@/components/shop/PriceTag";
import { ImageCycler } from "@/components/shop/ImageCycler";

/**
 * One product, or one colour of it when `variant` is given (the shop grid
 * shows each tray colour as its own card, linking to that colour).
 */
export function ProductCard({ product, variant }: { product: Product; variant?: ProductVariant }) {
  const v = variant ?? product.variants[0];
  const main = getMainImage(v);
  const images = [main, ...getGalleryImages(v).filter((i) => i !== main && !i.isPlaceholder)];
  const sellable = isSellable(product);
  const href = variant ? `/products/${product.slug}?variant=${variant.id}` : `/products/${product.slug}`;

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.04]">
          <ImageCycler images={images} sizes="(min-width: 768px) 33vw, 50vw" />
        </div>
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {sellable && discountPercent(product) !== null && (
            <span className="bg-terracotta px-2.5 py-1 text-xs font-semibold uppercase tracking-wide2 text-ivory">
              {discountPercent(product)}% off
            </span>
          )}
          {product.category === "candle" && sellable && (
            <span className="bg-ivory/90 px-2.5 py-1 text-xs font-medium uppercase tracking-luxe">New</span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div>
          <p className="font-display text-xl font-semibold leading-snug md:text-2xl">{product.name}</p>
          {variant && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal/70">
              {variant.colorSwatch && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-charcoal/20"
                  style={{ backgroundColor: variant.colorSwatch }}
                  aria-hidden="true"
                />
              )}
              {variant.label}
            </p>
          )}
        </div>
        <p className="mt-2">{sellable ? <PriceTag product={product} badge={false} /> : <span className="text-sm text-charcoal/70">Coming soon</span>}</p>
      </div>
    </Link>
  );
}
