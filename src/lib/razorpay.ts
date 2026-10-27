import "server-only";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getProductBySlug, isSellable } from "./products";
import { applyCoupon } from "./coupons";

/**
 * razorpay.ts
 * ---------------------------------------------------------------------------
 * SERVER-ONLY. The `server-only` import above makes any accidental import of
 * this file from a Client Component fail the build, rather than silently
 * leaking RAZORPAY_KEY_SECRET into the browser bundle.
 *
 * Nothing in here ever trusts a price, quantity total, or amount sent by the
 * browser — `computeTrustedOrder` re-derives everything from `products.ts`.
 * ---------------------------------------------------------------------------
 */

export interface RequestedLine {
  productSlug: string;
  variantId: string;
  quantity: number;
}

export interface TrustedLine extends RequestedLine {
  name: string;
  variantLabel: string;
  unitPrice: number; // rupees
  lineTotal: number; // rupees
}

export interface TrustedOrderResult {
  ok: true;
  lines: TrustedLine[];
  subtotalRupees: number;
  couponCode: string; // "" if none applied
  discountRupees: number;
  totalRupees: number; // subtotal minus discount, before shipping
  amountPaise: number;
}

export interface TrustedOrderError {
  ok: false;
  status: 400;
  message: string;
}

const MAX_QUANTITY_PER_LINE = 20; // sanity cap — not a business rule, just abuse protection
const MIN_AMOUNT_PAISE = 100; // Razorpay's own minimum order amount

/**
 * Recomputes the order total from trusted server-side product data.
 * Rejects anything that doesn't resolve to a real, sellable, in-catalogue
 * product/variant — regardless of what the browser claims.
 */
export function computeTrustedOrder(
  requestedLines: unknown,
  couponCode?: string | null
): TrustedOrderResult | TrustedOrderError {
  if (!Array.isArray(requestedLines) || requestedLines.length === 0) {
    return { ok: false, status: 400, message: "Cart is empty." };
  }

  const lines: TrustedLine[] = [];

  for (const raw of requestedLines) {
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as RequestedLine).productSlug !== "string" ||
      typeof (raw as RequestedLine).variantId !== "string" ||
      typeof (raw as RequestedLine).quantity !== "number"
    ) {
      return { ok: false, status: 400, message: "Malformed cart line." };
    }

    const { productSlug, variantId, quantity } = raw as RequestedLine;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      return { ok: false, status: 400, message: `Invalid quantity for ${productSlug}.` };
    }

    const product = getProductBySlug(productSlug);
    if (!product) {
      return { ok: false, status: 400, message: `Unknown product: ${productSlug}.` };
    }

    if (!isSellable(product)) {
      return {
        ok: false,
        status: 400,
        message: `${product.name} is not currently available for purchase.`,
      };
    }

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      return {
        ok: false,
        status: 400,
        message: `Unknown variant "${variantId}" for ${product.name}.`,
      };
    }

    if (variant.inStock === false) {
      return { ok: false, status: 400, message: `${product.name} (${variant.label}) is out of stock.` };
    }

    const unitPrice = product.price; // trusted — from products.ts, never from the request
    lines.push({
      productSlug,
      variantId,
      quantity,
      name: product.name,
      variantLabel: variant.label,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  const subtotalRupees = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const couponResult = applyCoupon(couponCode, subtotalRupees);
  if (!couponResult.ok) {
    return { ok: false, status: 400, message: couponResult.message };
  }

  // Shipping: currently free on every order (Shiprocket real-time rate
  // calculation is a separate, not-yet-built integration — see
  // src/lib/coupons.ts-adjacent note in create-order route). Nothing is
  // added to the total for shipping right now.
  const totalRupees = Math.max(0, subtotalRupees - couponResult.discountRupees);
  const amountPaise = Math.round(totalRupees * 100);

  if (amountPaise < MIN_AMOUNT_PAISE) {
    return { ok: false, status: 400, message: "Order total is below the minimum payable amount." };
  }

  return {
    ok: true,
    lines,
    subtotalRupees,
    couponCode: couponResult.code,
    discountRupees: couponResult.discountRupees,
    totalRupees,
    amountPaise,
  };
}

/**
 * Reads an env var and trims surrounding whitespace/newlines. A copy-pasted
 * secret with a trailing space or newline LOOKS correct but produces a
 * different HMAC / Basic-Auth value than the real key, and Razorpay's API
 * will reject it outright with an HTTP 401 — with no indication in the
 * error that whitespace was the cause. Returns undefined if empty after
 * trimming, so "" is treated the same as "not set".
 */
function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

let client: Razorpay | null = null;
let cachedKeyId: string | null = null;

/**
 * Lazily-constructed singleton Razorpay SDK client, server-side only.
 *
 * Rebuilds the client if RAZORPAY_KEY_ID changes between calls, rather than
 * permanently caching the first client built. Next.js reads `.env.local`
 * once at process start — editing it while `next dev`/`next start` is
 * already running does NOT hot-reload the new values into `process.env`,
 * so without this check a stale/bad client built before a fix would keep
 * being reused silently for the rest of that server process's life.
 */
export function getRazorpayClient(): Razorpay {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  const keySecret = readEnv("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set. Add them to .env.local (locally) " +
        "or your Vercel project's Environment Variables (deployed), then fully restart the " +
        "server — editing .env.local does NOT hot-reload into a running `next dev` process."
    );
  }

  if (!/^rzp_(test|live)_/.test(keyId)) {
    console.warn(
      "[razorpay] RAZORPAY_KEY_ID doesn't look like a real Razorpay key (expected it to start " +
        'with "rzp_test_" or "rzp_live_"). Double-check it was copied correctly from the ' +
        "Razorpay Dashboard → Settings → API Keys."
    );
  }

  if (!client || cachedKeyId !== keyId) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    cachedKeyId = keyId;
  }
  return client;
}

export function getPublicKeyId(): string {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  if (!keyId) throw new Error("RAZORPAY_KEY_ID is not set.");
  return keyId;
}

/**
 * Verifies a Checkout success callback's signature:
 * HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) must equal the
 * razorpay_signature the client received. This is the step that actually
 * proves the payment is genuine — never skip it, and never trust a
 * "success" the browser merely claims happened.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = readEnv("RAZORPAY_KEY_SECRET");
  if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET is not set.");

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  // Constant-time comparison to avoid leaking timing information.
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(params.signature || "", "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Verifies an incoming webhook's X-Razorpay-Signature header against the
 * RAW request body, using the separate Webhook Secret (set when you
 * configure the webhook URL in the Razorpay Dashboard — this is NOT the
 * same value as RAZORPAY_KEY_SECRET).
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const webhookSecret = readEnv("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret || !signatureHeader) return false;

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
