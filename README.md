# Arivo Objects — Website

A Next.js + TypeScript + Tailwind CSS frontend for the Arivo Objects brand.
This is a **free-to-run, no-paid-dependency** build: no Shopify, no paid CMS,
no paid database, no paid API required to develop or preview it locally.

---

## 1. Running it locally

You need [Node.js](https://nodejs.org) 20.9 or later installed.

```bash
cd arivo-objects
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

That's it — no accounts, no API keys, no payment setup needed to see and use
the site locally.

To build a production bundle (useful before deploying):

```bash
npm run build
npm run start
```

---

## 2. Project structure

```
src/
  app/                     Pages (Next.js App Router — one folder per route)
    page.tsx               Homepage
    shop/page.tsx           Shop grid
    products/[slug]/page.tsx   Product detail page (dynamic, reads products.ts)
    about/, contact/, faq/, journal/, cart/, privacy/, terms/,
    shipping-returns/, candle-safety/    Static/dynamic pages
    sitemap.ts, robots.ts   Auto-generated SEO files
  components/
    layout/                Header, Footer, CartDrawer
    home/                   Homepage sections (Hero, Philosophy, Process, etc.)
    shop/                   ProductCard
    product/                ProductGallery, ProductInfo, ProductAccordion
    ui/                     Container, PlaceholderImage, ProductPicture
  lib/
    products.ts             ⭐ ALL product data — names, prices, copy, images
    journal.ts               ⭐ ALL journal article content
    siteConfig.ts             ⭐ Business info placeholders (GST, email, phone, etc.)
    cart-context.tsx         Browser cart (display only; server re-prices)
    server/                  Server-only: db, orders, payments, email, shipping
    shipping-specs.ts         ⭐ Packed weight/dimensions sent to Shiprocket
    seo.ts                    Metadata helper
    placeholderLabels.ts      Labels shown on placeholder image blocks
  types/
    product.ts                Shared TypeScript types
```

**The three files marked ⭐ are the ones you'll edit most often.** You should
rarely need to touch component code just to change a price, add a product, or
update copy.

---

## 3. How to make common changes

### Change a price or product name
Open `src/lib/products.ts`, find the product by its `slug`, edit `name` or
`price`. That's it — every page that shows that product updates automatically.

### Add a new product
Copy an existing object in the `products` array in `src/lib/products.ts`,
give it a new unique `slug`, and fill in its fields. It will automatically
appear in the shop grid and get its own product page at
`/products/your-new-slug`.

### Replace a placeholder photo with a real one
1. Put the real image file in `/public/products/<slug>/<variant>/` (create
   the folders as needed).
2. In `src/lib/products.ts`, find that image's entry and change:
   ```ts
   { src: "placeholder:tray-oval-black-front", alt: "...", isPlaceholder: true }
   ```
   to:
   ```ts
   { src: "/products/small-oval-tray/black-marble/01.jpg", alt: "...", isPlaceholder: false }
   ```
3. Save. No other file needs to change — `ProductPicture` automatically
   switches from the labeled grey placeholder block to the real optimized
   image.

### Add a journal article
Add a new entry to the `journalArticles` array in `src/lib/journal.ts`. It
will automatically appear on `/journal` and get its own page.

### Update business information (email, Instagram, GSTIN, etc.)
Edit `src/lib/siteConfig.ts`. Fields are `null` until you have the confirmed,
real value — **do not put placeholder or fake values into this file**, since
it's what the whole site reads from for contact info and structured data.

---

## 4. What works today

| Feature | Status |
|---|---|
| Browsing, product pages, journal, static pages | Working |
| Cart | Saved in the browser; server re-prices everything at checkout |
| Checkout (Razorpay) | Built and tested; enabled only once Razorpay + database env vars are set, and only for variants approved in `products.ts` with stock in `/admin` |
| Orders, emails, Shiprocket | Durable post-payment pipeline with retries — see `docs/LAUNCH.md` |
| Contact form / newsletter | Saved to Postgres; contact notifications emailed via Resend |
| Admin | `/admin` (password from `ADMIN_PASSWORD`) |
| Product photography / dimensions | Some real photos; dimensions and packed shipping specs still pending |

**Setup and launch steps: [`docs/LAUNCH.md`](docs/LAUNCH.md).**

### Tests

```bash
# needs a disposable Postgres database whose name contains "test"
TEST_DATABASE_URL=postgres://localhost/arivo_test npm test
npm run lint && npm run typecheck && npm run build
```

---

## 5. Photography shot list (for when you're ready to shoot)

For **each product/colourway combination**, aim to capture:

- **Front** — straight-on, the primary listing image
- **Top-down** — especially important for trays, shows the full silhouette
- **Scale** — the object in a real setting (on a table, next to a hand or
  common object) so size reads clearly
- **Texture close-up** — a tight crop on the marble pattern
- **Lifestyle** — the object in use/styled in a room
- For the candle specifically: both **lit** and **unlit**, plus a close-up
  of the **flower engraving**
- **Packaging** (once finalised) — for trust/unboxing content later

Keep a consistent light source and background across a colourway's shots so
the set feels cohesive on the product page.

---

## 6. Connecting real integrations later

Each of these can be added without a redesign. Rough steps:

### Instagram feed
Replace the placeholder grid in `src/components/home/InstagramSection.tsx`
with a real feed once you have an Instagram Business account connected to a
Meta Developer app (for the Instagram Graph API), or install a feed
service (e.g. SnapWidget, Behold) and embed its widget in the same
component. Set `instagramHandle` and `instagramUrl` in `siteConfig.ts` first.

### GST / invoicing
Fill in `gstin`, `legalName`, `businessAddress` in `siteConfig.ts` only once
registered. Until then, none of this is rendered publicly. Update the
Terms/Privacy/Shipping pages (currently marked "Draft — for review") once a
CA/lawyer has reviewed them.

### Analytics (GA4 / Search Console / Meta Pixel)
Add tracking IDs as `NEXT_PUBLIC_...` environment variables and load the
scripts in `src/app/layout.tsx` behind a check for the variable being set,
so nothing loads until you provide real IDs.

### Amazon
Keep `products.ts` as the source of truth; when ready, add optional fields
(SKU, HSN code, Amazon listing ID) to the `Product` type in
`src/types/product.ts` and export/sync from there — don't invent HSN or GST
rates in the meantime.

---

## 7. Migrating to Shopify later (if you choose to)

This project is structured so migrating is mostly a content-transfer job,
not a redesign:

1. Product data in `products.ts` maps closely to Shopify's product/variant
   model — names, prices, variants, descriptions can be re-entered (or
   scripted via Shopify's Admin API) directly from this file.
2. The visual design (Tailwind classes, component structure, copy) can be
   ported into a custom Shopify theme (Liquid + Online Store 2.0 sections),
   keeping the same look and hierarchy.
3. The cart/checkout logic in `cart-context.tsx` would be replaced by
   Shopify's native cart + checkout — no custom payment code needed at that
   point.
4. Journal content maps to Shopify's blog feature.

Nothing about this current build locks you out of that path later.

---

## 8. What you'll need to provide before real launch

- Final product photography (see shot list above)
- Confirmed dimensions/weight per product
- Candle burn-test results and final wax/fragrance/wick specification
- Instagram handle + (optional) API credentials
- Business email (e.g. hello@arivoobjects.com)
- GSTIN, legal business name, business address (once registered)
- Payment gateway account (Razorpay or otherwise) + business bank account
- Shipping provider decision
- Legal review of Privacy, Terms, Shipping & Returns, Candle Safety pages
