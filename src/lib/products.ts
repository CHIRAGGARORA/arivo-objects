import { Product, CandleDetails, ProductVariant, ProductImage } from "@/types/product";

/**
 * products.ts
 * ---------------------------------------------------------------------------
 * This is the ONLY place product data should be edited. Every page (shop
 * grid, product detail, homepage featured section, related products,
 * structured data) reads from this file.
 *
 * TO REPLACE PLACEHOLDER PHOTOGRAPHY:
 * 1. Drop real images into /public/products/<slug>/<variant>/ (e.g.
 *    /public/products/small-oval-tray/black-marble/01.jpg).
 * 2. Update the matching `images` array below: set `src` to the real path
 *    and `isPlaceholder` to `false`.
 * No other file needs to change.
 *
 * DO NOT invent dimensions, weight, burn time, or fragrance load. Leave
 * those fields `null` until confirmed — the UI renders them as
 * "To be confirmed" rather than guessing.
 * ---------------------------------------------------------------------------
 */

export const products: Product[] = [
  {
    slug: "small-oval-marble-tray",
    name: "Small Oval Marble Tray",
    category: "tray",
    price: 899,
    shortDescription:
      "A small oval tray cast in Jesmonite, with a rope-inspired edge and a marble finish that varies piece to piece.",
    theObject:
      "A quiet, functional tray sized for a bedside table, an entryway console or a bathroom counter. The rope-edge detail gives the rim a subtle, tactile line without becoming decorative for its own sake.",
    theMaterial:
      "Jesmonite is a mineral composite that takes pigment and marbling in a way that plaster and resin can't quite match. It's cast, not carved — the marble pattern you see is formed during pouring, not printed or painted on afterward.",
    theProcess:
      "Each tray is hand-poured into a mould, given time to cure, then hand-sanded and finished. Because the marbling happens during the pour, no two trays come out the same.",
    details: {
      material: "Jesmonite (mineral composite)",
      dimensions: null,
      weight: null,
      care: [
        "Wipe clean with a soft, slightly damp cloth.",
        "Avoid soaking or submerging in water.",
        "Keep away from prolonged direct sunlight to preserve colour.",
        "Not intended for use with sharp or abrasive objects.",
      ],
    },
    variants: [
      {
        id: "black-marble",
        label: "Black Marble",
        colorSwatch: "#2B2A28",
        inStock: null,
        sellable: false, // [OWNER_APPROVAL_REQUIRED]
        images: [
          {
            src: "/products/small-oval-marble-tray/black-marble/main.jpg",
            alt: "Small oval marble tray in black marble, styled on a bedside table with a watch, keys and wallet",
            isPlaceholder: false,
            role: "main",
          },
          {
            src: "/products/small-oval-marble-tray/black-marble/detail.jpg",
            alt: "Close-up of the black marble pattern and rope-edge detail",
            isPlaceholder: false,
            role: "detail",
          },
        ],
      },
      {
        id: "terracotta-marble",
        label: "Terracotta Marble",
        colorSwatch: "#B5654A",
        inStock: null,
        sellable: false, // [OWNER_APPROVAL_REQUIRED]
        images: [
          {
            src: "/products/small-oval-marble-tray/terracotta-marble/main.jpg",
            alt: "Small oval marble tray in terracotta marble, styled with coffee and a ring dish",
            isPlaceholder: false,
            role: "main",
          },
          {
            src: "/products/small-oval-marble-tray/terracotta-marble/detail.jpg",
            alt: "Close-up of the terracotta marble pattern and rope-edge detail",
            isPlaceholder: false,
            role: "detail",
          },
        ],
      },
      {
        id: "ochre-marble",
        label: "Ochre Marble",
        colorSwatch: "#C89B4A",
        inStock: null,
        sellable: false, // [OWNER_APPROVAL_REQUIRED]
        images: [
          {
            src: "/products/small-oval-marble-tray/ochre-marble/main.jpg",
            alt: "Small oval marble tray in ochre marble, styled with glasses and a ring dish",
            isPlaceholder: false,
            role: "main",
          },
          {
            src: "/products/small-oval-marble-tray/ochre-marble/detail.jpg",
            alt: "Close-up of the ochre marble pattern and rope-edge detail",
            isPlaceholder: false,
            role: "detail",
          },
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "large-cloud-marble-tray",
    name: "Large Cloud Marble Tray",
    category: "tray",
    price: 1599,
    shortDescription:
      "An abstract, cloud-shaped tray in Jesmonite — a larger sculptural surface for a console, coffee table or vanity.",
    theObject:
      "An abstract, softly irregular form designed to sit on a larger surface — a coffee table, console or vanity — and hold objects without imposing a rigid shape on the space around it.",
    theMaterial:
      "Cast in the same Jesmonite mineral composite as the rest of the collection, with a marble pattern that forms naturally during the pour.",
    theProcess:
      "Hand-poured, cured, then hand-sanded and finished. The larger surface area means marbling variation is even more visible from piece to piece.",
    details: {
      material: "Jesmonite (mineral composite)",
      dimensions: null,
      weight: null,
      care: [
        "Wipe clean with a soft, slightly damp cloth.",
        "Avoid soaking or submerging in water.",
        "Keep away from prolonged direct sunlight to preserve colour.",
        "Not intended for use with sharp or abrasive objects.",
      ],
    },
    variants: [
      {
        id: "black-marble",
        label: "Black Marble",
        colorSwatch: "#2B2A28",
        inStock: null,
        sellable: false, // [OWNER_APPROVAL_REQUIRED]
        images: [
          { src: "placeholder:tray-cloud-black-front", alt: "Large cloud-shaped marble tray, black marble, front view", isPlaceholder: true, role: "main" },
          { src: "placeholder:tray-cloud-black-scale", alt: "Large cloud-shaped marble tray shown at scale on a table", isPlaceholder: true, role: "gallery" },
          { src: "placeholder:tray-cloud-black-texture", alt: "Close-up of black marble texture on the large tray", isPlaceholder: true, role: "detail" },
          { src: "placeholder:tray-cloud-black-lifestyle", alt: "Large cloud-shaped marble tray styled on a coffee table", isPlaceholder: true, role: "lifestyle" },
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "flower-jesmonite-candle",
    name: "Flower Jesmonite Candle",
    category: "candle",
    price: 1499,
    shortDescription:
      "A flower-engraved Jesmonite vessel, to eventually be sold complete with a sandalwood soy wax fill and cotton wick.",
    theObject:
      "A hand-finished Jesmonite vessel with an engraved flower motif, designed to be lit as a candle and, once finished, kept as a small object in its own right.",
    theMaterial:
      "The vessel is cast in Jesmonite, the same mineral composite used across the collection. The wax fill is planned as a sandalwood-scented soy wax with a cotton wick — final specifications are pending safety and burn testing.",
    theProcess:
      "The vessel is hand-cast and the flower detail hand-finished before the wax is poured. Marble pattern and engraving depth vary slightly from piece to piece.",
    details: {
      material: "Jesmonite vessel (mineral composite)",
      dimensions: null,
      weight: null,
      care: [
        "Trim the wick to 5mm before each burn (once specifications are confirmed).",
        "Keep away from drafts, children and pets while lit.",
        "Never leave a burning candle unattended.",
      ],
      waxType: null, // e.g. "Soy wax" — pending final formulation
      fragrance: null, // e.g. "Sandalwood" — pending final formulation
      wickType: null, // e.g. "Cotton" — pending final confirmation
      burnTimeHours: null, // NOT ESTIMATED — pending burn testing
      fragranceLoadPercent: null, // pending final formulation
      vesselReusable: true,
      safetyTested: false,
    } satisfies CandleDetails,
    variants: [
      {
        id: "black-marble",
        label: "Black Marble",
        colorSwatch: "#2B2A28",
        inStock: null,
        sellable: false, // [OWNER_APPROVAL_REQUIRED]
        images: [
          { src: "placeholder:candle-flower-black-unlit", alt: "Flower-engraved Jesmonite candle, black marble, unlit", isPlaceholder: true, role: "main" },
          { src: "placeholder:candle-flower-black-lit", alt: "Flower-engraved Jesmonite candle, black marble, lit", isPlaceholder: true, role: "gallery" },
          { src: "placeholder:candle-flower-black-engraving", alt: "Close-up of flower engraving detail on candle vessel", isPlaceholder: true, role: "detail" },
          { src: "placeholder:candle-flower-black-lifestyle", alt: "The Arivo flower candle lit in a considered, low-light setting", isPlaceholder: true, role: "lifestyle" },
        ],
      },
    ],
    featured: true,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getRelatedProducts(slug: string, limit = 3): Product[] {
  return products.filter((p) => p.slug !== slug).slice(0, limit);
}

export function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

/**
 * Image-role helpers. Every variant's `images` array can mix main, gallery,
 * detail (close-up) and lifestyle (in-context) shots — these pick the right
 * one for a given spot on the site without any component needing to know
 * the array order.
 */
export function getMainImage(variant: ProductVariant): ProductImage {
  return variant.images.find((i) => i.role === "main") ?? variant.images[0];
}

export function getGalleryImages(variant: ProductVariant): ProductImage[] {
  return variant.images.filter((i) => i.role !== "lifestyle");
}

export function getLifestyleImage(variant: ProductVariant): ProductImage | undefined {
  return variant.images.find((i) => i.role === "lifestyle");
}

export function getDetailImage(variant: ProductVariant): ProductImage | undefined {
  return variant.images.find((i) => i.role === "detail");
}
