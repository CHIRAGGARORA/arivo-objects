"use client";

import { useCart } from "@/lib/cart-context";
import { formatPrice, cartLineImage } from "@/lib/products";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { isPlaceholderKey } from "@/lib/placeholderLabels";
import Image from "next/image";
import { CheckoutButton } from "@/components/cart/CheckoutButton";

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeItem, updateQuantity, subtotal, isSellable } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-charcoal/40 transition-opacity duration-400 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory shadow-none transition-transform duration-400 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-sand/60 px-6 py-5">
          <h2 className="font-display text-lg">Your Cart</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="text-charcoal/70 hover:text-charcoal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm text-charcoal/60">Your cart is empty.</p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-5 border border-charcoal px-6 py-2.5 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {lines.map((line) => (
                <li key={`${line.productSlug}-${line.variantId}`} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden bg-bone">
                    {isPlaceholderKey(cartLineImage(line.productSlug, line.variantId, line.image)) ? (
                      <PlaceholderImage alt={`${line.name}, ${line.variantLabel}`} aspect="square" />
                    ) : (
                      <div className="relative h-full w-full">
                        <Image src={cartLineImage(line.productSlug, line.variantId, line.image)} alt={line.name} fill className="object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-charcoal/60">{line.variantLabel}</p>
                      {!isSellable(line.productSlug, line.variantId) && (
                        <p className="mt-1 text-xs text-terracotta">Not yet available to order online</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-sand">
                        <button
                          className="px-2 py-1 text-sm"
                          onClick={() =>
                            updateQuantity(line.productSlug, line.variantId, line.quantity - 1)
                          }
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          –
                        </button>
                        <span className="px-2 text-sm">{line.quantity}</span>
                        <button
                          className="px-2 py-1 text-sm"
                          onClick={() =>
                            updateQuantity(line.productSlug, line.variantId, line.quantity + 1)
                          }
                          aria-label={`Increase quantity of ${line.name}`}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm">{formatPrice(line.price * line.quantity)}</p>
                    </div>
                    <button
                      className="mt-1 self-start text-xs text-charcoal/50 underline hover:text-charcoal"
                      onClick={() => removeItem(line.productSlug, line.variantId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-sand/60 px-6 py-6">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <CheckoutButton onNavigate={closeCart} />
        </div>
      </aside>
    </>
  );
}
