"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { getGalleryImages, getLifestyleImage } from "@/lib/products";

/**
 * ProductView owns `variantId` — the ONE source of truth for which colour
 * is selected on this page. Both the gallery (via getGalleryImages) and the
 * info panel (swatches, Add to Cart, Buy Now) read from and write to this
 * single piece of state, so they can never disagree about which variant is
 * currently shown.
 *
 * Previously the product page (a Server Component) hardcoded
 * `product.variants[0]` and passed those images straight into
 * ProductGallery, while ProductInfo tracked the selected swatch in its own
 * separate, disconnected useState. The two never talked to each other,
 * which is why changing colour updated the swatch and the cart correctly
 * but never updated the visible gallery. Lifting the state here fixes that
 * at the source rather than patching around it.
 */
export function ProductView({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0].id);

  const selectedVariant =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  const lifestyleImage = getLifestyleImage(selectedVariant);

  return (
    <>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={getGalleryImages(selectedVariant)} />
        <ProductInfo product={product} variantId={variantId} onVariantChange={setVariantId} />
      </div>

      {lifestyleImage && (
        <div className="mt-16 md:mt-24">
          <ProductPicture image={lifestyleImage} aspect="wide" className="w-full" />
        </div>
      )}
    </>
  );
}
