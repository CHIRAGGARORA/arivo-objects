import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkoutBody,
  claimDatabaseFor,
  disableTestCatalog,
  enableTestCatalog,
  Fakes,
  jsonRequest,
  paymentSignature,
  resetDb,
  setEnv,
  sql,
  webhookRequest,
} from "./helpers";
import { POST as create } from "@/app/api/checkout/create/route";
import { POST as verify } from "@/app/api/checkout/verify/route";
import { POST as webhook } from "@/app/api/webhooks/razorpay/route";
import { GET as cron } from "@/app/api/cron/process-orders/route";
import { GET as orderStatus } from "@/app/api/orders/[token]/route";
import { POST as adminRetry } from "@/app/api/admin/orders/[id]/retry/route";
import { resetPool } from "@/lib/server/db";

let fakes: Fakes;
const TRAY = (variantId = "black-marble", quantity = 1) => ({ slug: "small-oval-marble-tray", variantId, quantity });

async function startCheckout(items: unknown[] = [TRAY()], extra: Record<string, unknown> = {}) {
  const res = await create(jsonRequest("/api/checkout/create", checkoutBody(items, extra)));
  return { res, body: await res.json() };
}

async function verifyPayment(rzpOrderId: string, paymentId: string, signature = paymentSignature(rzpOrderId, paymentId)) {
  const res = await verify(
    jsonRequest("/api/checkout/verify", {
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    })
  );
  return { res, body: await res.json() };
}

async function orderRow(orderNumber: string) {
  return (
    await sql<{ id: string; status: string; total_paise: number; razorpay_payment_id: string | null; attention_reason: string | null }>(
      "SELECT id, status, total_paise, razorpay_payment_id, attention_reason FROM orders WHERE order_number = $1",
      [orderNumber]
    )
  )[0];
}

async function tasks(orderId: string) {
  const rows = await sql<{ task: string; status: string; attempts: number; last_error: string | null }>(
    "SELECT task, status, attempts, last_error FROM order_tasks WHERE order_id = $1 ORDER BY task",
    [orderId]
  );
  return Object.fromEntries(rows.map((r) => [r.task, r]));
}

beforeEach(async () => {
  setEnv();
  await resetDb();
  await enableTestCatalog(5);
  fakes = new Fakes().install();
});
afterEach(() => {
  vi.unstubAllGlobals();
  disableTestCatalog();
});

describe("checkout configuration gate", () => {
  it("refuses checkout when Razorpay is not configured", async () => {
    setEnv({ RAZORPAY_KEY_SECRET: undefined });
    const { res, body } = await startCheckout();
    expect(res.status).toBe(503);
    expect(body.error).toBe("checkout_unavailable");
  });

  it("refuses live keys on a preview/test deployment even when approval is set", async () => {
    setEnv({ VERCEL_ENV: "preview", RAZORPAY_KEY_ID: "rzp_live_FAKE", PAYMENTS_LIVE_APPROVED: "true" });
    const { res } = await startCheckout();
    expect(res.status).toBe(503);
    const { checkoutBlockReason } = await import("@/lib/server/config");
    expect(checkoutBlockReason()).toBe("live_keys_outside_production");
  });

  it("refuses live keys unless live payments are explicitly approved", async () => {
    setEnv({ RAZORPAY_KEY_ID: "rzp_live_FAKE" });
    expect((await startCheckout()).res.status).toBe(503);
  });

  it("refuses checkout in production when the database belongs to preview", async () => {
    await claimDatabaseFor("preview");
    setEnv({ VERCEL_ENV: "production" });
    const { res, body } = await startCheckout();
    expect(res.status).toBe(503);
    expect(body.error).toBe("unavailable");
    expect(fakes.rzpOrders.size).toBe(0);
  });

  it("refuses checkout in production while the shipping fee is undecided", async () => {
    const { siteConfig } = await import("@/lib/siteConfig");
    const fee = siteConfig.shippingFeeInr;
    siteConfig.shippingFeeInr = null;
    try {
      setEnv({ VERCEL_ENV: "production" });
      const { res, body } = await startCheckout();
      expect(res.status).toBe(503);
      expect(body.error).toBe("shipping_fee_not_configured");
    } finally {
      siteConfig.shippingFeeInr = fee;
    }
  });
});

describe("preview-only test products", () => {
  const CANDLE = { slug: "scented-candle-jar-pack-of-4", variantId: "sandalwood", quantity: 1 };
  beforeEach(async () => {
    await sql("INSERT INTO inventory VALUES ('scented-candle-jar-pack-of-4', 'sandalwood', 3)");
  });

  it("lets a preview with TEST keys sell a listed variant", async () => {
    await claimDatabaseFor("preview");
    setEnv({ VERCEL_ENV: "preview", PREVIEW_SELLABLE_VARIANTS: "scented-candle-jar-pack-of-4/sandalwood" });
    expect((await startCheckout([CANDLE])).res.status).toBe(200);
  });

  it("never lets a preview sell a product the catalogue marks 'coming soon'", async () => {
    await sql("INSERT INTO inventory VALUES ('mini-scented-candle-jar-pack-of-4', 'sandalwood', 3)");
    setEnv({ VERCEL_ENV: "preview", PREVIEW_SELLABLE_VARIANTS: "mini-scented-candle-jar-pack-of-4/sandalwood" });
    const { body } = await startCheckout([{ slug: "mini-scented-candle-jar-pack-of-4", variantId: "sandalwood", quantity: 1 }]);
    expect(body.error).toBe("not_sellable");
  });

  it("ignores the list in production", async () => {
    setEnv({ VERCEL_ENV: "production", PREVIEW_SELLABLE_VARIANTS: "scented-candle-jar-pack-of-4/sandalwood" });
    const { body } = await startCheckout([CANDLE]);
    expect(body.error).toBe("not_sellable");
  });

  it("ignores the list when live keys are in use", async () => {
    setEnv({
      VERCEL_ENV: "preview",
      RAZORPAY_KEY_ID: "rzp_live_FAKE",
      PAYMENTS_LIVE_APPROVED: "true",
      PREVIEW_SELLABLE_VARIANTS: "scented-candle-jar-pack-of-4/sandalwood",
    });
    // Checkout itself is refused (live keys never run outside production)…
    const { res, body } = await startCheckout([CANDLE]);
    expect(res.status).toBe(503);
    expect(body.error).toBe("checkout_unavailable");
    // …and the preview-only list is ignored independently of that.
    const { sellableVariantKeys } = await import("@/lib/server/catalog");
    expect(sellableVariantKeys()).not.toContain("scented-candle-jar-pack-of-4/sandalwood");
  });
});

describe("cart validation and trusted pricing", () => {
  it("prices the order on the server and ignores any client-sent price or total", async () => {
    const { res, body } = await startCheckout([{ ...TRAY("black-marble", 2), price: 1 }], { total: 100, amount: 100 });
    expect(res.status).toBe(200);
    expect(body.amountPaise).toBe(899 * 2 * 100);
    expect(fakes.rzpOrders.get(body.razorpayOrderId)!.amount).toBe(179800);
    expect((await orderRow(body.orderNumber)).total_paise).toBe(179800);
    expect(body.keyId).toBe("rzp_test_FAKEKEY");
    expect(JSON.stringify(body)).not.toContain("test_key_secret");
  });

  it.each([
    ["unknown product", [{ slug: "nope", variantId: "black-marble", quantity: 1 }], "unknown_product"],
    ["unknown variant", [TRAY("purple-marble")], "unknown_variant"],
    ["zero quantity", [TRAY("black-marble", 0)], "invalid_quantity"],
    ["negative quantity", [TRAY("black-marble", -3)], "invalid_quantity"],
    ["fractional quantity", [TRAY("black-marble", 1.5)], "invalid_quantity"],
    ["excessive quantity", [TRAY("black-marble", 11)], "invalid_quantity"],
    ["disabled variant", [TRAY("ochre-marble")], "not_sellable"],
    ["unapproved product", [{ slug: "scented-candle-jar-pack-of-4", variantId: "sandalwood", quantity: 1 }], "not_sellable"],
    ["coming-soon product", [{ slug: "mini-scented-candle-jar-pack-of-4", variantId: "sandalwood", quantity: 1 }], "not_sellable"],
    ["duplicate lines", [TRAY(), TRAY()], "duplicate_line"],
    ["more than in stock", [TRAY("black-marble", 6)], "out_of_stock"],
  ])("rejects %s", async (_label, items, code) => {
    const { res, body } = await startCheckout(items);
    expect(res.status).toBe(400);
    expect(body.error).toBe(code);
    expect(fakes.rzpOrders.size).toBe(0);
  });

  it("rejects a variant with no stock row (sellable flag alone is not enough)", async () => {
    await sql("DELETE FROM inventory WHERE variant_id = 'terracotta-marble'");
    const { body } = await startCheckout([TRAY("terracotta-marble")]);
    expect(body.error).toBe("out_of_stock");
  });

  it("rejects invalid customer details with field errors", async () => {
    const res = await create(
      jsonRequest("/api/checkout/create", {
        ...checkoutBody([TRAY()]),
        customer: { name: "A", email: "not-an-email", phone: "12345" },
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(["customer.name", "customer.email", "customer.phone"]));
  });

  it("rejects a PIN code Shiprocket says it cannot serve", async () => {
    fakes.serviceable = false;
    const { res, body } = await startCheckout();
    expect(res.status).toBe(400);
    expect(body.error).toBe("pincode_not_serviceable");
  });

  it("returns the same pending order for a double-submitted checkout", async () => {
    const payload = checkoutBody([TRAY()]);
    const a = await (await create(jsonRequest("/api/checkout/create", payload))).json();
    const b = await (await create(jsonRequest("/api/checkout/create", payload))).json();
    expect(b.orderNumber).toBe(a.orderNumber);
    expect(fakes.rzpOrders.size).toBe(1);
  });
});

describe("coupons", () => {
  it("FIRST5 takes 5% (rounded to the rupee) off ₹899 → ₹854, computed on the server", async () => {
    const { res, body } = await startCheckout([TRAY()], { couponCode: "first5", discountPaise: 89900 });
    expect(res.status).toBe(200);
    expect(body.amountPaise).toBe(85400);
    expect(fakes.rzpOrders.get(body.razorpayOrderId)!.amount).toBe(85400);
    const [o] = await sql<{ coupon_code: string; discount_paise: number; total_paise: number }>(
      "SELECT coupon_code, discount_paise, total_paise FROM orders"
    );
    expect(o).toEqual({ coupon_code: "FIRST5", discount_paise: 4500, total_paise: 85400 });
  });

  it("rejects an unknown code without creating anything", async () => {
    const { res, body } = await startCheckout([TRAY()], { couponCode: "FREE100" });
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_coupon");
    expect(fakes.rzpOrders.size).toBe(0);
  });

  it("only allows FIRST5 on a customer's first paid order", async () => {
    const first = (await startCheckout([TRAY()], { couponCode: "FIRST5" })).body;
    await verifyPayment(first.razorpayOrderId, fakes.pay(first.razorpayOrderId).id);
    const { res, body } = await startCheckout([TRAY()], { couponCode: "FIRST5" });
    expect(res.status).toBe(400);
    expect(body.error).toBe("coupon_not_eligible");
    // Without the code the same customer can still order.
    expect((await startCheckout([TRAY()])).res.status).toBe(200);
  });

  it("includes the discount in the confirmation email and the Shiprocket order", async () => {
    const { body } = await startCheckout([TRAY()], { couponCode: "FIRST5" });
    await verifyPayment(body.razorpayOrderId, fakes.pay(body.razorpayOrderId).id);
    const email = fakes.emails.find((e) => e.to === "customer@example.test")!;
    expect(email.text).toMatch(/Discount \(FIRST5\): -₹45/);
    expect(email.text).toMatch(/Total paid: ₹854/);
    expect(email.text).toMatch(/Shipping: Free/);
    expect(fakes.shiprocketOrders[0].total_discount).toBe(45);
  });
});

describe("successful payment", () => {
  it("marks the order paid only after Razorpay confirms capture, then fulfils once", async () => {
    const { body } = await startCheckout([TRAY("black-marble", 2)]);
    const payment = fakes.pay(body.razorpayOrderId);
    const v = await verifyPayment(body.razorpayOrderId, payment.id);
    expect(v.body.status).toBe("paid");

    const order = await orderRow(body.orderNumber);
    expect(order.status).toBe("paid");
    expect(order.razorpay_payment_id).toBe(payment.id);

    const t = await tasks(order.id);
    expect(t.customer_email.status).toBe("succeeded");
    expect(t.owner_email.status).toBe("succeeded");
    expect(t.shiprocket_order.status).toBe("succeeded");
    expect(fakes.emails.map((e) => e.to).sort()).toEqual(["customer@example.test", "owner@example.test"]);
    expect(fakes.shiprocketOrders).toHaveLength(1);
    expect(fakes.shiprocketOrders[0].weight).toBe(1.2);
    // No courier/AWB/pickup calls are ever made.
    expect(fakes.calls.some((c) => /assign|pickup\/|generate/.test(c))).toBe(false);

    const stock = await sql<{ quantity: number }>("SELECT quantity FROM inventory WHERE variant_id = 'black-marble'");
    expect(stock[0].quantity).toBe(3);

    const status = await orderStatus(new Request("https://example.test"), { params: Promise.resolve({ token: body.publicToken }) });
    const view = await status.json();
    expect(view.status).toBe("paid");
    expect(view).not.toHaveProperty("shipping_address");
  });

  it("captures an authorized-but-uncaptured payment before treating it as paid", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId, { status: "authorized" });
    expect((await verifyPayment(body.razorpayOrderId, payment.id)).body.status).toBe("paid");
    expect(fakes.payments.get(payment.id)!.status).toBe("captured");
  });
});

describe("failed and unverified payments", () => {
  it("records a failed payment and sends nothing", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId, { status: "failed" });
    const res = await webhook(webhookRequest("payment.failed", { id: payment.id, order_id: body.razorpayOrderId, error_description: "Declined" }));
    expect(res.status).toBe(200);
    expect((await orderRow(body.orderNumber)).status).toBe("failed");
    expect(fakes.emails).toHaveLength(0);
    expect(fakes.shiprocketOrders).toHaveLength(0);
  });

  it("allows a later successful retry to move a failed order to paid", async () => {
    const { body } = await startCheckout();
    const bad = fakes.pay(body.razorpayOrderId, { status: "failed" });
    await webhook(webhookRequest("payment.failed", { id: bad.id, order_id: body.razorpayOrderId }));
    const good = fakes.pay(body.razorpayOrderId);
    expect((await verifyPayment(body.razorpayOrderId, good.id)).body.status).toBe("paid");
  });

  it("rejects an invalid payment signature without touching the order", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId);
    const forged = paymentSignature(body.razorpayOrderId, payment.id, "wrong-secret");
    const v = await verifyPayment(body.razorpayOrderId, payment.id, forged);
    expect(v.res.status).toBe(400);
    expect(v.body.error).toBe("invalid_signature");
    expect((await orderRow(body.orderNumber)).status).toBe("pending");
    expect(fakes.emails).toHaveLength(0);
  });

  it("does not trust a valid signature for a payment Razorpay hasn't captured", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId, { status: "created" });
    const v = await verifyPayment(body.razorpayOrderId, payment.id);
    expect(v.body.status).toBe("pending");
    expect((await orderRow(body.orderNumber)).status).toBe("pending");
    expect(fakes.emails).toHaveLength(0);
  });

  it("flags and does not fulfil a captured payment whose amount doesn't match", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId, { amount: 100 });
    const v = await verifyPayment(body.razorpayOrderId, payment.id);
    expect(v.res.status).toBe(409);
    const order = await orderRow(body.orderNumber);
    expect(order.status).toBe("pending");
    expect(order.attention_reason).toMatch(/does not match/);
    expect(fakes.emails).toHaveLength(0);
  });

  it("rejects a webhook with an invalid signature", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId);
    const res = await webhook(webhookRequest("payment.captured", { id: payment.id, order_id: body.razorpayOrderId }, { secret: "attacker" }));
    expect(res.status).toBe(400);
    expect((await orderRow(body.orderNumber)).status).toBe("pending");
    expect(await sql("SELECT 1 FROM payment_events")).toHaveLength(0);
  });

  it("rejects a webhook whose body was altered after signing", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId);
    const req = webhookRequest("payment.captured", { id: payment.id, order_id: body.razorpayOrderId });
    const tampered = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: (await req.text()).replace("payment.captured", "order.paid"),
    });
    expect((await webhook(tampered)).status).toBe(400);
  });
});

describe("idempotency and concurrency", () => {
  it("processes a re-delivered webhook event only once", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId);
    const evt = { id: payment.id, order_id: body.razorpayOrderId };
    const r1 = await webhook(webhookRequest("payment.captured", evt, { eventId: "evt_same" }));
    const r2 = await webhook(webhookRequest("payment.captured", evt, { eventId: "evt_same" }));
    expect(r1.status).toBe(200);
    expect((await r2.json()).duplicate).toBe(true);
    expect(fakes.emails).toHaveLength(2);
    expect(fakes.shiprocketOrders).toHaveLength(1);
  });

  it("handles payment.captured + order.paid + browser verify racing for the same payment", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId);
    const evt = { id: payment.id, order_id: body.razorpayOrderId };
    fakes.latencyMs = 25; // make the three paths overlap inside the provider calls
    const results = await Promise.all([
      webhook(webhookRequest("payment.captured", evt)),
      webhook(webhookRequest("order.paid", evt)),
      verifyPayment(body.razorpayOrderId, payment.id),
      verifyPayment(body.razorpayOrderId, payment.id),
    ]);
    expect(results.slice(0, 2).every((r) => (r as Response).status === 200)).toBe(true);
    // Drain anything a losing path left for the sweeper.
    await cron(new Request("https://example.test", { headers: { authorization: "Bearer cron-secret-for-tests" } }));

    const order = await orderRow(body.orderNumber);
    expect(order.status).toBe("paid");
    expect(fakes.emails.filter((e) => e.to === "customer@example.test")).toHaveLength(1);
    expect(fakes.emails.filter((e) => e.to === "owner@example.test")).toHaveLength(1);
    expect(fakes.shiprocketOrders).toHaveLength(1);
    const stock = await sql<{ quantity: number }>("SELECT quantity FROM inventory WHERE variant_id = 'black-marble'");
    expect(stock[0].quantity).toBe(4); // decremented exactly once
  });

  it("flags a second captured payment for an already-paid order for refund", async () => {
    const { body } = await startCheckout();
    const first = fakes.pay(body.razorpayOrderId);
    await verifyPayment(body.razorpayOrderId, first.id);
    const second = fakes.pay(body.razorpayOrderId);
    await webhook(webhookRequest("payment.captured", { id: second.id, order_id: body.razorpayOrderId }));
    const order = await orderRow(body.orderNumber);
    expect(order.razorpay_payment_id).toBe(first.id);
    expect(order.attention_reason).toMatch(/refund/);
    expect(fakes.emails.filter((e) => e.to === "customer@example.test")).toHaveLength(1);
  });

  it("flags a paid order when stock ran out between checkout and payment", async () => {
    const { body } = await startCheckout([TRAY("black-marble", 2)]);
    await sql("UPDATE inventory SET quantity = 1 WHERE variant_id = 'black-marble'");
    await verifyPayment(body.razorpayOrderId, fakes.pay(body.razorpayOrderId).id);
    const order = await orderRow(body.orderNumber);
    expect(order.status).toBe("paid");
    expect(order.attention_reason).toMatch(/stock was insufficient/);
  });
});

describe("failure handling", () => {
  it("stops checkout before creating a Razorpay order when the database is down", async () => {
    await resetPool();
    setEnv({ DATABASE_URL: "postgres://postgres@127.0.0.1:1/arivo_test" });
    const { res, body } = await startCheckout();
    expect(res.status).toBe(503);
    expect(body.error).toBe("unavailable");
    expect(fakes.rzpOrders.size).toBe(0);
    await resetPool();
  });

  it("returns 500 to a webhook when the database write fails, so Razorpay retries, then succeeds on retry", async () => {
    const { body } = await startCheckout();
    const payment = fakes.pay(body.razorpayOrderId);
    const evt = { id: payment.id, order_id: body.razorpayOrderId };

    await resetPool();
    setEnv({ DATABASE_URL: "postgres://postgres@127.0.0.1:1/arivo_test" });
    const down = await webhook(webhookRequest("payment.captured", evt, { eventId: "evt_retry" }));
    expect(down.status).toBe(500);
    expect(fakes.emails).toHaveLength(0);

    await resetPool();
    setEnv();
    const up = await webhook(webhookRequest("payment.captured", evt, { eventId: "evt_retry" }));
    expect(up.status).toBe(200);
    expect((await orderRow(body.orderNumber)).status).toBe("paid");
  });

  it("marks the order failed (not lost) when Razorpay order creation fails", async () => {
    fakes.fail.razorpayCreate = true;
    const { res, body } = await startCheckout();
    expect(res.status).toBe(502);
    expect(body.error).toBe("payment_provider_unavailable");
    const rows = await sql<{ status: string; failure_reason: string }>("SELECT status, failure_reason FROM orders");
    expect(rows[0].status).toBe("failed");
  });

  it("keeps the order paid when email fails, retries later, and never double-sends", async () => {
    fakes.fail.resend = 500;
    const { body } = await startCheckout();
    await verifyPayment(body.razorpayOrderId, fakes.pay(body.razorpayOrderId).id);

    const order = await orderRow(body.orderNumber);
    expect(order.status).toBe("paid");
    let t = await tasks(order.id);
    expect(t.customer_email.status).toBe("failed");
    expect(t.shiprocket_order.status).toBe("succeeded"); // one failure doesn't block the others

    fakes.fail.resend = false;
    await sql("UPDATE order_tasks SET next_run_at = now()"); // skip the backoff wait
    const c = await cron(new Request("https://example.test", { headers: { authorization: "Bearer cron-secret-for-tests" } }));
    expect(c.status).toBe(200);
    t = await tasks(order.id);
    expect(t.customer_email.status).toBe("succeeded");
    expect(t.customer_email.attempts).toBe(2);

    await sql("UPDATE order_tasks SET next_run_at = now()");
    await cron(new Request("https://example.test", { headers: { authorization: "Bearer cron-secret-for-tests" } }));
    expect(fakes.emails.filter((e) => e.to === "customer@example.test")).toHaveLength(1);
  });

  it("does not retry an email that can never succeed (e.g. unverified sender) — flags it instead", async () => {
    fakes.fail.resend = 403;
    const { body } = await startCheckout();
    await verifyPayment(body.razorpayOrderId, fakes.pay(body.razorpayOrderId).id);
    const t = await tasks((await orderRow(body.orderNumber)).id);
    expect(t.customer_email.status).toBe("needs_attention");
    expect(t.customer_email.last_error).toMatch(/403/);
  });

  it("keeps the order paid when Shiprocket fails, alerts the owner once, and a retry doesn't duplicate", async () => {
    fakes.fail.shiprocketCreate = 500;
    const { body } = await startCheckout();
    await verifyPayment(body.razorpayOrderId, fakes.pay(body.razorpayOrderId).id);

    const order = await orderRow(body.orderNumber);
    expect(order.status).toBe("paid");
    let t = await tasks(order.id);
    expect(t.shiprocket_order.status).toBe("failed");
    expect(t.shipping_alert_email.status).toBe("succeeded");
    const alerts = fakes.emails.filter((e) => /Action needed/.test(e.subject));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].text).toMatch(/paid and saved/);

    // Admin retry after Shiprocket recovers.
    fakes.fail.shiprocketCreate = false;
    const unauth = await adminRetry(jsonRequest(`/api/admin/orders/${order.id}/retry`, {}), { params: Promise.resolve({ id: order.id }) });
    expect(unauth.status).toBe(401);
    const auth = `Basic ${Buffer.from("admin:admin-password-for-tests").toString("base64")}`;
    const r = await adminRetry(jsonRequest(`/api/admin/orders/${order.id}/retry`, {}, { authorization: auth }), { params: Promise.resolve({ id: order.id }) });
    expect(r.status).toBe(200);
    t = await tasks(order.id);
    expect(t.shiprocket_order.status).toBe("succeeded");
    expect(fakes.shiprocketOrders).toHaveLength(1);
    // Retrying again finds the existing Shiprocket order instead of creating another.
    await sql("UPDATE order_tasks SET status = 'failed' WHERE task = 'shiprocket_order'");
    await adminRetry(jsonRequest(`/api/admin/orders/${order.id}/retry`, {}, { authorization: auth }), { params: Promise.resolve({ id: order.id }) });
    expect(fakes.shiprocketOrders).toHaveLength(1);
    expect(fakes.emails.filter((e) => /Action needed/.test(e.subject))).toHaveLength(1);
  });

  it("flags shipping for manual handling (no guessed weights) when packed specs are missing", async () => {
    const { packedSpecs } = await import("@/lib/shipping-specs");
    packedSpecs["small-oval-marble-tray/black-marble"] = { weightKg: null, lengthCm: null, breadthCm: null, heightCm: null };
    const { body } = await startCheckout();
    await verifyPayment(body.razorpayOrderId, fakes.pay(body.razorpayOrderId).id);
    const t = await tasks((await orderRow(body.orderNumber)).id);
    expect(t.shiprocket_order.status).toBe("needs_attention");
    expect(t.shiprocket_order.last_error).toMatch(/Packed weight\/dimensions not recorded/);
    expect(fakes.shiprocketOrders).toHaveLength(0);
    expect(fakes.emails.some((e) => /Action needed/.test(e.subject))).toBe(true);
  });

  it("rejects cron calls without the secret", async () => {
    expect((await cron(new Request("https://example.test"))).status).toBe(401);
    expect((await cron(new Request("https://example.test", { headers: { authorization: "Bearer wrong" } }))).status).toBe(401);
  });
});
