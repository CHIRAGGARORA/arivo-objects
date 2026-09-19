"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Product } from "@/types/product";
import { getMainImage } from "./products";

/**
 * cart-context.tsx
 * ---------------------------------------------------------------------------
 * FRONTEND-ONLY DEMO CART.
 *
 * This context stores cart state in memory (React state) for the current
 * browser session only. It does NOT:
 *   - persist across page reloads (by design — no localStorage dependency
 *     baked in, keeping this simple to reason about while wiring real
 *     commerce)
 *   - talk to a payment gateway
 *   - reserve inventory
 *
 * WHEN REAL COMMERCE IS ADDED (Shopify or a custom backend):
 * Replace the internals of `addItem`, `removeItem`, `updateQuantity` with
 * calls to the real cart API (e.g. Shopify's Storefront API cart mutations),
 * and keep the same context shape so components using `useCart()` do not
 * need to change.
 *
 * `addItem` (Add to Cart) sums quantity into an existing line.
 * `setLineQuantity` (used by Buy Now) instead takes the larger of the
 * existing and new quantity — so pressing Buy Now on something already in
 * the cart updates it intentionally rather than duplicating it.
 * ---------------------------------------------------------------------------
 */

export interface CartLine {
  productSlug: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, variantId: string, quantity?: number) => void;
  /**
   * Sets a line's quantity to the greater of its current quantity and the
   * given quantity, rather than summing — used by "Buy Now" so pressing it
   * repeatedly (or with different quantities) never silently stacks
   * duplicate quantity on top of what's already in the cart.
   */
  setLineQuantity: (product: Product, variantId: string, quantity: number) => void;
  removeItem: (productSlug: string, variantId: string) => void;
  updateQuantity: (productSlug: string, variantId: string, quantity: number) => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (product: Product, variantId: string, quantity = 1) => {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) return;

      setLines((prev) => {
        const existing = prev.find(
          (l) => l.productSlug === product.slug && l.variantId === variantId
        );
        if (existing) {
          return prev.map((l) =>
            l.productSlug === product.slug && l.variantId === variantId
              ? { ...l, quantity: l.quantity + quantity }
              : l
          );
        }
        return [
          ...prev,
          {
            productSlug: product.slug,
            variantId,
            name: product.name,
            variantLabel: variant.label,
            price: product.price,
            quantity,
            image: getMainImage(variant).src,
          },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  const setLineQuantity = useCallback(
    (product: Product, variantId: string, quantity: number) => {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) return;

      setLines((prev) => {
        const existingIndex = prev.findIndex(
          (l) => l.productSlug === product.slug && l.variantId === variantId
        );
        if (existingIndex !== -1) {
          // Never blindly stack on top of what's already there — take the
          // larger of the two quantities so repeated "Buy Now" presses (or
          // a different quantity selected the second time) can't silently
          // duplicate the line.
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: Math.max(next[existingIndex].quantity, quantity),
          };
          return next;
        }
        return [
          ...prev,
          {
            productSlug: product.slug,
            variantId,
            name: product.name,
            variantLabel: variant.label,
            price: product.price,
            quantity,
            image: getMainImage(variant).src,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productSlug: string, variantId: string) => {
    setLines((prev) =>
      prev.filter((l) => !(l.productSlug === productSlug && l.variantId === variantId))
    );
  }, []);

  const updateQuantity = useCallback(
    (productSlug: string, variantId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productSlug, variantId);
        return;
      }
      setLines((prev) =>
        prev.map((l) =>
          l.productSlug === productSlug && l.variantId === variantId
            ? { ...l, quantity }
            : l
        )
      );
    },
    [removeItem]
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const value: CartContextValue = {
    lines,
    isOpen,
    openCart,
    closeCart,
    addItem,
    setLineQuantity,
    removeItem,
    updateQuantity,
    subtotal,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
