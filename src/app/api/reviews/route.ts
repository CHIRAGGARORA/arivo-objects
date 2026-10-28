import { reviewSchema, fieldErrors } from "@/lib/server/validation";
import { config } from "@/lib/server/config";
import { ReviewError, submitReview } from "@/lib/server/reviews";
import { isDbDown, json, rateLimited, readJson, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!config.databaseUrl()) return serviceUnavailable();
  const parsed = reviewSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return json({ ok: true });
    return json({ error: "invalid_input", fields: fieldErrors(parsed.error) }, 400);
  }
  try {
    if (await rateLimited(req, "review", 10, 3600)) {
      return json({ error: "rate_limited", message: "Too many reviews. Please try again later." }, 429);
    }
    const { token, productSlug, rating, body, authorName } = parsed.data;
    await submitReview({ token, productSlug, rating, body, authorName });
    return json({ ok: true });
  } catch (err) {
    if (err instanceof ReviewError) return json({ error: err.code, message: err.message }, err.code === "order_not_found" ? 404 : 400);
    if (isDbDown(err)) return serviceUnavailable();
    throw err;
  }
}
