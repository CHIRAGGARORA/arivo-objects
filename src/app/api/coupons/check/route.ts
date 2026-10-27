import { couponCheckSchema } from "@/lib/server/validation";
import { CartError, priceCart } from "@/lib/server/catalog";
import { CouponError } from "@/lib/server/coupons";
import { config } from "@/lib/server/config";
import { query } from "@/lib/server/db";
import { isDbDown, json, rateLimited, readJson, serviceUnavailable } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Preview a coupon against the current cart. Purely informational — the
 * discount is recomputed (and first-order eligibility re-checked) when the
 * order is created.
 */
export async function POST(req: Request) {
  const parsed = couponCheckSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "invalid_input", message: "Enter a coupon code." }, 400);
  const { couponCode, items, email } = parsed.data;
  try {
    if (config.databaseUrl() && (await rateLimited(req, "coupon", 30, 600))) {
      return json({ error: "rate_limited", message: "Too many attempts. Please wait a few minutes." }, 429);
    }
    const priced = priceCart(items, couponCode);
    if (!priced.coupon) return json({ error: "invalid_coupon", message: "Enter a coupon code." }, 400);
    if (priced.coupon.firstOrderOnly && email && config.databaseUrl()) {
      const prior = await query(
        `SELECT 1 FROM orders o JOIN customers c ON c.id = o.customer_id
          WHERE c.email = $1 AND o.status = 'paid' LIMIT 1`,
        [email]
      );
      if (prior.length) {
        return json({ error: "coupon_not_eligible", message: `${priced.coupon.code} is only valid on your first order.` }, 400);
      }
    }
    return json({
      couponCode: priced.coupon.code,
      firstOrderOnly: priced.coupon.firstOrderOnly,
      subtotalPaise: priced.subtotalPaise,
      discountPaise: priced.discountPaise,
      shippingPaise: priced.shippingPaise,
      totalPaise: priced.totalPaise,
    });
  } catch (err) {
    if (err instanceof CouponError || err instanceof CartError) {
      return json({ error: err.code, message: err.message }, 400);
    }
    if (isDbDown(err)) return serviceUnavailable();
    throw err;
  }
}
