import { fieldErrors, newsletterSchema } from "@/lib/server/validation";
import { config } from "@/lib/server/config";
import { query } from "@/lib/server/db";
import { isDbDown, json, rateLimited, readJson, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Stores consented subscribers only. Nothing is emailed from here — the list
 * is for the owner to use deliberately once a newsletter exists.
 */
export async function POST(req: Request) {
  if (!config.databaseUrl()) return json({ error: "unavailable", message: "Sign-up isn't available yet." }, 503);

  const parsed = newsletterSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return json({ ok: true });
    return json({ error: "invalid_input", fields: fieldErrors(parsed.error) }, 400);
  }

  try {
    if (await rateLimited(req, "newsletter", 10, 3600)) {
      return json({ error: "rate_limited", message: "Too many attempts. Please try again later." }, 429);
    }
    // Same response whether new or existing, so the form can't be used to
    // discover who is subscribed.
    await query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET status = 'subscribed', consented_at = now()`,
      [parsed.data.email]
    );
    return json({ ok: true });
  } catch (err) {
    if (isDbDown(err)) return serviceUnavailable();
    throw err;
  }
}
