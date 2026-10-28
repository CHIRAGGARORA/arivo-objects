import { timingSafeEqual } from "node:crypto";
import { config } from "@/lib/server/config";
import { reconcilePendingOrders } from "@/lib/server/orders";
import { processDueTasks } from "@/lib/server/tasks";
import { sendDailySummary } from "@/lib/server/summary";
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

/**
 * Daily (08:00 IST): confirm any payments the site missed, cancel truly
 * abandoned checkouts, retry due order steps, then email the owner a summary.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return json({ error: "unauthorized" }, 401);
  if (!config.databaseUrl()) return json({ ok: true, skipped: "database_not_configured" });
  try {
    const { paidOrderIds, cancelled } = await reconcilePendingOrders();
    const processed = await processDueTasks();
    let summary: string;
    try {
      summary = await sendDailySummary();
    } catch (err) {
      summary = `failed: ${(err as Error).message.slice(0, 200)}`;
    }
    return json({ ok: true, recoveredPayments: paidOrderIds.length, cancelled, processed: processed.length, summary });
  } catch (err) {
    if (isDbDown(err)) return serviceUnavailable();
    throw err;
  }
}
