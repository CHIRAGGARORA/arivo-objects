import "server-only";
import { randomUUID } from "node:crypto";
import { query } from "./db";
import { POST as contact } from "@/app/api/contact/route";
import { POST as newsletter } from "@/app/api/newsletter/route";

/** Marker domain for self-test rows; .invalid can never receive mail. */
const MARKER = "@selftest.invalid";

function post(path: string, body: unknown) {
  return new Request(`https://selftest.local${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": `selftest-${randomUUID()}` },
    body: JSON.stringify(body),
  });
}

/**
 * Exercises the deployed contact + newsletter handlers against the real
 * database, verifies both rows persisted, then removes only those rows.
 */
export async function formsSelfTest(): Promise<string> {
  const id = randomUUID().slice(0, 8);
  const email = `selftest+${id}${MARKER}`;
  try {
    const c = await contact(post("/api/contact", { name: "Self test", email, message: `Automated persistence check ${id}` }));
    if (c.status !== 200) throw new Error(`contact handler returned ${c.status}`);
    const n = await newsletter(post("/api/newsletter", { email, consent: true }));
    if (n.status !== 200) throw new Error(`newsletter handler returned ${n.status}`);

    const saved = await query<{ contact: string; subs: string; notified: string }>(
      `SELECT (SELECT count(*) FROM contact_messages WHERE email = $1) AS contact,
              (SELECT count(*) FROM newsletter_subscribers WHERE email = $1) AS subs,
              (SELECT coalesce(max(CASE WHEN notified_at IS NOT NULL THEN 'emailed owner' ELSE notify_error END), 'n/a')
                 FROM contact_messages WHERE email = $1) AS notified`,
      [email]
    );
    const r = saved[0];
    if (r.contact !== "1" || r.subs !== "1") throw new Error(`expected 1+1 rows, found ${r.contact}+${r.subs}`);
    return `contact + newsletter saved via the real handlers (contact notification: ${r.notified}); test rows removed`;
  } finally {
    await query("DELETE FROM contact_messages WHERE email LIKE $1", [`selftest+%${MARKER}`]);
    await query("DELETE FROM newsletter_subscribers WHERE email LIKE $1", [`selftest+%${MARKER}`]);
  }
}
