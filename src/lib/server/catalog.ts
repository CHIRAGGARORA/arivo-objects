import "server-only";
import { products } from "@/lib/products";
import { siteConfig } from "@/lib/siteConfig";
import { deployEnv, razorpayMode } from "./config";
import { AppliedCoupon, applyCoupon } from "./coupons";

/**
 * Trusted pricing. The browser only ever sends (slug, variantId, quantity);
 * every price, name and total used for payment is computed here from
 * products.ts. Stock is checked separately against the database.
 */

export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 20;

export interface CartItemInput {
  slug: string;
  variantId: string;
  quantity: number;
}

export interface PricedLine {
  productSlug: string;
  variantId: string;
  name: string;
  variantLabel: string;
  unitPricePaise: number;
  quantity: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalPaise: number;
  coupon: AppliedCoupon | null;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
}

export class CartError extends Error {
  constructor(
    public readonly code:
      | "empty_cart"
      | "too_many_lines"
      | "unknown_product"
      | "unknown_variant"
      | "not_sellable"
      | "invalid_quantity"
      | "duplicate_line"
      | "out_of_stock"
      | "shipping_fee_not_configured",
    message: string,
    public readonly item?: { slug: string; variantId: string }
  ) {
    super(message);
    this.name = "CartError";
  }
}

/**
 * Variants that may be ordered: those approved in products.ts, plus — only
 * on non-production deployments using Razorpay TEST keys — any listed in
 * PREVIEW_SELLABLE_VARIANTS ("slug/variantId,slug/variantId") for testing.
 */
export function sellableVariantKeys(): string[] {
  const keys = new Set<string>();
  for (const p of products) {
    if (p.sellable === false) continue; // product-level switch wins over everything, including previews
    for (const v of p.variants) if (v.sellable && v.inStock !== false) keys.add(`${p.slug}/${v.id}`);
  }
  if (deployEnv() !== "production" && razorpayMode() === "test") {
    for (const k of (process.env.PREVIEW_SELLABLE_VARIANTS ?? "").split(",")) {
      const key = k.trim();
      const [slug, variantId] = key.split("/");
      if (products.some((p) => p.sellable !== false && p.slug === slug && p.variants.some((v) => v.id === variantId))) keys.add(key);
    }
  }
  return [...keys];
}

/** Shipping fee in paise. Not configured → only allowed outside production. */
export function shippingFeePaise(): number {
  const fee = siteConfig.shippingFeeInr;
  if (fee === null) {
    if (deployEnv() === "production") {
      throw new CartError(
        "shipping_fee_not_configured",
        "Checkout is unavailable: shipping fee has not been configured."
      );
    }
    return 0;
  }
  return Math.round(fee * 100);
}

export function priceCart(items: CartItemInput[], couponCode?: string | null): PricedCart {
  if (items.length === 0) throw new CartError("empty_cart", "Your cart is empty.");
  if (items.length > MAX_LINES) throw new CartError("too_many_lines", "Too many items in cart.");

  const sellable = new Set(sellableVariantKeys());
  const seen = new Set<string>();
  const lines: PricedLine[] = items.map((item) => {
    const ref = { slug: item.slug, variantId: item.variantId };
    const key = `${item.slug}/${item.variantId}`;
    if (seen.has(key)) throw new CartError("duplicate_line", "Duplicate cart line.", ref);
    seen.add(key);

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_LINE) {
      throw new CartError(
        "invalid_quantity",
        `Quantity must be a whole number between 1 and ${MAX_QTY_PER_LINE}.`,
        ref
      );
    }
    const product = products.find((p) => p.slug === item.slug);
    if (!product) throw new CartError("unknown_product", "This product does not exist.", ref);
    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) throw new CartError("unknown_variant", "This colour option does not exist.", ref);
    if (!sellable.has(key)) {
      throw new CartError(
        "not_sellable",
        `${product.name} (${variant.label}) is not available to order online yet.`,
        ref
      );
    }
    return {
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      unitPricePaise: Math.round(product.price * 100),
      quantity: item.quantity,
    };
  });

  const subtotalPaise = lines.reduce((s, l) => s + l.unitPricePaise * l.quantity, 0);
  const coupon = applyCoupon(couponCode, subtotalPaise); // throws CouponError for unknown codes
  const discountPaise = coupon?.discountPaise ?? 0;
  const shippingPaise = shippingFeePaise();
  return {
    lines,
    subtotalPaise,
    coupon,
    discountPaise,
    shippingPaise,
    totalPaise: subtotalPaise - discountPaise + shippingPaise,
  };
}
