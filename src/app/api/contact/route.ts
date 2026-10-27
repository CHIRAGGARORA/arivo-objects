import { contactSchema, fieldErrors } from "@/lib/server/validation";
import { config } from "@/lib/server/config";
import { query } from "@/lib/server/db";
import { contactNotificationEmail, emailConfigured, sendEmail } from "@/lib/server/email";
import { isDbDown, json, rateLimited, readJson, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!config.databaseUrl()) return json({ error: "unavailable", message: "The contact form isn't available yet." }, 503);

  const parsed = contactSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    // A filled honeypot looks like success to the bot but stores nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return json({ ok: true });
    return json({ error: "invalid_input", fields: fieldErrors(parsed.error) }, 400);
  }

  try {
    if (await rateLimited(req, "contact", 5, 3600)) {
      return json({ error: "rate_limited", message: "Too many messages. Please try again later." }, 429);
    }
    const { name, email, message } = parsed.data;
    const row = (
      await query<{ id: number }>(
        "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING id",
        [name, email, message]
      )
    )[0];

    // The message is saved either way; notification failure is recorded for the admin page.
    const owner = config.resend().ownerEmail;
    if (emailConfigured() && owner) {
      try {
        await sendEmail(contactNotificationEmail({ id: row.id, name, email, message }, owner));
        await query("UPDATE contact_messages SET notified_at = now() WHERE id = $1", [row.id]);
      } catch (err) {
        await query("UPDATE contact_messages SET notify_error = $2 WHERE id = $1", [
          row.id,
          (err as Error).message.slice(0, 500),
        ]);
      }
    } else {
      await query("UPDATE contact_messages SET notify_error = 'Email not configured' WHERE id = $1", [row.id]);
    }
    return json({ ok: true });
  } catch (err) {
    if (isDbDown(err)) return serviceUnavailable("We couldn't save your message just now. Please try again shortly.");
    throw err;
  }
}
