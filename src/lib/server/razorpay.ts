import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";

const API = "https://api.razorpay.com/v1";

export class RazorpayError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "RazorpayError";
  }
}

function credentials() {
  const { keyId, keySecret } = config.razorpay();
  if (!keyId || !keySecret) throw new RazorpayError("Razorpay is not configured");
  return { keyId, keySecret };
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { keyId, keySecret } = credentials();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new RazorpayError(`Razorpay request failed: ${(err as Error).message}`);
  }
  if (!res.ok) {
    // Error bodies carry a description but never credentials; keep it short.
    const text = (await res.text().catch(() => "")).slice(0, 300);
    throw new RazorpayError(`Razorpay ${method} ${path.split("/")[1]} failed (${res.status}): ${text}`, res.status);
  }
  return (await res.json()) as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  error_description?: string | null;
}

export function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  return call<RazorpayOrder>("POST", "/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });
}

export function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new RazorpayError("Invalid payment id");
  return call<RazorpayPayment>("GET", `/payments/${paymentId}`);
}

/** Every payment attempt made against a Razorpay order. */
export async function fetchOrderPayments(orderId: string): Promise<RazorpayPayment[]> {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) throw new RazorpayError("Invalid order id");
  const r = await call<{ items?: RazorpayPayment[] }>("GET", `/orders/${orderId}/payments`);
  return r.items ?? [];
}

export function capturePayment(paymentId: string, amountPaise: number): Promise<RazorpayPayment> {
  return call<RazorpayPayment>("POST", `/payments/${paymentId}/capture`, {
    amount: amountPaise,
    currency: "INR",
  });
}

function safeEqualHex(expectedHex: string, given: string): boolean {
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout handler signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = config.razorpay().webhookSecret;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Read-only credential check (lists at most one order). */
export async function pingRazorpay(): Promise<void> {
  await call("GET", "/orders?count=1");
}
