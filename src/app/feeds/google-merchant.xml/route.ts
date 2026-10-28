import { products, getMainImage, isSellable } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";
import { sellableVariantKeys } from "@/lib/server/catalog";
import { soldOutVariantKeys } from "@/lib/server/storefront";
import { ProductCategory } from "@/types/product";

/**
 * Google Merchant Center product feed (RSS 2.0 with the g: namespace).
 * Add it in Merchant Center as a scheduled file fetch so prices and stock
 * stay in sync with products.ts and the inventory table:
 *   https://www.arivoobjects.com/feeds/google-merchant.xml
 * One item per sellable variant; colours of one product share item_group_id.
 * Shipping and returns come from Merchant Center's own settings.
 */

export const revalidate = 3600;

const GOOGLE_CATEGORY: Record<ProductCategory, string> = {
  candle: "Home & Garden > Decor > Home Fragrances > Candles",
  tray: "Home & Garden > Decor > Decorative Trays",
};

const PRODUCT_TYPE: Record<ProductCategory, string> = {
  candle: "Candles",
  tray: "Marble Trays",
};

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const sellable = new Set(sellableVariantKeys());
  const soldOut = new Set(await soldOutVariantKeys());

  const items = products.filter(isSellable).flatMap((product) => {
    const isColourChoice = product.variants.length > 1 && (product.variantLabel ?? "Colour") === "Colour";
    return product.variants
      .filter((v) => sellable.has(`${product.slug}/${v.id}`))
      .map((v) => {
        const main = getMainImage(v);
        const extra = v.images.filter((i) => i !== main && !i.isPlaceholder).slice(0, 10);
        const link = `${SITE_URL}/products/${product.slug}${product.variants.length > 1 ? `?variant=${v.id}` : ""}`;
        const fields: [string, string][] = [
          ["g:id", `${product.slug}-${v.id}`],
          ["g:title", isColourChoice ? `${product.name} - ${v.label}` : product.name],
          ["g:description", [product.shortDescription, product.theObject].join(" ")],
          ["g:link", link],
          ["g:image_link", `${SITE_URL}${main.src}`],
          ...extra.map((i): [string, string] => ["g:additional_image_link", `${SITE_URL}${i.src}`]),
          ["g:availability", soldOut.has(`${product.slug}/${v.id}`) ? "out_of_stock" : "in_stock"],
          ["g:price", `${product.price.toFixed(2)} ${siteConfig.currency}`],
          ["g:brand", "Arivo Objects"], // as registered in Merchant Center
          ["g:condition", "new"],
          ["g:identifier_exists", "no"],
          ["g:google_product_category", GOOGLE_CATEGORY[product.category]],
          ["g:product_type", PRODUCT_TYPE[product.category]],
          ["g:material", product.details.material],
          ...(product.variants.length > 1 ? [["g:item_group_id", product.slug] as [string, string]] : []),
          ...(isColourChoice ? [["g:color", v.label] as [string, string]] : []),
        ];
        return `    <item>\n${fields.map(([k, val]) => `      <${k}>${xml(val)}</${k}>`).join("\n")}\n    </item>`;
      });
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Arivo Objects</title>
    <link>${SITE_URL}</link>
    <description>Hand-poured marble trays and sandalwood soy wax candle sets.</description>
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
