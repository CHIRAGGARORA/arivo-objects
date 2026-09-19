import { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { journalArticles } from "@/lib/journal";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/journal",
    "/contact",
    "/faq",
    "/shipping-returns",
    "/candle-safety",
    "/privacy",
    "/terms",
    "/cart",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: new Date(),
  }));

  const journalRoutes = journalArticles.map((a) => ({
    url: `${SITE_URL}/journal/${a.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes, ...journalRoutes];
}
