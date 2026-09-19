export interface ProductImage {
  /** Path under /public, or a placeholder key handled by PlaceholderImage */
  src: string;
  alt: string;
  /** true while this is a neutral placeholder block, not real photography */
  isPlaceholder: boolean;
  /** What this image is for — lets components pick the right shot for the right spot */
  role?: "main" | "gallery" | "lifestyle" | "detail";
}

export interface ProductVariant {
  id: string;
  label: string; // e.g. "Black Marble"
  colorSwatch: string; // hex used for the swatch dot
  images: ProductImage[];
  /** null until confirmed in stock by the maker */
  inStock: boolean | null;
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
  shortDescription: string;
  theObject: string;
  theMaterial: string;
  theProcess: string;
  details: ProductDetails | CandleDetails;
  variants: ProductVariant[];
  featured: boolean;
}

export interface JournalArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string[]; // paragraphs
  readingTime: string;
}
