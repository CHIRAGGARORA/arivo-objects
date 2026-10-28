"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

export interface ShopCard {
  key: string;
  category: string;
  variantIds: string[];
  node: ReactNode;
}

/**
 * Category tabs + grid, filtered in the browser so the shop page can be a
 * prebuilt static page. The cards themselves are rendered on the server.
 */
export function ShopFilter({ cards, colourLabels }: { cards: ShopCard[]; colourLabels: Record<string, string> }) {
  const params = useSearchParams();
  const raw = params.get("category");
  const category = raw === "candle" || raw === "tray" ? raw : undefined;
  const colour = params.get("colour") ?? undefined;
  const visible = cards.filter((c) => (!category || c.category === category) && (!colour || c.variantIds.includes(colour)));
  return <ShopGrid cards={visible} category={category} colour={colour} colourLabel={colour ? colourLabels[colour] ?? colour : undefined} />;
}

export function ShopGrid({
  cards,
  category,
  colour,
  colourLabel,
}: {
  cards: ShopCard[];
  category?: string;
  colour?: string;
  colourLabel?: string;
}) {
  const tabs = [
    { label: "All", href: "/shop", active: !category },
    { label: "Candles", href: "/shop?category=candle", active: category === "candle" },
    { label: "Trays", href: "/shop?category=tray", active: category === "tray" },
  ];
  return (
    <>
      <nav aria-label="Filter by category" className="mt-6 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            scroll={false}
            aria-current={t.active ? "page" : undefined}
            className={`rounded-full border px-5 py-2 text-xs font-medium uppercase tracking-luxe transition-colors duration-400 ${
              t.active ? "border-charcoal bg-charcoal text-ivory" : "border-sand text-charcoal/80 hover:border-charcoal"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {colour && (
        <p className="mt-4 text-sm text-charcoal/70">
          Showing: {colourLabel}
          {" · "}
          <Link href="/shop" className="underline hover:no-underline">
            View all
          </Link>
        </p>
      )}

      <div id="collection" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
        {cards.map((c) => (
          <div key={c.key}>{c.node}</div>
        ))}
      </div>
    </>
  );
}
