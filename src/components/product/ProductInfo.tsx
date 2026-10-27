"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { formatPrice, isSellable } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

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
  const { addItem, setLineQuantity } = useCart();
  const router = useRouter();

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const canPurchase = isSellable(product);

  function handleBuyNow() {
    // Sets (not adds) the quantity, so pressing Buy Now on something
    // already in the cart never silently duplicates it — then takes the
    // person straight to checkout.
    setLineQuantity(product, variantId, quantity);
    router.push("/checkout");
  }

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">{product.name}</h1>
      <p className="mt-2 text-lg">{formatPrice(product.price)}</p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal/75">
        {product.shortDescription}
      </p>

      {product.variants.length > 1 && (
        <fieldset className="mt-8">
          <legend className="text-sm">
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
                className={`h-8 w-8 rounded-full border-2 transition-colors duration-400 ${
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
            className="px-3 py-2 text-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            –
          </button>
          <span className="px-3 text-sm" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="px-3 py-2 text-sm"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <p className="text-xs text-charcoal/50">
          {!canPurchase
            ? "Coming soon"
            : variant.inStock === false
            ? "Currently unavailable"
            : "Availability confirmed at checkout"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => addItem(product, variantId, quantity)}
          disabled={!canPurchase}
          className="flex-1 bg-charcoal py-3 text-sm tracking-wide text-ivory transition-opacity duration-400 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
        >
          {canPurchase ? "Add to cart" : "Coming soon"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!canPurchase}
          className="flex-1 border border-charcoal py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-charcoal"
        >
          Buy now
        </button>
      </div>

      <ul className="mt-6 space-y-1.5 border-t border-sand/60 pt-5 text-xs text-charcoal/70">
        <li>Free shipping on every order</li>
        <li>Dispatched within 48 hours</li>
        <li>No returns</li>
      </ul>

      {product.category === "tray" && (
        <p className="mt-4 text-xs text-charcoal/50">
          Each piece is individually cast. Marble patterns vary naturally — no two
          pieces are exactly identical.
        </p>
      )}
    </div>
  );
}
