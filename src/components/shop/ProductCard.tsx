import Link from "next/link";
import { Product } from "@/types/product";
import { formatPrice, getMainImage } from "@/lib/products";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
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
  );
}
