import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
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
      </body>
    </html>
  );
}
