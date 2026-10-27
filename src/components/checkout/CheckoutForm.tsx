"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import type {
  RazorpayCheckoutFailureResponse,
  RazorpayCheckoutSuccessResponse,
} from "@/types/razorpay-checkout";

interface FormState {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
};

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutForm() {
  const { lines, subtotal, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "applied" | "error">(
    "idle"
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountRupees: number;
    totalRupees: number;
  } | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim() || couponStatus === "checking") return;
    setCouponStatus("checking");
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            productSlug: l.productSlug,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
          couponCode: couponInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.coupon_code) {
        setCouponStatus("error");
        setCouponError(data.error ?? "That coupon code isn't valid.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: data.coupon_code,
        discountRupees: data.discount_rupees,
        totalRupees: data.total_rupees,
      });
      setCouponStatus("applied");
    } catch {
      setCouponStatus("error");
      setCouponError("Could not check that coupon right now. Please try again.");
      setAppliedCoupon(null);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponStatus("idle");
    setCouponError(null);
  }

  const payableTotal = appliedCoupon ? appliedCoupon.totalRupees : subtotal;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return; // guards against double-click / repeated submits
    setStatus("submitting");
    setError(null);

    try {
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            productSlug: l.productSlug,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
          customer: form,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        setError(createData.error ?? "Could not start checkout. Please try again.");
        setStatus("error");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setError("Could not load the payment form. Check your connection and try again.");
        setStatus("error");
        return;
      }

      const rzp = new window.Razorpay({
        key: createData.key_id,
        amount: createData.amount,
        currency: createData.currency,
        order_id: createData.order_id,
        name: "Arivo Objects",
        description: `Order for ${lines.length} item${lines.length === 1 ? "" : "s"}`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#2B2A28" },
        handler: async (response: RazorpayCheckoutSuccessResponse) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.verified) {
              clearCart();
              router.push(
                `/order-confirmation?order_id=${encodeURIComponent(
                  verifyData.order_id
                )}&payment_id=${encodeURIComponent(verifyData.payment_id)}`
              );
            } else {
              setError(
                "We couldn't verify this payment. If money was deducted, it will be " +
                  "automatically refunded by Razorpay within a few business days — " +
                  "please contact us with your payment ID if you don't see a refund."
              );
              setStatus("error");
            }
          } catch {
            setError("Could not confirm your payment. Please contact us before trying again.");
            setStatus("error");
          }
        },
        modal: {
          // User closed the checkout modal without paying — not a failure,
          // just an abandoned/cancelled attempt. Let them try again freely.
          ondismiss: () => {
            setStatus("idle");
          },
        },
      });

      rzp.on("payment.failed", (response: RazorpayCheckoutFailureResponse) => {
        setError(response.error?.description || "Payment failed. Please try again.");
        setStatus("error");
      });

      rzp.open();
    } catch {
      setError("Something went wrong starting checkout. Please try again.");
      setStatus("error");
    }
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 md:py-24">
        <Container className="max-w-xl text-center">
          <h1 className="font-display text-3xl md:text-5xl">Checkout</h1>
          <p className="mt-6 text-sm text-charcoal/60">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-6 inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
          >
            Continue shopping
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Checkout</h1>

        <div className="mt-8 border border-sand/60 p-5">
          <p className="text-sm font-medium">Order summary</p>
          <ul className="mt-3 space-y-2 text-sm text-charcoal/75">
            {lines.map((l) => (
              <li key={`${l.productSlug}-${l.variantId}`} className="flex justify-between">
                <span>
                  {l.name} ({l.variantLabel}) × {l.quantity}
                </span>
                <span>{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-sand/60 pt-3 text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-charcoal/60">
            <span>Shipping</span>
            <span>Free</span>
          </div>

          <div className="mt-4 border-t border-sand/60 pt-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal/75">
                  Coupon <span className="font-medium">{appliedCoupon.code}</span> applied
                  (−{formatPrice(appliedCoupon.discountRupees)})
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-charcoal/50 underline underline-offset-2 hover:text-charcoal"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className="min-w-0 flex-1 border border-sand bg-transparent px-4 py-2.5 text-sm uppercase focus:border-charcoal"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || couponStatus === "checking"}
                    className="border border-charcoal px-4 py-2.5 text-xs tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {couponStatus === "checking" ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 text-xs text-terracotta">{couponError}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between border-t border-sand/60 pt-4 text-base font-medium">
            <span>Total</span>
            <span>{formatPrice(payableTotal)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <p className="text-sm font-medium">Shipping details</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={(v) => updateField("name", v)} required />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => updateField("email", v)}
              required
            />
            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => updateField("phone", v)}
              required
            />
            <Field
              label="Pincode"
              value={form.pincode}
              onChange={(v) => updateField("pincode", v)}
              required
            />
            <Field
              label="Address line 1"
              value={form.address1}
              onChange={(v) => updateField("address1", v)}
              required
              className="sm:col-span-2"
            />
            <Field
              label="Address line 2 (optional)"
              value={form.address2}
              onChange={(v) => updateField("address2", v)}
              className="sm:col-span-2"
            />
            <Field label="City" value={form.city} onChange={(v) => updateField("city", v)} required />
            <Field label="State" value={form.state} onChange={(v) => updateField("state", v)} required />
          </div>

          {error && (
            <p className="border border-terracotta/50 bg-terracotta/10 px-4 py-3 text-sm text-charcoal/80">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-charcoal py-4 text-sm tracking-wide text-ivory transition-opacity duration-400 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "submitting" ? "Starting payment…" : `Pay ${formatPrice(payableTotal)} with Razorpay`}
          </button>
          <p className="text-center text-xs text-charcoal/50">
            Payment is processed securely by Razorpay. Arivo Objects never sees or stores your
            card details.
          </p>
        </form>
      </Container>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal"
      />
    </div>
  );
}
