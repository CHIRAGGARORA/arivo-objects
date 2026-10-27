"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { INDIAN_STATES } from "@/lib/indian-states";
import { siteConfig } from "@/lib/siteConfig";

import type { RazorpayCheckoutSuccessResponse } from "@/types/razorpay-checkout";

interface AppliedCoupon {
  code: string;
  discountPaise: number;
  totalPaise: number;
  /** The cart the discount was calculated for; a changed cart needs re-applying. */
  cartKey: string;
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const input =
  "mt-1.5 w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal aria-[invalid=true]:border-terracotta";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-terracotta">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ shippingFeeInr }: { shippingFeeInr: number | null }) {
  const { lines, subtotal, allLinesSellable, clearCart } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // One id per checkout attempt; the server returns the same order if it's resubmitted.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState<{ checking: boolean; error: string | null }>({
    checking: false,
    error: null,
  });
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const shipping = shippingFeeInr ?? 0;
  const cartKey = lines.map((l) => `${l.productSlug}/${l.variantId}x${l.quantity}`).join(",");
  const coupon = applied && applied.cartKey === cartKey ? applied : null;
  // Display only — the server recomputes the payable amount.
  const total = coupon ? coupon.totalPaise / 100 : subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="mt-10">
        <p className="text-sm text-charcoal/70">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block text-sm underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  async function applyCoupon(email?: string) {
    const code = couponInput.trim();
    if (!code) return;
    setCouponState({ checking: true, error: null });
    try {
      const res = await fetch("/api/coupons/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: code,
          items: lines.map((l) => ({ slug: l.productSlug, variantId: l.variantId, quantity: l.quantity })),
          ...(email ? { email } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApplied(null);
        setCouponState({ checking: false, error: data.message ?? "That coupon code isn't valid." });
        return;
      }
      setApplied({ code: data.couponCode, discountPaise: data.discountPaise, totalPaise: data.totalPaise, cartKey });
      setCouponState({ checking: false, error: null });
    } catch {
      setCouponState({ checking: false, error: "Couldn't check that code right now. Please try again." });
    }
  }

  function removeCoupon() {
    setApplied(null);
    setCouponInput("");
    setCouponState({ checking: false, error: null });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setErrors({});
    const f = new FormData(e.currentTarget);
    const payload = {
      clientRequestId: requestId,
      couponCode: coupon?.code ?? null,
      items: lines.map((l) => ({ slug: l.productSlug, variantId: l.variantId, quantity: l.quantity })),
      customer: { name: f.get("name"), email: f.get("email"), phone: f.get("phone") },
      address: {
        line1: f.get("line1"),
        line2: f.get("line2") || null,
        city: f.get("city"),
        state: f.get("state"),
        pincode: f.get("pincode"),
      },
    };

    setBusy(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.fields ?? {});
        if (data.fields?.couponCode) {
          setApplied(null);
          setCouponState({ checking: false, error: data.fields.couponCode });
        }
        setMessage(data.message ?? "Something went wrong. Please try again.");
        if (res.status === 409) setRequestId(crypto.randomUUID());
        setBusy(false);
        return;
      }

      if (!(await loadRazorpay()) || !window.Razorpay) {
        setMessage("Couldn't load the payment window. Check your connection and try again.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: data.currency,
        name: siteConfig.brandName,
        description: `Order ${data.orderNumber}`,
        prefill: data.prefill,
        theme: { color: "#2B2A28" },
        handler: async (r: RazorpayCheckoutSuccessResponse) => {
          setMessage("Confirming your payment…");
          // Whatever this returns, the order page shows the server's verified
          // status (the webhook confirms independently if this call fails).
          await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          }).catch(() => null);
          clearCart();
          router.push(`/order/${data.publicToken}`);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage("Payment was not completed. Your cart is saved — you can try again.");
          },
        },
      });
      rzp.on("payment.failed", (r) => {
        setMessage(`Payment failed: ${r.error?.description ?? "please try another method"}.`);
      });
      rzp.open();
    } catch {
      setMessage("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k];
  const aria = (k: string) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <div className="mt-10 grid gap-12 md:grid-cols-[1fr_340px]">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="font-display text-xl">Contact</legend>
          <Field id="customer.name" label="Full name" error={err("customer.name")}>
            <input id="customer.name" name="name" autoComplete="name" required maxLength={100} className={input} {...aria("customer.name")} />
          </Field>
          <Field id="customer.email" label="Email" error={err("customer.email")}>
            <input id="customer.email" name="email" type="email" autoComplete="email" required className={input} {...aria("customer.email")} />
          </Field>
          <Field id="customer.phone" label="Mobile number" error={err("customer.phone")}>
            <input id="customer.phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="10-digit mobile" className={input} {...aria("customer.phone")} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-xl">Shipping address</legend>
          <p className="text-xs text-charcoal/60">We currently ship within India only.</p>
          <Field id="address.line1" label="Address" error={err("address.line1")}>
            <input id="address.line1" name="line1" autoComplete="address-line1" required maxLength={200} className={input} {...aria("address.line1")} />
          </Field>
          <Field id="address.line2" label="Apartment, landmark (optional)" error={err("address.line2")}>
            <input id="address.line2" name="line2" autoComplete="address-line2" maxLength={200} className={input} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="address.city" label="City" error={err("address.city")}>
              <input id="address.city" name="city" autoComplete="address-level2" required className={input} {...aria("address.city")} />
            </Field>
            <Field id="address.pincode" label="PIN code" error={err("address.pincode")}>
              <input id="address.pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" required maxLength={6} pattern="[1-9][0-9]{5}" className={input} {...aria("address.pincode")} />
            </Field>
          </div>
          <Field id="address.state" label="State / UT" error={err("address.state")}>
            <select id="address.state" name="state" autoComplete="address-level1" required defaultValue="" className={input} {...aria("address.state")}>
              <option value="" disabled>
                Select
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </fieldset>

        {message && (
          <p role="alert" className="border border-sand bg-bone px-4 py-3 text-sm">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !allLinesSellable}
          className="w-full bg-charcoal py-4 text-sm tracking-wide text-ivory transition-opacity duration-400 hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Please wait…" : `Pay ${formatPrice(total)}`}
        </button>
        <p className="text-xs text-charcoal/55">
          Payments are processed securely by Razorpay. By placing an order you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link>,{" "}
          <Link href="/shipping-returns" className="underline">Shipping &amp; Returns</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>

      <aside className="h-fit border border-sand/70 p-6">
        <h2 className="font-display text-xl">Order summary</h2>
        <ul className="mt-5 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={`${l.productSlug}-${l.variantId}`} className="flex justify-between gap-4">
              <span>
                {l.name} <span className="text-charcoal/60">— {l.variantLabel} × {l.quantity}</span>
              </span>
              <span>{formatPrice(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-sand/60 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          {coupon && (
            <div className="flex justify-between">
              <dt>
                Discount ({coupon.code}){" "}
                <button type="button" onClick={removeCoupon} className="ml-1 text-xs text-charcoal/50 underline">
                  Remove
                </button>
              </dt>
              <dd>−{formatPrice(coupon.discountPaise / 100)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{shippingFeeInr === null ? "Not set (test)" : shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        {!coupon && (
          <div className="mt-5 border-t border-sand/60 pt-4">
            <label htmlFor="coupon" className="text-sm">
              Coupon code
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void applyCoupon();
                  }
                }}
                autoComplete="off"
                className="min-w-0 flex-1 border border-sand bg-transparent px-3 py-2 text-sm uppercase focus:border-charcoal"
              />
              <button
                type="button"
                onClick={() => {
                  const email = (document.getElementById("customer.email") as HTMLInputElement | null)?.value.trim();
                  void applyCoupon(email || undefined);
                }}
                disabled={!couponInput.trim() || couponState.checking}
                className="border border-charcoal px-4 py-2 text-xs tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory disabled:opacity-40"
              >
                {couponState.checking ? "Checking…" : "Apply"}
              </button>
            </div>
            {couponState.error && <p className="mt-1.5 text-xs text-terracotta">{couponState.error}</p>}
          </div>
        )}
        <p className="mt-4 text-xs text-charcoal/50">The final amount is confirmed by our server before payment.</p>
      </aside>
    </div>
  );
}
