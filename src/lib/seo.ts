import { Metadata } from "next";
import { siteConfig } from "./siteConfig";

const SITE_URL = `https://${siteConfig.domain}`;

interface PageSeoOptions {
  title: string;
  description?: string;
  path?: string; // e.g. "/products/small-oval-marble-tray"
  image?: string; // absolute or root-relative path to an OG image
}

const DEFAULT_DESCRIPTION =
  "Design-led home decor and gifts: scented candle jar sets and marble trays. Free shipping, dispatched within 48 hours.";

const DEFAULT_OG_IMAGE = "/brand/arivo-og.png";

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
}: PageSeoOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title === siteConfig.brandName ? title : `${title} — ${siteConfig.brandName}`;

  return {
    // `absolute` deliberately bypasses the root layout's title template
    // (`%s — ARIVO OBJECTS`). fullTitle above already appends the brand
    // suffix itself, so without `absolute` the template appended a SECOND
    // suffix on top ("Shop — ARIVO OBJECTS — ARIVO OBJECTS"). This keeps
    // the exact same final title text, just applied once.
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.brandName,
      type: "website",
      images: image ? [{ url: image }] : undefined,
      locale: "en_IN",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export { SITE_URL };
