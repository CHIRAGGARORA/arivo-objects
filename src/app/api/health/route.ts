import { config, deployEnv, integrationStatus } from "@/lib/server/config";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { query, withTransaction } from "@/lib/server/db";
import { pingRazorpay } from "@/lib/server/razorpay";
import { listPickupLocations, shiprocketConfigured } from "@/lib/server/shiprocket";
import { json } from "@/lib/server/http";
import { formsSelfTest } from "@/lib/server/selftest";
import { products } from "@/lib/products";
import { getPackedSpec, isCompleteSpec } from "@/lib/shipping-specs";

export const dynamic = "force-dynamic";

type Check = { ok: boolean; detail?: string };

async function check(fn: () => Promise<string | undefined | void>): Promise<Check> {
  try {
    const detail = await fn();
    return { ok: true, ...(detail ? { detail } : {}) };
  } catch (err) {
    return { ok: false, detail: (err as Error).message.slice(0, 300) };
  }
}

/**
 * Allowed with the admin password, or — outside production — on a
 * *.vercel.app preview URL, which Vercel's own login protects. Custom domains
 * (e.g. the public test.arivoobjects.com) always need the admin password.
 */
function allowed(req: Request): boolean {
  if (isAdminAuthorized(req.headers.get("authorization"))) return true;
  if (deployEnv() === "production") return false;
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
  return host.endsWith(".vercel.app");
}

/**
 * Configuration + connectivity report. Values are never returned — only
 * whether each setting exists and whether read-only calls succeed.
 * `?selftest=forms` (non-production only) submits the real contact and
 * newsletter handlers, confirms the rows were saved, then deletes them.
 */
export async function GET(req: Request) {
  if (!allowed(req)) return json({ error: "unauthorized" }, 401);

  const status = integrationStatus();
  const checks: Record<string, Check> = {};

  if (config.databaseUrl()) {
    checks.database = await check(async () => {
      await query("SELECT 1");
      const migrations = await query<{ name: string }>("SELECT name FROM schema_migrations ORDER BY name");
      const tables = await query<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      );
      const owner = await query<{ environment: string }>("SELECT environment FROM deployment_guard WHERE id = 1").catch(() => []);
      return `migrations: ${migrations.map((m) => m.name).join(", ") || "none"}; tables: ${tables.length}; claimed by: ${owner[0]?.environment ?? "unclaimed"}`;
    });
    checks.records = await check(async () => {
      const [r] = await query<Record<string, string>>(
        `SELECT (SELECT count(*) FROM orders) AS orders,
                (SELECT count(*) FROM orders WHERE status = 'paid') AS paid_orders,
                (SELECT count(*) FROM order_tasks WHERE status IN ('failed', 'needs_attention')) AS tasks_needing_attention,
                (SELECT count(*) FROM payment_events) AS payment_events,
                (SELECT count(*) FROM contact_messages) AS contact_messages,
                (SELECT count(*) FROM newsletter_subscribers) AS newsletter_subscribers`
      );
      return Object.entries(r).map(([k, v]) => `${k}=${v}`).join(", ");
    });
    if (deployEnv() !== "production") {
      // Proves writes work end to end without leaving data behind.
      checks.writeRollback = await check(async () => {
        const rollback = new Error("rollback");
        try {
          await withTransaction(async (c) => {
            const row = (
              await c.query<{ id: number }>(
                "INSERT INTO contact_messages (name, email, message) VALUES ('health check', 'health@example.invalid', 'write test — rolled back') RETURNING id"
              )
            ).rows[0];
            const back = await c.query("SELECT 1 FROM contact_messages WHERE id = $1", [row.id]);
            if (back.rowCount !== 1) throw new Error("inserted row not readable");
            throw rollback; // withTransaction rolls back on any throw
          });
        } catch (err) {
          if (err !== rollback) throw err;
        }
        return "insert + read-back succeeded, then rolled back";
      });
    }
    checks.inventory = await check(async () => {
      const rows = await query<{ product_slug: string; variant_id: string; quantity: number }>(
        "SELECT product_slug, variant_id, quantity FROM inventory ORDER BY 1, 2"
      );
      return rows.map((r) => `${r.product_slug}/${r.variant_id}=${r.quantity}`).join(", ") || "no stock rows";
    });
  }
  if (status.razorpay.keyId && status.razorpay.keySecret) {
    checks.razorpayAuth = await check(async () => {
      await pingRazorpay();
      return `authenticated (${status.razorpay.mode} mode)`;
    });
  }
  if (shiprocketConfigured()) {
    checks.shiprocketPickup = await check(async () => {
      const names = await listPickupLocations();
      const wanted = config.shiprocket().pickupLocation!;
      if (!names.includes(wanted)) {
        throw new Error(`SHIPROCKET_PICKUP_LOCATION does not exactly match any saved pickup location (${names.length} found: ${names.join(", ")})`);
      }
      return "login ok; pickup location matches";
    });
  }

  if (deployEnv() !== "production" && new URL(req.url).searchParams.get("selftest") === "forms" && config.databaseUrl()) {
    checks.formsSelfTest = await check(formsSelfTest);
  }

  const sellable = products.flatMap((p) =>
    p.variants.map((v) => ({
      variant: `${p.slug}/${v.id}`,
      sellable: v.sellable,
      packedSpecComplete: isCompleteSpec(getPackedSpec(p.slug, v.id)),
    }))
  );

  return json({ status, checks, catalog: sellable });
}
