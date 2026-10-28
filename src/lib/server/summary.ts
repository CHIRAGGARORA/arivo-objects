import "server-only";
import { query } from "./db";
import { config } from "./config";
import { dailySummaryEmail, emailConfigured, sendEmail } from "./email";
import { LOW_STOCK_AT } from "./orders";
import { products } from "@/lib/products";

const IST_MS = 5.5 * 3600 * 1000;

/** The owner's morning email: yesterday (India time) plus what's waiting now. */
export async function sendDailySummary(now = new Date()): Promise<"sent" | "skipped"> {
  const owner = config.resend().ownerEmail;
  if (!emailConfigured() || !owner) return "skipped";

  const todayIST = new Date(now.getTime() + IST_MS).toISOString().slice(0, 10);
  const startUtc = new Date(Date.parse(`${todayIST}T00:00:00Z`) - IST_MS - 24 * 3600 * 1000);
  const endUtc = new Date(startUtc.getTime() + 24 * 3600 * 1000);
  const yesterdayIST = new Date(startUtc.getTime() + IST_MS).toISOString().slice(0, 10);

  const [sales, toShip, stock, reviews, attention] = await Promise.all([
    query<{ n: string; total: string | null }>(
      "SELECT count(*) AS n, sum(total_paise) AS total FROM orders WHERE paid_at >= $1 AND paid_at < $2 AND status IN ('paid', 'refunded')",
      [startUtc, endUtc]
    ),
    query<{ order_number: string; shipping_address: { name: string; city: string }; paid_at: Date }>(
      `SELECT o.order_number, o.shipping_address, o.paid_at FROM orders o
        WHERE o.status = 'paid' AND o.shipped_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM order_tasks t WHERE t.order_id = o.id AND t.task = 'shiprocket_order'
                            AND t.status = 'succeeded' AND t.result->>'awbCode' IS NOT NULL)
        ORDER BY o.paid_at LIMIT 50`
    ),
    query<{ product_slug: string; variant_id: string; quantity: number }>("SELECT * FROM inventory WHERE quantity <= $1", [LOW_STOCK_AT]),
    query<{ n: string }>("SELECT count(*) AS n FROM reviews WHERE status = 'pending'"),
    query<{ n: string }>("SELECT count(*) AS n FROM orders WHERE attention_reason IS NOT NULL AND status IN ('paid', 'refunded')"),
  ]);

  const lowStock = stock.flatMap((s) => {
    const p = products.find((x) => x.slug === s.product_slug);
    const v = p?.variants.find((x) => x.id === s.variant_id);
    return p && v && v.sellable ? [{ name: p.name, variantLabel: v.label, quantity: s.quantity }] : [];
  });

  const dateLabel = new Date(`${yesterdayIST}T12:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  await sendEmail({
    ...dailySummaryEmail(
      {
        dateLabel,
        paidCount: Number(sales[0].n),
        revenuePaise: Number(sales[0].total ?? 0),
        toShip: toShip.map((o) => ({ orderNumber: o.order_number, name: o.shipping_address.name, city: o.shipping_address.city, paidAt: o.paid_at })),
        lowStock,
        pendingReviews: Number(reviews[0].n),
        needsAttention: Number(attention[0].n),
      },
      owner
    ),
    idempotencyKey: `daily-summary-${yesterdayIST}`,
  });
  return "sent";
}
