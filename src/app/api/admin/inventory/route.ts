import { z } from "zod";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { products } from "@/lib/products";
import { query } from "@/lib/server/db";
import { json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({
  slug: z.string(),
  variantId: z.string(),
  quantity: z.number().int().min(0).max(10_000),
});

export async function POST(req: Request) {
  if (!isAdminAuthorized(req.headers.get("authorization"))) return json({ error: "unauthorized" }, 401);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const { slug, variantId, quantity } = parsed.data;
  const exists = products.some((p) => p.slug === slug && p.variants.some((v) => v.id === variantId));
  if (!exists) return json({ error: "unknown_variant" }, 400);
  await query(
    `INSERT INTO inventory (product_slug, variant_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (product_slug, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`,
    [slug, variantId, quantity]
  );
  return json({ ok: true });
}
