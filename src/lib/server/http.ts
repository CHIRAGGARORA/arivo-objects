import "server-only";
import { createHash } from "node:crypto";
import { after, NextResponse } from "next/server";
import { query, DatabaseUnavailableError } from "./db";
import { config } from "./config";

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function serviceUnavailable(message = "Service temporarily unavailable. Please try again shortly.") {
  return json({ error: "unavailable", message }, 503);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Run work after the response is sent (Vercel keeps the function alive for
 * it). Outside a Next.js request scope — e.g. tests — run it inline.
 */
export async function runAfterResponse(fn: () => Promise<unknown>): Promise<void> {
  const safe = () => fn().catch((err) => console.error("[after] background task failed:", (err as Error).message));
  try {
    after(safe);
  } catch {
    await safe();
  }
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Fixed-window rate limit backed by Postgres (no extra service needed).
 * Stores only a salted hash of the IP.
 */
export async function rateLimited(req: Request, bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const ipHash = createHash("sha256").update(`${config.ipHashSalt()}:${clientIp(req)}`).digest("hex").slice(0, 32);
  const rows = await query<{ hits: number }>(
    `INSERT INTO rate_limits (key, window_start, hits)
     VALUES ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limits.hits + 1
     RETURNING hits`,
    [`${bucket}:${ipHash}`, windowSeconds]
  );
  return (rows[0]?.hits ?? 0) > limit;
}

export function isDbDown(err: unknown): boolean {
  return err instanceof DatabaseUnavailableError;
}
