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
  "Handcrafted Jesmonite objects designed to bring form, texture and function into everyday spaces.";

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
    title: fullTitle,
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
