import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { isAdminAuthorized } from "@/lib/server/admin-auth";
import { config, integrationStatus } from "@/lib/server/config";
import { query } from "@/lib/server/db";
import { products } from "@/lib/products";
import { getPackedSpec, isCompleteSpec } from "@/lib/shipping-specs";
import { RetryButton, StockForm } from "@/components/admin/AdminControls";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const rupees = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
const when = (d: Date | null) =>
  d ? d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "—";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  attention_reason: string | null;
  total_paise: number;
  shipping_address: { name: string; email: string; phone: string; city: string; pincode: string };
  razorpay_payment_id: string | null;
  failure_reason: string | null;
  coupon_code: string | null;
  created_at: Date;
  paid_at: Date | null;
  tasks: { task: string; status: string; attempts: number; last_error: string | null; result: Record<string, unknown> | null }[] | null;
}

function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const cls = {
    ok: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
    bad: "bg-red-50 text-red-800",
    muted: "bg-bone text-charcoal/70",
  }[tone];
  return <span className={`inline-block px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

const taskTone = (s: string) => (s === "succeeded" ? "ok" : s === "needs_attention" ? "bad" : s === "failed" ? "warn" : "muted");
const orderTone = (s: string) => (s === "paid" ? "ok" : s === "failed" ? "bad" : s === "refunded" ? "warn" : "muted");

export default async function AdminPage() {
  // proxy.ts already enforces this; checked again so the page is never
  // rendered unauthenticated even if the matcher changes.
  if (!isAdminAuthorized((await headers()).get("authorization"))) notFound();

  const status = integrationStatus();
  if (!config.databaseUrl()) {
    return (
      <Container className="py-12">
        <h1 className="font-display text-3xl">Admin</h1>
        <p className="mt-6 text-sm">DATABASE_URL is not configured.</p>
      </Container>
    );
  }

  const [orders, contacts, subs, stock] = await Promise.all([
    query<OrderRow>(
      `SELECT o.id, o.order_number, o.status, o.attention_reason, o.total_paise, o.shipping_address,
              o.razorpay_payment_id, o.failure_reason, o.created_at, o.paid_at, o.coupon_code,
              (SELECT json_agg(json_build_object('task', t.task, 'status', t.status, 'attempts', t.attempts,
                       'last_error', t.last_error, 'result', t.result) ORDER BY t.id)
                 FROM order_tasks t WHERE t.order_id = o.id) AS tasks
         FROM orders o ORDER BY o.created_at DESC LIMIT 100`
    ),
    query<{ id: number; name: string; email: string; message: string; created_at: Date; notified_at: Date | null; notify_error: string | null }>(
      "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 30"
    ),
    query<{ count: string }>("SELECT count(*) FROM newsletter_subscribers WHERE status = 'subscribed'"),
    query<{ product_slug: string; variant_id: string; quantity: number }>("SELECT * FROM inventory"),
  ]);
  const stockMap = new Map(stock.map((s) => [`${s.product_slug}/${s.variant_id}`, s.quantity]));
  const attention = orders.filter(
    (o) => o.attention_reason || o.tasks?.some((t) => t.status === "needs_attention" || t.status === "failed")
  );

  return (
    <Container className="max-w-6xl py-12 text-sm">
      <h1 className="font-display text-3xl">Admin</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl">Configuration</h2>
        <p className="mt-2">
          Environment: <strong>{status.deployEnv}</strong> · Razorpay: <strong>{status.razorpay.mode}</strong> mode ·
          Checkout: {status.checkoutBlockReason ? <Badge tone="bad">blocked — {status.checkoutBlockReason}</Badge> : <Badge tone="ok">enabled</Badge>} ·
          Email: {status.resend.apiKey && status.resend.from && status.resend.ownerEmail ? <Badge tone="ok">configured</Badge> : <Badge tone="warn">incomplete</Badge>} ·
          Shiprocket: {status.shiprocket.email && status.shiprocket.password && status.shiprocket.pickupLocation ? <Badge tone="ok">{status.shiprocket.autoShip ? "configured · auto courier + pickup" : "configured · orders only"}</Badge> : <Badge tone="warn">not configured</Badge>}
        </p>
        <p className="mt-1 text-charcoal/60">Detailed connectivity checks: <a className="underline" href="/api/health">/api/health</a></p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Needs attention ({attention.length})</h2>
        {attention.length === 0 ? (
          <p className="mt-2 text-charcoal/60">Nothing needs attention.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {attention.map((o) => (
              <li key={o.id} className="border border-amber-200 bg-amber-50/40 p-3">
                <strong>{o.order_number}</strong> — {o.shipping_address.name} — {rupees(o.total_paise)}
                {o.attention_reason && <p className="mt-1 whitespace-pre-wrap text-red-800">{o.attention_reason}</p>}
                {o.tasks?.filter((t) => t.status === "needs_attention" || t.status === "failed").map((t) => (
                  <p key={t.task} className="mt-1">
                    <Badge tone={taskTone(t.status)}>{t.task}: {t.status}</Badge> {t.last_error}
                  </p>
                ))}
                {o.status === "paid" && <RetryButton orderId={o.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Orders</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-sand text-xs uppercase tracking-wide text-charcoal/60">
              <tr><th className="py-2">Order</th><th>Placed</th><th>Customer</th><th>Total</th><th>Status</th><th>Fulfilment</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const ship = o.tasks?.find((t) => t.task === "shiprocket_order");
                return (
                  <tr key={o.id} className="border-b border-sand/50 align-top">
                    <td className="py-2 font-medium">{o.order_number}</td>
                    <td>{when(o.created_at)}</td>
                    <td>
                      {o.shipping_address.name}<br />
                      <span className="text-charcoal/60">{o.shipping_address.email} · {o.shipping_address.phone}<br />{o.shipping_address.city} {o.shipping_address.pincode}</span>
                    </td>
                    <td>{rupees(o.total_paise)}{o.coupon_code && <div className="text-xs text-charcoal/60">{o.coupon_code}</div>}</td>
                    <td>
                      <Badge tone={orderTone(o.status)}>{o.status}</Badge>
                      {o.razorpay_payment_id && <div className="text-xs text-charcoal/60">{o.razorpay_payment_id}</div>}
                      {o.status !== "paid" && o.failure_reason && <div className="text-xs text-charcoal/60">{o.failure_reason}</div>}
                    </td>
                    <td className="space-y-1">
                      {o.tasks?.map((t) => (
                        <div key={t.task}><Badge tone={taskTone(t.status)}>{t.task.replace(/_/g, " ")}: {t.status}</Badge></div>
                      )) ?? <span className="text-charcoal/50">—</span>}
                      {ship?.result && (
                        <div className="text-xs text-charcoal/60">
                          Shiprocket order {String(ship.result.shiprocketOrderId)}
                          {ship.result.awbCode ? <><br />{String(ship.result.courierName ?? "Courier")} · AWB {String(ship.result.awbCode)}</> : null}
                          {ship.result.pickupScheduledDate ? <><br />Pickup {String(ship.result.pickupScheduledDate)}</> : null}
                          {ship.result.note ? <><br />{String(ship.result.note)}</> : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Stock</h2>
        <p className="mt-1 text-charcoal/60">
          A variant can be bought only when it is marked sellable in code (owner approval) <em>and</em> has stock here.
        </p>
        <table className="mt-3 w-full text-left">
          <thead className="border-b border-sand text-xs uppercase tracking-wide text-charcoal/60">
            <tr><th className="py-2">Variant</th><th>Sellable</th><th>Packed specs</th><th>Stock</th></tr>
          </thead>
          <tbody>
            {products.flatMap((p) =>
              p.variants.map((v) => (
                <tr key={`${p.slug}/${v.id}`} className="border-b border-sand/50">
                  <td className="py-2">{p.name} — {v.label}</td>
                  <td>{v.sellable ? <Badge tone="ok">yes</Badge> : <Badge tone="muted">no</Badge>}</td>
                  <td>{isCompleteSpec(getPackedSpec(p.slug, v.id)) ? <Badge tone="ok">complete</Badge> : <Badge tone="warn">missing</Badge>}</td>
                  <td><StockForm slug={p.slug} variantId={v.id} quantity={stockMap.get(`${p.slug}/${v.id}`) ?? null} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Contact messages</h2>
        <ul className="mt-3 space-y-3">
          {contacts.map((c) => (
            <li key={c.id} className="border border-sand/70 p-3">
              <strong>{c.name}</strong> &lt;{c.email}&gt; · {when(c.created_at)}{" "}
              {c.notified_at ? <Badge tone="ok">emailed</Badge> : <Badge tone="warn">not emailed: {c.notify_error}</Badge>}
              <p className="mt-1 whitespace-pre-wrap text-charcoal/80">{c.message}</p>
            </li>
          ))}
          {contacts.length === 0 && <li className="text-charcoal/60">No messages yet.</li>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Newsletter</h2>
        <p className="mt-2">{subs[0]?.count ?? 0} consented subscribers.</p>
      </section>
    </Container>
  );
}
