import { config, deployEnv, integrationStatus } from "@/lib/server/config";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { query } from "@/lib/server/db";
import { pingRazorpay } from "@/lib/server/razorpay";
import { listPickupLocations, shiprocketConfigured } from "@/lib/server/shiprocket";
import { json } from "@/lib/server/http";
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
 * Configuration + connectivity report. Values are never returned — only
 * whether each setting exists and whether read-only calls succeed.
 * Production requires admin auth; previews sit behind Vercel's login.
 */
export async function GET(req: Request) {
  if (deployEnv() === "production" && !isAdminAuthorized(req.headers.get("authorization"))) {
    return json({ error: "unauthorized" }, 401);
  }

  const status = integrationStatus();
  const checks: Record<string, Check> = {};

  if (config.databaseUrl()) {
    checks.database = await check(async () => {
      await query("SELECT 1");
      const migrations = await query<{ name: string }>("SELECT name FROM schema_migrations ORDER BY name");
      const tables = await query<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      );
      return `migrations: ${migrations.map((m) => m.name).join(", ") || "none"}; tables: ${tables.length}`;
    });
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

  const sellable = products.flatMap((p) =>
    p.variants.map((v) => ({
      variant: `${p.slug}/${v.id}`,
      sellable: v.sellable,
      packedSpecComplete: isCompleteSpec(getPackedSpec(p.slug, v.id)),
    }))
  );

  return json({ status, checks, catalog: sellable });
}
