"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Product } from "@/types/product";
import { getMainImage, products } from "./products";

/**
 * cart-context.tsx
 * ---------------------------------------------------------------------------
 * Browser cart. Lines are saved to localStorage so the cart survives a
 * reload or a trip to the payment page, and are refreshed from products.ts
 * on load (so a stale saved price or a removed product never lingers).
 *
 * Prices here are for DISPLAY ONLY. The server re-prices every line from
 * products.ts at checkout and never trusts anything the browser sends.
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
  /** Empties the cart — used once a payment is verified as captured. */
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  /** Server says checkout is configured (payment + database). */
  checkoutEnabled: boolean;
  /** Every line in the cart can currently be ordered online. */
  allLinesSellable: boolean;
  /** Whether a variant can be ordered online (decided by the server). */
  isSellable: (productSlug: string, variantId: string) => boolean;
  /** Sellable but out of stock right now. */
  isSoldOut: (productSlug: string, variantId: string) => boolean;
}

const STORAGE_KEY = "arivo-cart-v1";
export const MAX_QTY_PER_LINE = 10;


/** Rebuild saved lines from the current catalogue, dropping anything unknown. */
function refreshLines(saved: unknown): CartLine[] {
  if (!Array.isArray(saved)) return [];
  const out: CartLine[] = [];
  for (const raw of saved) {
    const l = raw as Partial<CartLine>;
    const product = products.find((p) => p.slug === l.productSlug);
    const variant = product?.variants.find((v) => v.id === l.variantId);
    const qty = Math.floor(Number(l.quantity));
    if (!product || !variant || !(qty >= 1)) continue;
    out.push({
      productSlug: product.slug,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      price: product.price,
      quantity: Math.min(qty, MAX_QTY_PER_LINE),
      image: getMainImage(variant).src,
    });
  }
  return out;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({
  children,
  checkoutEnabled = false,
  sellableVariants = [],
  soldOutVariants = [],
}: {
  children: ReactNode;
  checkoutEnabled?: boolean;
  /** "slug/variantId" keys the server allows to be ordered. */
  sellableVariants?: string[];
  /** "slug/variantId" keys with no stock (from a cached stock read). */
  soldOutVariants?: string[];
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // false until the saved cart has been restored; nothing is written to
  // storage before then, so a fast navigation can't overwrite it with [].
  const [hydrated, setHydrated] = useState(false);

  // Restore once on mount, then save on every change. Storage can be
  // unavailable (private mode, blocked site data) — the cart still works,
  // it just won't persist.
  useEffect(() => {
    let restored: CartLine[] = [];
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) restored = refreshLines(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    setLines((current) => (current.length ? current : restored));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

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
              ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QTY_PER_LINE) }
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
            quantity: Math.min(quantity, MAX_QTY_PER_LINE),
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
            quantity: Math.min(Math.max(next[existingIndex].quantity, quantity), MAX_QTY_PER_LINE),
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
            quantity: Math.min(quantity, MAX_QTY_PER_LINE),
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
            ? { ...l, quantity: Math.min(quantity, MAX_QTY_PER_LINE) }
            : l
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const sellableSet = useMemo(() => new Set(sellableVariants), [sellableVariants]);
  const isSellable = useCallback(
    (productSlug: string, variantId: string) => sellableSet.has(`${productSlug}/${variantId}`),
    [sellableSet]
  );
  const soldOutSet = useMemo(() => new Set(soldOutVariants), [soldOutVariants]);
  const isSoldOut = useCallback(
    (productSlug: string, variantId: string) => soldOutSet.has(`${productSlug}/${variantId}`),
    [soldOutSet]
  );
  const allLinesSellable = useMemo(
    () => lines.every((l) => isSellable(l.productSlug, l.variantId)),
    [lines, isSellable]
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
    clearCart,
    subtotal,
    itemCount,
    checkoutEnabled,
    allLinesSellable,
    isSellable,
    isSoldOut,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
