"use client";

import { useSearchParams } from "next/navigation";
import { Product } from "@/types/product";
import { ProductView } from "./ProductView";

/**
 * Reads ?variant= in the browser so the product page itself can be a
 * prebuilt static page (served instantly from the cache) instead of being
 * rendered on the server for every visit.
 */
export function ProductViewFromUrl({ product }: { product: Product }) {
  const variant = useSearchParams().get("variant") ?? undefined;
  return <ProductView key={variant ?? "default"} product={product} initialVariantId={variant} />;
}
