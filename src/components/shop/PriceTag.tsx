import { Product } from "@/types/product";
import { discountPercent, formatPrice } from "@/lib/products";

/** Selling price, with the label MRP struck through and the % off when there is one. */
export function PriceTag({
  product,
  size = "md",
  badge = true,
}: {
  product: Product;
  size?: "md" | "lg";
  badge?: boolean;
}) {
  const off = discountPercent(product);
  const big = size === "lg";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span
        className={`font-semibold text-charcoal ${big ? "text-3xl" : "text-base"}`}
      >
        {formatPrice(product.price)}
      </span>
      {off !== null && (
        <>
          <span
            className={`text-charcoal/60 line-through ${big ? "text-lg" : "text-sm"}`}
          >
            <span className="sr-only">MRP </span>
            {formatPrice(product.mrp!)}
          </span>
          {badge && (
            <span
              className={`bg-terracotta font-semibold uppercase tracking-wide2 text-ivory ${big ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[0.7rem]"}`}
            >
              {off}% off
            </span>
          )}
        </>
      )}
    </span>
  );
}
