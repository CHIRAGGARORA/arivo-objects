"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

/**
 * Proceeds to checkout only when the server has payments configured AND
 * every cart line is approved for online sale. Otherwise explains why.
 */
export function CheckoutButton({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  const { lines, checkoutEnabled, allLinesSellable } = useCart();
  const ready = checkoutEnabled && allLinesSellable && lines.length > 0;

  if (ready) {
    return (
      <Link
        href="/checkout"
        onClick={onNavigate}
        className={`block bg-charcoal py-3 text-center text-sm tracking-wide text-ivory transition-opacity duration-400 hover:opacity-90 ${className}`}
      >
        Checkout
      </Link>
    );
  }

  const reason = !checkoutEnabled
    ? "Online payment isn't available yet."
    : "Some items in your cart can't be ordered online yet — remove them to continue.";
  return (
    <div>
      <button
        type="button"
        disabled
        className={`w-full bg-charcoal py-3 text-sm tracking-wide text-ivory opacity-40 ${className}`}
      >
        {checkoutEnabled ? "Checkout unavailable" : "Online checkout coming soon"}
      </button>
      <p className="mt-3 text-center text-xs text-charcoal/60">{reason}</p>
    </div>
  );
}
