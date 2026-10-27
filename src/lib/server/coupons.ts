import "server-only";

/**
 * Coupon codes. The discount is always computed here from the server-side
 * subtotal — never taken from the browser.
 *
 * `firstOrderOnly` is enforced in createOrder against the database: the code
 * is refused if that email already has a paid order.
 */
interface CouponDefinition {
  percentOff: number;
  firstOrderOnly: boolean;
}

const COUPONS: Record<string, CouponDefinition> = {
  FIRST5: { percentOff: 5, firstOrderOnly: true },
};

export interface AppliedCoupon {
  code: string;
  discountPaise: number;
  firstOrderOnly: boolean;
}

export class CouponError extends Error {
  constructor(public readonly code: "invalid_coupon" | "coupon_not_eligible", message: string) {
    super(message);
    this.name = "CouponError";
  }
}

export function normalizeCouponCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase();
  return code ? code : null;
}

/** Returns null when no code was entered; throws CouponError for an unknown code. */
export function applyCoupon(rawCode: string | null | undefined, subtotalPaise: number): AppliedCoupon | null {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;
  const coupon = COUPONS[code];
  if (!coupon) throw new CouponError("invalid_coupon", `"${rawCode}" is not a valid coupon code.`);
  // Rounded to whole rupees, as customers see whole-rupee prices.
  const discountRupees = Math.round((subtotalPaise / 100) * (coupon.percentOff / 100));
  return { code, discountPaise: discountRupees * 100, firstOrderOnly: coupon.firstOrderOnly };
}
