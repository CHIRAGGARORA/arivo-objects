import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { CartProvider } from "@/lib/cart-context";
import { siteConfig } from "@/lib/siteConfig";
import { SITE_URL } from "@/lib/seo";
import { checkoutBlockReason } from "@/lib/server/config";
import { sellableVariantKeys } from "@/lib/server/catalog";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.brandName} — Design-led home objects`,
    template: `%s — ${siteConfig.brandName}`,
  },
  description:
    "Handcrafted Jesmonite objects designed to bring form, texture and function into everyday spaces.",
  // No manual `icons` entry: src/app/icon.png (the Arivo mark) is picked up
  // automatically by Next.js's file-based favicon convention.
  openGraph: {
    siteName: siteConfig.brandName,
    images: [{ url: "/brand/arivo-og.png" }],
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <CartProvider checkoutEnabled={checkoutBlockReason() === null} sellableVariants={sellableVariantKeys()}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-charcoal focus:text-ivory focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
