import { z } from "zod";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { addOfflineReview } from "@/lib/server/reviews";
import { products } from "@/lib/products";
import { json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

const schema = z.object({
  productSlug: z.string().refine((s) => products.some((p) => p.slug === s), "Choose a product"),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10, "The review must be at least 10 characters").max(1000),
  authorName: z.string().trim().min(1, "Add the customer's name").max(40),
  city: z.string().trim().max(60).optional().nullable(),
  source: z.enum(["instagram", "whatsapp", "in_person", "other"]),
  reviewedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date")
    .refine((d) => d <= todayIST(), "The date can't be in the future"),
  consent: z.literal(true, { message: "Confirm this is a real customer who agreed to publish" }),
});

/** Owner adds a review from a real customer who bought offline. */
export async function POST(req: Request) {
  if (!isAdminAuthorized(req.headers.get("authorization"))) return json({ error: "unauthorized" }, 401);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "invalid_input", message: parsed.error.issues[0]?.message }, 400);
  const id = await addOfflineReview({ ...parsed.data, city: parsed.data.city || null });
  return json({ ok: true, id });
}
