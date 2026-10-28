import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { CartProvider } from "@/lib/cart-context";
import { siteConfig } from "@/lib/siteConfig";
import { SITE_URL } from "@/lib/seo";
import { checkoutBlockReason } from "@/lib/server/config";
import { sellableVariantKeys } from "@/lib/server/catalog";
import { soldOutVariantKeys } from "@/lib/server/storefront";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const sans = Jost({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.brandName} — Home decor & gifts`,
    template: `%s — ${siteConfig.brandName}`,
  },
  description:
    "Design-led home decor and gifts: scented candle jar sets and marble trays. Free shipping, dispatched within 48 hours.",
  // No manual `icons` entry: src/app/icon.png (the Arivo mark) is picked up
  // automatically by Next.js's file-based favicon convention.
  openGraph: {
    siteName: siteConfig.brandName,
    images: [{ url: "/brand/arivo-og.png" }],
    locale: "en_IN",
  },
  // Google Search Console "HTML tag" verification. Set GOOGLE_SITE_VERIFICATION
  // in Vercel to the content="..." value Search Console gives you, then redeploy.
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  }),
};

// Who the business is, for Google's knowledge panel and brand searches.
const organizationData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: siteConfig.brandName,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/arivo-logo.png`,
      ...(siteConfig.email && { email: siteConfig.email }),
      sameAs: [siteConfig.socials.instagram].filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: siteConfig.brandName,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-IN",
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <CartProvider
          checkoutEnabled={checkoutBlockReason() === null}
          sellableVariants={sellableVariantKeys()}
          soldOutVariants={await soldOutVariantKeys()}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-charcoal focus:text-ivory focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <AnnouncementBar />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }} />
        {/* Privacy-friendly page views (no cookies). Enable Web Analytics on the Vercel project to start collecting. */}
        <Analytics />
      </body>
    </html>
  );
}
