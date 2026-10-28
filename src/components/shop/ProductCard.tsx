import Link from "next/link";
import { Product, ProductVariant } from "@/types/product";
import { formatPrice, getGalleryImages, getMainImage, isSellable } from "@/lib/products";
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
        {product.category === "candle" && sellable && (
          <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-luxe">
            New
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <div>
          <p className="font-display text-lg leading-snug md:text-xl">{product.name}</p>
          {variant && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-charcoal/60">
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
        <p className="shrink-0 text-sm text-charcoal/70">{sellable ? formatPrice(product.price) : "Coming soon"}</p>
      </div>
    </Link>
  );
}
