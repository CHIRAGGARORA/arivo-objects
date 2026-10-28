"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/lib/cart-context";
import { formatPrice, cartLineImage } from "@/lib/products";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { isPlaceholderKey } from "@/lib/placeholderLabels";
import { CheckoutButton } from "@/components/cart/CheckoutButton";

export function CartPageContent() {
  const { lines, removeItem, updateQuantity, subtotal, isSellable } = useCart();

  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-3xl">
        <h1 className="font-display text-3xl md:text-5xl">Cart</h1>

        {lines.length === 0 ? (
          <div className="mt-16 flex flex-col items-center py-10 text-center">
            <p className="text-sm text-charcoal/60">Your cart is empty.</p>
            <Link
              href="/shop"
              className="mt-6 inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10">
            <ul className="divide-y divide-sand/60 border-y border-sand/60">
              {lines.map((line) => (
                <li key={`${line.productSlug}-${line.variantId}`} className="flex gap-5 py-6">
                  <div className="h-28 w-28 shrink-0 overflow-hidden bg-bone">
                    {isPlaceholderKey(cartLineImage(line.productSlug, line.variantId, line.image)) ? (
                      <PlaceholderImage alt={`${line.name}, ${line.variantLabel}`} aspect="square" />
                    ) : (
                      <div className="relative h-full w-full">
                        <Image src={cartLineImage(line.productSlug, line.variantId, line.image)} alt={line.name} fill className="object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-sm font-medium">{line.name}</p>
                        <p className="text-xs text-charcoal/60">{line.variantLabel}</p>
                        {!isSellable(line.productSlug, line.variantId) && (
                          <p className="mt-1 text-xs text-terracotta">Not yet available to order online</p>
                        )}
                      </div>
                      <p className="text-sm">{formatPrice(line.price * line.quantity)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-sand">
                        <button
                          className="px-3 py-1.5 text-sm"
                          onClick={() =>
                            updateQuantity(line.productSlug, line.variantId, line.quantity - 1)
                          }
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          –
                        </button>
                        <span className="px-3 text-sm">{line.quantity}</span>
                        <button
                          className="px-3 py-1.5 text-sm"
                          onClick={() =>
                            updateQuantity(line.productSlug, line.variantId, line.quantity + 1)
                          }
                          aria-label={`Increase quantity of ${line.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-xs text-charcoal/60 underline hover:text-charcoal"
                        onClick={() => removeItem(line.productSlug, line.variantId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center justify-between text-base">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="mt-6 sm:max-w-xs">
              <CheckoutButton />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
