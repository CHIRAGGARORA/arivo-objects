"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { siteConfig } from "@/lib/siteConfig";
import { ReviewForm } from "@/components/reviews/ReviewForm";

interface OrderView {
  orderNumber: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  items: { name: string; variantLabel: string; quantity: number; unitPricePaise: number }[];
  subtotalPaise: number;
  couponCode: string | null;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  firstName: string;
  shipment: { awbCode: string | null; courierName: string | null } | null;
  reviewable: { productSlug: string; name: string; reviewed: boolean }[];
}

const POLL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

/** Shows the server-verified order status — never assumes success from the redirect. */
export function OrderStatus({ token }: { token: string }) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "not_found" | "error">("loading");
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load(n: number) {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404) return setState("not_found");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as OrderView;
        setOrder(data);
        setState("ok");
        setPolls(n);
        if (data.status === "pending" && n < MAX_POLLS) timer = setTimeout(() => load(n + 1), POLL_MS);
      } catch {
        if (cancelled) return;
        setState("error");
        if (n < MAX_POLLS) timer = setTimeout(() => load(n + 1), POLL_MS);
      }
    }
    load(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token]);

  if (state === "loading") return <p className="text-sm text-charcoal/60">Loading your order…</p>;
  if (state === "not_found")
    return (
      <div>
        <h1 className="font-display text-3xl">Order not found</h1>
        <p className="mt-4 text-sm text-charcoal/70">Please check the link from your confirmation email.</p>
      </div>
    );
  if (!order) return <p className="text-sm text-charcoal/60">We couldn&rsquo;t load your order. Retrying…</p>;

  const heading = {
    paid: `Thank you, ${order.firstName}.`,
    pending: "Confirming your payment…",
    failed: "Payment not completed",
    cancelled: "Order not completed",
    refunded: "Order refunded",
  }[order.status];

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-charcoal/50">Order {order.orderNumber}</p>
      <h1 className="mt-3 font-display text-3xl md:text-4xl" aria-live="polite">
        {heading}
      </h1>

      <div className="mt-5 text-sm leading-relaxed text-charcoal/75">
        {order.status === "paid" && (
          <p>
            Your payment has been received and your order is confirmed. A confirmation email is on its way.
            Shipping is free, and your order will be dispatched within 48 hours.
          </p>
        )}
        {order.status === "pending" &&
          (polls < MAX_POLLS ? (
            <p>This usually takes a few seconds. Please don&rsquo;t pay again.</p>
          ) : (
            <p>
              We haven&rsquo;t received confirmation from the payment provider yet. If money was deducted, your order
              will be confirmed automatically once it arrives — you&rsquo;ll get an email. Please don&rsquo;t pay
              again; refresh this page later or contact us.
            </p>
          ))}
        {order.status === "refunded" && (
          <p>
            This order has been refunded in full. Refunds usually reach your account within 5–7 working days,
            depending on your bank.
          </p>
        )}
        {(order.status === "failed" || order.status === "cancelled") && (
          <p>
            We didn&rsquo;t receive a successful payment for this order. If money was deducted from your account,
            please contact us with your order number and we&rsquo;ll look into it.{" "}
            <Link href="/cart" className="underline">
              Return to cart
            </Link>
          </p>
        )}
      </div>

      {order.shipment?.awbCode && (
        <p className="mt-4 text-sm">
          Shipped{order.shipment.courierName ? ` via ${order.shipment.courierName}` : ""} — tracking number{" "}
          <strong>{order.shipment.awbCode}</strong>
        </p>
      )}

      <ul className="mt-10 space-y-3 border-t border-sand/60 pt-6 text-sm">
        {order.items.map((i) => (
          <li key={`${i.name}-${i.variantLabel}`} className="flex justify-between gap-4">
            <span>
              {i.name} <span className="text-charcoal/60">— {i.variantLabel} × {i.quantity}</span>
            </span>
            <span>{formatPrice((i.unitPricePaise * i.quantity) / 100)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 border-t border-sand/60 pt-4 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotalPaise / 100)}</dd></div>
        {order.discountPaise > 0 && (
          <div className="flex justify-between">
            <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
            <dd>−{formatPrice(order.discountPaise / 100)}</dd>
          </div>
        )}
        <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingPaise ? formatPrice(order.shippingPaise / 100) : "Free"}</dd></div>
        <div className="flex justify-between font-medium"><dt>{order.status === "paid" ? "Total paid" : "Total"}</dt><dd>{formatPrice(order.totalPaise / 100)}</dd></div>
      </dl>

      {order.status === "paid" && order.reviewable.some((r) => !r.reviewed) && (
        <section id="review" className="mt-12 border-t border-sand/60 pt-8">
          <h2 className="font-display text-2xl">Love it? Leave a review</h2>
          <p className="mt-2 text-sm text-charcoal/65">
            Once your order has arrived, tell other customers what you think. Reviews appear with your first name and city.
          </p>
          <div className="mt-6 space-y-10">
            {order.reviewable
              .filter((r) => !r.reviewed)
              .map((r) => (
                <ReviewForm key={r.productSlug} token={token} productSlug={r.productSlug} productName={r.name} defaultName={order.firstName} />
              ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-xs text-charcoal/50">
        Questions? <Link href="/contact" className="underline">Contact us</Link>
        {siteConfig.instagramHandle ? <> or message @{siteConfig.instagramHandle} on Instagram</> : null} with your order
        number.
      </p>
    </div>
  );
}
