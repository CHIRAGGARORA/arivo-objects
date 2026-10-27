import { createHmac, randomUUID } from "node:crypto";
import { vi } from "vitest";
import pg from "pg";
import { products } from "@/lib/products";
import { packedSpecs } from "@/lib/shipping-specs";
import { resetPool } from "@/lib/server/db";
import { resetShiprocketToken } from "@/lib/server/shiprocket";

export const KEY_SECRET = "test_key_secret_not_real";
export const WEBHOOK_SECRET = "test_webhook_secret_not_real";
export const DB_URL = process.env.TEST_DATABASE_URL!;

export function setEnv(overrides: Record<string, string | undefined> = {}) {
  const base: Record<string, string | undefined> = {
    VERCEL_ENV: undefined,
    DATABASE_URL: DB_URL,
    RAZORPAY_KEY_ID: "rzp_test_FAKEKEY",
    RAZORPAY_KEY_SECRET: KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    PAYMENTS_LIVE_APPROVED: undefined,
    PREVIEW_SELLABLE_VARIANTS: undefined,
    RESEND_API_KEY: "re_test_fake",
    EMAIL_FROM: "ARIVO OBJECTS <orders@example.test>",
    OWNER_EMAIL: "owner@example.test",
    SHIPROCKET_API_EMAIL: "api@example.test",
    SHIPROCKET_API_PASSWORD: "fake-password",
    SHIPROCKET_PICKUP_LOCATION: "Studio",
    SHIPROCKET_PICKUP_PINCODE: "110001",
    CRON_SECRET: "cron-secret-for-tests",
    ADMIN_PASSWORD: "admin-password-for-tests",
    SITE_URL: "https://example.test",
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

export async function resetDb() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  await c.query(`TRUNCATE customers, inventory, orders, order_items, order_tasks, payment_events,
    newsletter_subscribers, contact_messages, rate_limits, refunds RESTART IDENTITY CASCADE`);
  await c.query("DROP TABLE IF EXISTS deployment_guard");
  await c.end();
  await resetPool();
  resetShiprocketToken();
}

/** What a real preview build does: claim the database for "preview". */
export async function claimDatabaseFor(env: "preview" | "production") {
  await sql(`CREATE TABLE IF NOT EXISTS deployment_guard (
    id integer PRIMARY KEY DEFAULT 1, environment text NOT NULL, claimed_at timestamptz NOT NULL DEFAULT now())`);
  await sql("INSERT INTO deployment_guard (environment) VALUES ($1)", [env]);
}

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    return (await c.query(text, params)).rows as T[];
  } finally {
    await c.end();
  }
}

/** Make the small oval tray (black, terracotta) sellable with stock and packed specs for a test. */
export async function enableTestCatalog(stock = 5) {
  const tray = products.find((p) => p.slug === "small-oval-marble-tray")!;
  for (const v of tray.variants) v.sellable = v.id !== "ochre-marble"; // ochre stays disabled
  packedSpecs["small-oval-marble-tray/black-marble"] = { weightKg: 0.6, lengthCm: 25, breadthCm: 18, heightCm: 6 };
  packedSpecs["small-oval-marble-tray/terracotta-marble"] = { weightKg: 0.6, lengthCm: 25, breadthCm: 18, heightCm: 6 };
  await sql(
    `INSERT INTO inventory (product_slug, variant_id, quantity) VALUES
     ('small-oval-marble-tray', 'black-marble', $1), ('small-oval-marble-tray', 'terracotta-marble', $1)`,
    [stock]
  );
}

export function disableTestCatalog() {
  for (const p of products) for (const v of p.variants) v.sellable = false;
  for (const k of Object.keys(packedSpecs)) {
    packedSpecs[k] = { weightKg: null, lengthCm: null, breadthCm: null, heightCm: null };
  }
}

// ---------------------------------------------------------------------------
// Fake providers behind a stubbed global fetch
// ---------------------------------------------------------------------------

interface FakePayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed";
  method: string;
  error_description?: string;
}

export class Fakes {
  rzpOrders = new Map<string, { id: string; amount: number; currency: string; receipt: string }>();
  payments = new Map<string, FakePayment>();
  emails: { to: string; subject: string; idempotencyKey: string; text: string }[] = [];
  emailKeysSeen = new Set<string>();
  shiprocketOrders: { order_id: string; id: number; weight: number; total_discount?: number }[] = [];
  calls: string[] = [];
  fail = { razorpayCreate: false, razorpayAll: false, resend: false as false | number, shiprocketCreate: false as false | number, shiprocketNetwork: false };
  serviceable = true;
  /** Artificial latency so concurrent paths genuinely overlap. */
  latencyMs = 0;

  private seq = 0;
  private nextId(prefix: string) {
    return `${prefix}_${(++this.seq).toString(36).toUpperCase()}${randomUUID().slice(0, 6).replace(/-/g, "")}`;
  }

  /** Simulate the customer completing payment in Razorpay Checkout. */
  pay(rzpOrderId: string, opts: { status?: FakePayment["status"]; amount?: number } = {}): FakePayment {
    const order = this.rzpOrders.get(rzpOrderId)!;
    const p: FakePayment = {
      id: this.nextId("pay"),
      order_id: rzpOrderId,
      amount: opts.amount ?? order.amount,
      currency: "INR",
      status: opts.status ?? "captured",
      method: "upi",
      ...(opts.status === "failed" ? { error_description: "Payment declined by bank (test)" } : {}),
    };
    this.payments.set(p.id, p);
    return p;
  }

  install() {
    vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const method = (init?.method ?? "GET").toUpperCase();
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      this.calls.push(`${method} ${url.host}${url.pathname}`);
      if (this.latencyMs) await new Promise((r) => setTimeout(r, this.latencyMs));
      const res = (status: number, data: unknown) =>
        new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

      if (url.host === "api.razorpay.com") {
        const auth = String((init?.headers as Record<string, string>)?.Authorization ?? "");
        const expected = `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
        if (auth !== expected) return res(401, { error: { description: "Authentication failed" } });
        if (this.fail.razorpayAll) throw new TypeError("fetch failed");
        if (method === "POST" && url.pathname === "/v1/orders") {
          if (this.fail.razorpayCreate) return res(500, { error: { description: "Server error" } });
          const o = { id: this.nextId("order"), amount: body.amount, currency: body.currency, receipt: body.receipt };
          this.rzpOrders.set(o.id, o);
          return res(200, { ...o, status: "created" });
        }
        if (method === "GET" && url.pathname === "/v1/orders") return res(200, { items: [] });
        const pay = url.pathname.match(/^\/v1\/payments\/(pay_[A-Za-z0-9]+)(\/capture)?$/);
        if (pay) {
          const p = this.payments.get(pay[1]);
          if (!p) return res(400, { error: { description: "The id provided does not exist" } });
          if (pay[2]) {
            if (p.status !== "authorized") return res(400, { error: { description: "This payment has already been captured" } });
            p.status = "captured";
          }
          return res(200, p);
        }
      }

      if (url.host === "api.resend.com" && url.pathname === "/emails") {
        if (this.fail.resend) return res(this.fail.resend, { message: "Simulated Resend failure" });
        const key = (init?.headers as Record<string, string>)["Idempotency-Key"];
        // Resend returns the original response for a repeated idempotency key.
        if (!this.emailKeysSeen.has(key)) {
          this.emailKeysSeen.add(key);
          this.emails.push({ to: body.to[0], subject: body.subject, idempotencyKey: key, text: body.text });
        }
        return res(200, { id: `email_${key}` });
      }

      if (url.host === "apiv2.shiprocket.in") {
        if (this.fail.shiprocketNetwork) throw new TypeError("fetch failed");
        if (url.pathname === "/v1/external/auth/login") return res(200, { token: "fake-token" });
        if (url.pathname === "/v1/external/courier/serviceability/") {
          return this.serviceable
            ? res(200, { status: 200, data: { available_courier_companies: [{ id: 1 }] } })
            : res(404, { status: 404, message: "No courier available" });
        }
        if (url.pathname === "/v1/external/orders" && method === "GET") {
          const q = url.searchParams.get("search");
          return res(200, {
            data: this.shiprocketOrders
              .filter((o) => o.order_id === q)
              .map((o) => ({ id: o.id, channel_order_id: o.order_id, status: "NEW", shipments: [{ id: o.id + 1000, awb: null, courier: null }] })),
          });
        }
        if (url.pathname === "/v1/external/orders/create/adhoc") {
          if (this.fail.shiprocketCreate) return res(this.fail.shiprocketCreate, { message: "Simulated Shiprocket failure" });
          const o = { order_id: body.order_id, id: 5000 + this.shiprocketOrders.length, weight: body.weight, total_discount: body.total_discount };
          this.shiprocketOrders.push(o);
          return res(200, { order_id: o.id, shipment_id: o.id + 1000, status: "NEW", status_code: 1 });
        }
        if (url.pathname === "/v1/external/settings/company/pickup") {
          return res(200, { data: { shipping_address: [{ pickup_location: "Studio" }] } });
        }
      }

      throw new Error(`Unexpected fetch in test: ${method} ${url.href}`);
    });
    return this;
  }
}

// ---------------------------------------------------------------------------
// Request builders
// ---------------------------------------------------------------------------

export const validCustomer = { name: "Test Customer", email: "Customer@Example.test", phone: "+91 98765 43210" };
export const validAddress = { line1: "12 Test Lane, Sector 4", city: "New Delhi", state: "Delhi", pincode: "110001" };

export function checkoutBody(items: unknown, extra: Record<string, unknown> = {}) {
  return { clientRequestId: randomUUID(), items, customer: validCustomer, address: validAddress, ...extra };
}

export function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://example.test${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "203.0.113.7", ...headers },
    body: JSON.stringify(body),
  });
}

export function paymentSignature(orderId: string, paymentId: string, secret = KEY_SECRET) {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function signedWebhook(body: unknown, eventId = `evt_${randomUUID()}`) {
  const raw = JSON.stringify(body);
  const sig = createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  return new Request("https://example.test/api/webhooks/razorpay", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": sig, "x-razorpay-event-id": eventId },
    body: raw,
  });
}

export function webhookRequest(event: string, payment: { id: string; order_id: string; error_description?: string }, opts: { eventId?: string; secret?: string } = {}) {
  const raw = JSON.stringify({
    entity: "event",
    event,
    payload: { payment: { entity: { ...payment, entity: "payment" } } },
  });
  const sig = createHmac("sha256", opts.secret ?? WEBHOOK_SECRET).update(raw).digest("hex");
  return new Request("https://example.test/api/webhooks/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": sig,
      "x-razorpay-event-id": opts.eventId ?? `evt_${randomUUID()}`,
    },
    body: raw,
  });
}
