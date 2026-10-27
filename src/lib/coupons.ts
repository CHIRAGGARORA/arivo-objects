import "server-only";

/**
 * coupons.ts
 * ---------------------------------------------------------------------------
 * SERVER-ONLY. Like razorpay.ts, nothing here ever trusts a discount amount
 * sent by the browser — the discount is always recomputed from this table
 * and the trusted server-side subtotal.
 *
 * HONEST LIMITATION: this project has no database and no customer accounts
 * (see README / razorpay.ts). That means a coupon like FIRST5 cannot
 * actually be restricted to "a customer's first order" — there is nothing
 * to check that against. It currently just works for anyone who enters the
 * code, every time, for as long as it's listed below. If you need real
 * one-per-customer enforcement, that requires persistent storage (a
 * database) to track redemptions — flagging this rather than quietly
 * pretending it's enforced.
 * ---------------------------------------------------------------------------
 */

interface CouponDefinition {
  percentOff: number;
  description: string;
}

const COUPONS: Record<string, CouponDefinition> = {
  FIRST5: { percentOff: 5, description: "5% off" },
};

export interface CouponApplyResult {
  ok: true;
  code: string;
  percentOff: number;
  discountRupees: number;
}

export interface CouponError {
  ok: false;
  message: string;
}

/**
 * Looks up a coupon code and computes its discount against a trusted
 * server-side subtotal (rupees). Returns a no-op-free discount of 0 when no
 * code is given, so callers can always call this unconditionally.
 */
export function applyCoupon(
  rawCode: string | undefined | null,
  subtotalRupees: number
): CouponApplyResult | CouponError {
  if (!rawCode || !rawCode.trim()) {
    return { ok: true, code: "", percentOff: 0, discountRupees: 0 };
  }

  const code = rawCode.trim().toUpperCase();
  const coupon = COUPONS[code];
  if (!coupon) {
    return { ok: false, message: `"${rawCode}" is not a valid coupon code.` };
  }

  const discountRupees = Math.round((subtotalRupees * coupon.percentOff) / 100);
  return { ok: true, code, percentOff: coupon.percentOff, discountRupees };
}
