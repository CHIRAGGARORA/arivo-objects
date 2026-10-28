export interface ProductImage {
  /** Path under /public, or a placeholder key handled by PlaceholderImage */
  src: string;
  alt: string;
  /** true while this is a neutral placeholder block, not real photography */
  isPlaceholder: boolean;
  /** What this image is for — lets components pick the right shot for the right spot */
  role?: "main" | "gallery" | "lifestyle" | "detail";
  /**
   * How the product-page gallery frames this image. Defaults to the usual
   * portrait crop; "square" shows a square photo whole (nothing cut off at
   * the sides) — used for supplied photos composed edge to edge.
   */
  aspect?: "square";
}

export interface ProductVariant {
  id: string;
  label: string; // e.g. "Black Marble"
  colorSwatch: string; // hex used for the swatch dot
  images: ProductImage[];
  /** null until confirmed in stock by the maker */
  inStock: boolean | null;
  /**
   * Whether this variant may be bought online. Keep false until the owner
   * explicitly approves selling it. The server also requires a stock row in
   * the database before accepting an order.
   */
  sellable: boolean;
}

export type ProductCategory = "tray" | "candle";

export interface ProductDetails {
  material: string;
  /** null = not yet finalised — render as "To be confirmed" */
  dimensions: string | null;
  weight: string | null;
  care: string[];
}

export interface CandleDetails extends ProductDetails {
  waxType: string | null;
  fragrance: string | null;
  wickType: string | null;
  burnTimeHours: string | null;
  fragranceLoadPercent: string | null;
  vesselReusable: boolean;
  safetyTested: boolean;
}

export interface Product {
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  /**
   * Maximum retail price in rupees, as printed on the product label. Shown
   * struck through next to `price`. Must match the declared MRP on the
   * packaging (Legal Metrology); omit if there is none.
   */
  mrp?: number;
  shortDescription: string;
  theObject: string;
  /** Optional — a product page only shows these sections once they're written. */
  theMaterial?: string;
  theProcess?: string;
  /** What the variant selector chooses between. Defaults to "Colour". */
  variantLabel?: string;
  details: ProductDetails | CandleDetails;
  variants: ProductVariant[];
  featured: boolean;
  /**
   * Whether this product can currently be purchased. Defaults to true when
   * omitted. Set to false for products that aren't ready to sell yet (e.g.
   * products that aren't ready yet) — this is enforced both in the
   * UI (Add to Cart / Buy Now disabled) and, independently, server-side in
   * the order-creation API, so it can't be bypassed by tampering with the
   * client.
   */
  sellable?: boolean;
}

export interface JournalArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string[]; // paragraphs
  readingTime: string;
  category: "Candles" | "Material" | "Care" | "Gifting" | "Styling";
  cover: { src: string; alt: string };
  /** Product slugs shown as "Shop this story" cards at the end of the article. */
  products?: string[];
  /** YYYY-MM-DD, used in search-engine article data. */
  published?: string;
}
