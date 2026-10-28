import "server-only";
import { query } from "./db";
import { getProductBySlug } from "@/lib/products";

/**
 * Verified-buyer reviews. A review can only be written from a paid order's
 * private order link, once per product per order, and stays hidden until the
 * owner approves it in /admin.
 */

export type ReviewSource = "website" | "instagram" | "whatsapp" | "in_person" | "other";

/** How a review is labelled publicly. Only website orders are "verified". */
export const SOURCE_LABEL: Record<ReviewSource, string> = {
  website: "Verified buyer",
  instagram: "Purchased via Instagram",
  whatsapp: "Purchased via WhatsApp",
  in_person: "Purchased in person",
  other: "Arivo customer",
};

export interface PublicReview {
  id: number;
  source: ReviewSource;
  productSlug: string;
  productName: string;
  rating: number;
  body: string;
  authorName: string;
  city: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  average: number;
}

export class ReviewError extends Error {
  constructor(
    public readonly code: "order_not_found" | "order_not_paid" | "not_in_order" | "already_reviewed",
    message: string
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Products on a paid order, and whether each has been reviewed already. */
export async function reviewableItems(orderId: string): Promise<{ productSlug: string; name: string; reviewed: boolean }[]> {
  const rows = await query<{ product_slug: string; name: string; reviewed: boolean }>(
    `SELECT DISTINCT ON (i.product_slug) i.product_slug, i.name,
            EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = i.order_id AND r.product_slug = i.product_slug) AS reviewed
       FROM order_items i WHERE i.order_id = $1 ORDER BY i.product_slug, i.id`,
    [orderId]
  );
  return rows.map((r) => ({ productSlug: r.product_slug, name: r.name, reviewed: r.reviewed }));
}

export async function submitReview(input: {
  token: string;
  productSlug: string;
  rating: number;
  body: string;
  authorName: string;
}): Promise<void> {
  if (!UUID_RE.test(input.token)) throw new ReviewError("order_not_found", "We couldn't find that order.");
  const order = (
    await query<{ id: string; status: string; shipping_address: { city?: string } }>(
      "SELECT id, status, shipping_address FROM orders WHERE public_token = $1",
      [input.token]
    )
  )[0];
  if (!order) throw new ReviewError("order_not_found", "We couldn't find that order.");
  if (order.status !== "paid") throw new ReviewError("order_not_paid", "Reviews can be written for paid orders only.");
  const inOrder = await query("SELECT 1 FROM order_items WHERE order_id = $1 AND product_slug = $2 LIMIT 1", [
    order.id,
    input.productSlug,
  ]);
  if (!inOrder.length) throw new ReviewError("not_in_order", "That product isn't part of this order.");

  const inserted = await query(
    `INSERT INTO reviews (order_id, product_slug, rating, body, author_name, city)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (order_id, product_slug) DO NOTHING RETURNING id`,
    [order.id, input.productSlug, input.rating, input.body, input.authorName, order.shipping_address.city?.trim() || null]
  );
  if (!inserted.length) throw new ReviewError("already_reviewed", "You've already reviewed this product. Thank you!");
}

interface ReviewRow {
  id: string;
  source: ReviewSource;
  product_slug: string;
  rating: number;
  body: string;
  author_name: string;
  city: string | null;
  created_at: Date;
}

function toPublic(r: ReviewRow): PublicReview {
  return {
    id: Number(r.id),
    source: r.source,
    productSlug: r.product_slug,
    productName: getProductBySlug(r.product_slug)?.name ?? r.product_slug,
    rating: r.rating,
    body: r.body,
    authorName: r.author_name,
    city: r.city,
    createdAt: r.created_at.toISOString(),
  };
}

export async function approvedReviews(opts: { productSlug?: string; limit?: number } = {}): Promise<PublicReview[]> {
  const rows = await query<ReviewRow>(
    `SELECT id, source, product_slug, rating, body, author_name, city, created_at FROM reviews
      WHERE status = 'approved' AND ($1::text IS NULL OR product_slug = $1)
      ORDER BY created_at DESC LIMIT $2`,
    [opts.productSlug ?? null, opts.limit ?? 30]
  );
  return rows.map(toPublic);
}

export async function reviewSummary(productSlug: string): Promise<ReviewSummary> {
  const row = (
    await query<{ count: string; average: string | null }>(
      "SELECT count(*) AS count, avg(rating) AS average FROM reviews WHERE status = 'approved' AND product_slug = $1",
      [productSlug]
    )
  )[0];
  return { count: Number(row.count), average: row.average ? Math.round(Number(row.average) * 10) / 10 : 0 };
}

/**
 * A review from a real customer who bought outside the website, entered by
 * the owner with the customer's consent. Published straight away, labelled
 * with where they bought.
 */
export async function addOfflineReview(input: {
  productSlug: string;
  rating: number;
  body: string;
  authorName: string;
  city: string | null;
  source: Exclude<ReviewSource, "website">;
  reviewedOn: string; // YYYY-MM-DD, not in the future
  consent: true;
}): Promise<number> {
  const row = (
    await query<{ id: string }>(
      `INSERT INTO reviews (order_id, product_slug, rating, body, author_name, city, source, consent_confirmed, status, created_at, moderated_at)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, 'approved', $8::date + time '12:00', now()) RETURNING id`,
      [input.productSlug, input.rating, input.body, input.authorName, input.city, input.source, input.consent, input.reviewedOn]
    )
  )[0];
  return Number(row.id);
}

export async function moderateReview(id: number, action: "approve" | "reject"): Promise<boolean> {
  const rows = await query(
    "UPDATE reviews SET status = $2, moderated_at = now() WHERE id = $1 RETURNING id",
    [id, action === "approve" ? "approved" : "rejected"]
  );
  return rows.length > 0;
}

/** Reads that must never break a page: no database → no reviews shown. */
export async function safely<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
