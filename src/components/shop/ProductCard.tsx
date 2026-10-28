import Link from "next/link";
import { Product } from "@/types/product";
import { formatPrice, getGalleryImages, getMainImage, isSellable } from "@/lib/products";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  const main = getMainImage(variant);
  // Second photo fades in on hover, the way most decor stores do it.
  const hover = getGalleryImages(variant).find((i) => i !== main && !i.isPlaceholder);
  const sellable = isSellable(product);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.04]">
          <ProductPicture image={main} aspect="portrait" sizes="(min-width: 768px) 33vw, 50vw" />
          {hover && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
              <ProductPicture image={hover} aspect="portrait" sizes="(min-width: 768px) 33vw, 50vw" />
            </div>
          )}
        </div>
        {product.category === "candle" && sellable && (
          <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-luxe">
            New
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <p className="font-display text-lg leading-snug md:text-xl">{product.name}</p>
        <p className="shrink-0 text-sm text-charcoal/70">{sellable ? formatPrice(product.price) : "Coming soon"}</p>
      </div>
    </Link>
  );
}
