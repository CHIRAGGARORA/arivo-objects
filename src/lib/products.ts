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
        sellable: true, // approved by owner for launch (still needs stock in /admin)
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
        sellable: true, // approved by owner for launch (still needs stock in /admin)
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
        sellable: true, // approved by owner for launch (still needs stock in /admin)
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
        sellable: true, // approved by owner for launch (still needs stock in /admin)
        images: [
          {
            src: "/products/large-cloud-marble-tray/black-marble/main.jpg",
            alt: "Large cloud-shaped marble tray in black marble, shown on a travertine surface",
            isPlaceholder: false,
            role: "main",
          },
          {
            src: "/products/large-cloud-marble-tray/black-marble/gallery-1.jpg",
            alt: "Large cloud-shaped marble tray styled with perfume, a watch and jewellery",
            isPlaceholder: false,
            role: "gallery",
          },
          {
            src: "/products/large-cloud-marble-tray/black-marble/gallery-2.jpg",
            alt: "Large cloud-shaped marble tray styled on a wood console with a mirror and jewellery",
            isPlaceholder: false,
            role: "gallery",
          },
          {
            src: "/products/large-cloud-marble-tray/black-marble/detail.jpg",
            alt: "Close-up of the black marble texture on the large cloud tray",
            isPlaceholder: false,
            role: "detail",
          },
          {
            src: "/products/large-cloud-marble-tray/black-marble/lifestyle.jpg",
            alt: "Large cloud-shaped marble tray styled with a lit candle and a small vase in a living room",
            isPlaceholder: false,
            role: "lifestyle",
          },
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "scented-candle-jar-pack-of-4",
    name: "Scented Candle Jar Set — Pack of 4",
    category: "candle",
    price: 899,
    variantLabel: "Fragrance",
    shortDescription:
      "Four sandalwood-scented soy wax candles, 130 ml each, in patterned jars with lids — every jar a different colour. A ready-made gift set.",
    theObject:
      "Four candle jars with lids, each in its own pattern — sky blue, mustard yellow, pink-and-teal and red. Every jar is filled with 130 ml of soy wax scented with warm, woody sandalwood. Give the set as a housewarming, festive or birthday gift, or split it across rooms at home. Once the candle is finished, the patterned jar can be reused for jewellery, matches or small trinkets. Props shown in the photos are for styling only; you receive the four candle jars with lids.",
    // theMaterial / theProcess intentionally omitted until the maker supplies
    // confirmed copy — the product page only shows sections that exist.
    details: {
      material: "Printed metal tin with lid",
      dimensions: "Each jar approx. 7.2 cm wide × 5 cm tall (set of 4)",
      weight: null,
      care: [
        "Trim the wick short before each burn.",
        "Never leave a burning candle unattended.",
        "Keep away from children, pets, drafts and flammable materials.",
        "Burn on a stable, heat-resistant surface.",
      ],
      waxType: "Soy wax, 130 ml per jar",
      fragrance: "Sandalwood",
      wickType: "Cotton",
      burnTimeHours: null,
      fragranceLoadPercent: null,
      vesselReusable: true,
      safetyTested: false,
    } satisfies CandleDetails,
    variants: [
      {
        id: "sandalwood",
        label: "Sandalwood",
        colorSwatch: "#C8A27A",
        inStock: null,
        sellable: true, // approved by owner for launch (still needs stock in /admin)
        images: [
          {
            src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-row.webp",
            alt: "Four lit sandalwood candles in blue, yellow, pink-and-teal and red patterned jars on linen, with sandalwood sticks and rose petals",
            isPlaceholder: false,
            role: "main",
          },
          {
            src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-evening.webp",
            alt: "The four patterned candle jars lit on a wooden side table beside a sofa, with chai, a book and incense",
            isPlaceholder: false,
            role: "gallery",
          },
          {
            src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp",
            alt: "Top-down view of the four open candle jars with their patterned lids, cream soy wax and sandalwood pieces",
            isPlaceholder: false,
            role: "gallery",
            aspect: "square",
          },
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "mini-scented-candle-jar-pack-of-4",
    name: "Mini Scented Candle Jar Set — Pack of 4",
    category: "candle",
    price: 500,
    variantLabel: "Fragrance",
    // Coming soon: no photos or dimensions yet. Flip `sellable` to true (and
    // add real images) when it's ready to take orders.
    sellable: false,
    shortDescription:
      "A smaller size of the four-jar candle set. Coming soon.",
    theObject:
      "A smaller version of the four-jar scented candle set, planned for launch soon.",
    details: {
      material: "Patterned jar with lid",
      dimensions: null,
      weight: null,
      care: [
        "Trim the wick short before each burn.",
        "Never leave a burning candle unattended.",
        "Keep away from children, pets, drafts and flammable materials.",
        "Burn on a stable, heat-resistant surface.",
      ],
      waxType: null,
      fragrance: "Sandalwood",
      wickType: null,
      burnTimeHours: null,
      fragranceLoadPercent: null,
      vesselReusable: true,
      safetyTested: false,
    } satisfies CandleDetails,
    variants: [
      {
        id: "sandalwood",
        label: "Sandalwood",
        colorSwatch: "#C8A27A",
        inStock: null,
        sellable: false, // [OWNER_APPROVAL_REQUIRED] — product also marked not for sale above
        images: [
          {
            src: "placeholder:mini-candle-jars",
            alt: "Mini scented candle jar set — photos coming soon",
            isPlaceholder: true,
            role: "main",
          },
        ],
      },
    ],
    featured: false,
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

/** True unless a product has been explicitly marked not-yet-sellable. */
export function isSellable(product: Product): boolean {
  return product.sellable !== false;
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
