import { timingSafeEqual } from "node:crypto";
import { config } from "@/lib/server/config";
import { cancelStalePendingOrders } from "@/lib/server/orders";
import { processDueTasks } from "@/lib/server/tasks";
import { isDbDown, json, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
function authorized(req: Request): boolean {
  const secret = config.cronSecret();
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return Boolean(secret) && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(req: Request) {
  if (!authorized(req)) return json({ error: "unauthorized" }, 401);
  if (!config.databaseUrl()) return json({ ok: true, skipped: "database_not_configured" });
  try {
    const cancelled = await cancelStalePendingOrders();
    const processed = await processDueTasks();
    return json({ ok: true, cancelled, processed: processed.length });
  } catch (err) {
    if (isDbDown(err)) return serviceUnavailable();
    throw err;
  }
}
