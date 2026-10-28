import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductView } from "@/components/product/ProductView";
import { ProductViewFromUrl } from "@/components/product/ProductViewFromUrl";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { products, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";
import { CandleDetails } from "@/types/product";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { safely } from "@/lib/server/reviews";
import { cachedApprovedReviews, cachedReviewSummary, soldOutVariantKeys } from "@/lib/server/storefront";
import { sellableVariantKeys } from "@/lib/server/catalog";

// Prebuilt and served from the cache; refreshed in the background at most
// every 5 minutes, and straight after a sale, refund or review change.
export const revalidate = 300;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return pageMetadata({ title: "Product not found", description: "This product could not be found.", path: "/shop" });
  return pageMetadata({
    title: product.name,
    description: product.shortDescription,
    path: `/products/${product.slug}`,
  });
}

function isCandleDetails(d: unknown): d is CandleDetails {
  return typeof d === "object" && d !== null && "waxType" in d;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product.slug);
  const [reviews, summary, soldOut] = await Promise.all([
    safely(() => cachedApprovedReviews(product.slug, 20), []),
    safely(() => cachedReviewSummary(product.slug), { count: 0, average: 0 }),
    soldOutVariantKeys(),
  ]);
  const details = product.details;
  const candle = isCandleDetails(details) ? details : null;

  const inStock = sellableVariantKeys().some((k) => k.startsWith(`${product.slug}/`) && !soldOut.includes(k));
  const productUrl = `${SITE_URL}/products/${product.slug}`;
  const delivery = siteConfig.delivery;
  const photos = [
    ...new Set(product.variants.flatMap((v) => v.images.filter((i) => !i.isPlaceholder).map((i) => `${SITE_URL}${i.src}`))),
  ];

  // Everything Google needs for product rich results and free Shopping
  // listings. Shipping and returns mirror /shipping-returns.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.slug,
    url: productUrl,
    ...(photos.length > 0 && { image: photos }),
    material: details.material,
    brand: { "@type": "Brand", name: siteConfig.brandName },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: siteConfig.currency,
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      // Matches what the page shows: in stock while any sellable variant isn't sold out.
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE_URL}/#organization` },
      ...(siteConfig.shippingFeeInr !== null && {
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: siteConfig.shippingFeeInr, currency: siteConfig.currency },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: delivery.handlingDays.min, maxValue: delivery.handlingDays.max, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: delivery.transitDays.min, maxValue: delivery.transitDays.max, unitCode: "DAY" },
            cutoffTime: `${delivery.orderCutoffIst}:00+05:30`,
            businessDays: {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => `https://schema.org/${d}`),
            },
          },
        },
      }),
      // Only damaged, defective or wrong items, reported within the claim
      // window, at no cost to the customer. No change-of-mind returns.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: siteConfig.damageClaimDays,
        itemDefectReturnFees: "https://schema.org/FreeReturn",
      },
    },
    // Only real, approved verified-buyer reviews — omitted entirely when none exist.
    ...(summary.count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average, reviewCount: summary.count },
      review: reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        author: { "@type": "Person", name: r.authorName },
        reviewBody: r.body,
        datePublished: r.createdAt.slice(0, 10),
      })),
    }),
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <div className="py-12 md:py-16">
      <Container>
        <Suspense fallback={<ProductView product={product} />}>
          <ProductViewFromUrl product={product} />
        </Suspense>

        <div className="mx-auto mt-16 max-w-2xl md:mt-24">
          <ProductAccordion
            sections={[
              { title: "The Object", content: <p>{product.theObject}</p> },
              {
                title: "Shipping & Returns",
                content: (
                  <p>
                    Free shipping on every order, dispatched within 48 hours. We
                    don&rsquo;t accept change-of-mind returns. If an item arrives
                    damaged or incorrect, contact us within{" "}
                    {siteConfig.damageClaimDays} days of delivery. Full details on the{" "}
                    <a href="/shipping-returns" className="underline hover:no-underline">
                      Shipping &amp; Returns
                    </a>{" "}
                    page.
                  </p>
                ),
              },
              ...(product.theMaterial
                ? [{ title: "The Material", content: <p>{product.theMaterial}</p> }]
                : []),
              ...(product.theProcess
                ? [{ title: "The Process", content: <p>{product.theProcess}</p> }]
                : []),
              {
                title: "Care",
                content: (
                  <ul className="space-y-1">
                    {details.care.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ),
              },
              {
                title: "Details",
                content: (
                  <ul className="space-y-1">
                    <li>Material: {details.material}</li>
                    <li>Dimensions: {details.dimensions ?? "To be confirmed"}</li>
                    <li>Weight: {details.weight ?? "To be confirmed"}</li>
                    {candle && (
                      <>
                        <li>Wax: {candle.waxType ?? "To be confirmed"}</li>
                        <li>Fragrance: {candle.fragrance ?? "To be confirmed"}</li>
                        <li>Wick: {candle.wickType ?? "To be confirmed"}</li>
                        <li>Approximate burn time: {candle.burnTimeHours ?? "To be confirmed"}</li>
                      </>
                    )}
                  </ul>
                ),
              },
              ...(candle
                ? [
                    {
                      title: "Candle Safety",
                      content: (
                        <p>
                          Never leave a burning candle unattended, and keep it away
                          from children, pets and flammable materials. See{" "}
                          <a href="/candle-safety" className="underline hover:no-underline">
                            Candle Safety
                          </a>{" "}
                          for more.
                        </p>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          {product.category === "tray" && (
            <p className="mt-6 text-xs text-charcoal/60">
              Handmade disclaimer: each piece is individually cast by hand. Marble
              patterns naturally vary, and small surface characteristics such as
              minor air pockets may occur. This is part of the handmade process,
              not a defect.
            </p>
          )}
        </div>

        <ProductReviews reviews={reviews} summary={summary} />

        {related.length > 0 && (
          <div className="mt-20 md:mt-28">
            <h2 className="font-display text-2xl md:text-3xl">You may also like</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
