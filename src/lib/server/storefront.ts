import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { query } from "./db";
import { approvedReviews, reviewSummary, safely } from "./reviews";
import { sellableVariantKeys } from "./catalog";

/**
 * Cached reads for the public pages, so product, shop and home pages can be
 * served from Vercel's cache instead of querying the database per visit.
 * Anything that changes stock or reviews calls refreshStorefront().
 */

const TAG = "storefront";
const FIVE_MINUTES = 300;

const stockLevels = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const rows = await query<{ product_slug: string; variant_id: string; quantity: number }>(
      "SELECT product_slug, variant_id, quantity FROM inventory"
    );
    return Object.fromEntries(rows.map((r) => [`${r.product_slug}/${r.variant_id}`, r.quantity]));
  },
  ["stock-levels"],
  { revalidate: FIVE_MINUTES, tags: [TAG] }
);

/**
 * Sellable variants with no stock (or no stock row), shown as "Sold out".
 * Unknown (database unreachable) → nothing is marked sold out; checkout still
 * checks stock itself.
 */
export async function soldOutVariantKeys(): Promise<string[]> {
  const levels = await safely(stockLevels, null);
  if (!levels) return [];
  return sellableVariantKeys().filter((key) => (levels[key] ?? 0) <= 0);
}

export const cachedApprovedReviews = unstable_cache(
  (productSlug: string | null, limit: number) => approvedReviews({ productSlug: productSlug ?? undefined, limit }),
  ["approved-reviews"],
  { revalidate: FIVE_MINUTES, tags: [TAG] }
);

export const cachedReviewSummary = unstable_cache((productSlug: string) => reviewSummary(productSlug), ["review-summary"], {
  revalidate: FIVE_MINUTES,
  tags: [TAG],
});

/**
 * Marks cached storefront data stale after stock or reviews change. Visitors
 * keep getting the cached page instantly while a fresh one is built in the
 * background (checkout always checks stock live). A no-op outside a Next.js
 * request (tests, scripts).
 */
export function refreshStorefront() {
  try {
    revalidateTag(TAG, "max");
  } catch {
    // Not inside a Next.js request — nothing cached to refresh.
  }
}
