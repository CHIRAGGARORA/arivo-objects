"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { PriceTag } from "@/components/shop/PriceTag";
import { MAX_QTY_PER_LINE, useCart } from "@/lib/cart-context";

interface ProductInfoProps {
  product: Product;
  /** Currently selected variant id — owned by the parent (ProductView), not
   *  this component, so the gallery and this panel always agree on which
   *  variant is selected. */
  variantId: string;
  onVariantChange: (variantId: string) => void;
}

export function ProductInfo({ product, variantId, onVariantChange }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, setLineQuantity, checkoutEnabled, isSellable } = useCart();
  const router = useRouter();

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const orderable = isSellable(product.slug, variant.id);
  // Products the catalogue marks as not for sale at all read "Coming soon".
  const comingSoon = product.sellable === false;

  function handleBuyNow() {
    // Sets (not adds) the quantity, so pressing Buy Now on something
    // already in the cart never silently duplicates it.
    setLineQuantity(product, variantId, quantity);
    router.push(checkoutEnabled ? "/checkout" : "/cart");
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">{product.name}</h1>
      <div className="mt-4">
        <PriceTag product={product} size="lg" />
        {product.mrp && <p className="mt-1.5 text-sm text-charcoal/60">MRP inclusive of all taxes</p>}
      </div>
      <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal/80">
        {product.shortDescription}
      </p>

      {product.variants.length > 1 && (
        <fieldset className="mt-8">
          <legend className="text-base">
            {product.variantLabel ?? "Colour"} — {variant.label}
          </legend>
          <div className="mt-3 flex gap-3">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onVariantChange(v.id)}
                aria-pressed={v.id === variantId}
                aria-label={v.label}
                className={`h-10 w-10 rounded-full border-2 transition-colors duration-400 ${
                  v.id === variantId ? "border-charcoal" : "border-transparent hover:border-charcoal/30"
                }`}
              >
                <span
                  className="block h-full w-full rounded-full border border-charcoal/10"
                  style={{ backgroundColor: v.colorSwatch }}
                />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-8 flex items-center gap-4">
        <div className="flex items-center border border-sand">
          <button
            type="button"
            className="px-4 py-3 text-base"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            –
          </button>
          <span className="px-3 text-base font-medium" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="px-4 py-3 text-base"
            onClick={() => setQuantity((q) => Math.min(MAX_QTY_PER_LINE, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <p className="text-sm text-charcoal/60">
          {comingSoon
            ? "Coming soon"
            : variant.inStock === false
            ? "Currently unavailable"
            : !orderable
            ? "Not yet available to order online"
            : "Availability confirmed at checkout"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => addItem(product, variantId, quantity)}
          disabled={!orderable}
          className="flex-1 bg-charcoal py-4 text-sm font-medium uppercase tracking-luxe text-ivory transition-opacity duration-400 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
        >
          {comingSoon ? "Coming soon" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!orderable}
          className="flex-1 border border-charcoal py-4 text-sm font-medium uppercase tracking-luxe transition-colors duration-400 hover:bg-charcoal hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-charcoal"
        >
          Buy now
        </button>
      </div>

      <ul className="mt-6 space-y-2 border-t border-sand/60 pt-5 text-sm text-charcoal/75">
        <li>Free shipping on every order</li>
        <li>Dispatched within 48 hours</li>
        <li>No returns</li>
      </ul>

      {product.category === "tray" && (
        <p className="mt-4 text-sm text-charcoal/60">
          Each piece is individually cast. Marble patterns vary naturally — no two
          pieces are exactly identical.
        </p>
      )}
    </div>
  );
}
