import { timingSafeEqual, createHash } from "node:crypto";

/**
 * HTTP Basic auth for /admin. Username is "admin"; the password comes from
 * ADMIN_PASSWORD. With no password configured, admin is disabled entirely.
 * (No "server-only" import: proxy.ts uses this too.)
 */
export function isAdminAuthorized(authHeader: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password || password.length < 12) return false;
  if (!authHeader?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const user = decoded.slice(0, sep);
  const given = decoded.slice(sep + 1);
  // Compare fixed-length digests so timing doesn't leak the password length.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(password).digest();
  return user === "admin" && timingSafeEqual(a, b);
}
