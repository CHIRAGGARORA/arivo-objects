import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductView } from "@/components/product/ProductView";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { products, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";
import { CandleDetails } from "@/types/product";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { approvedReviews, reviewSummary, safely } from "@/lib/server/reviews";

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

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { slug } = await params;
  const { variant: requestedVariant } = await searchParams;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product.slug);
  const [reviews, summary] = await Promise.all([
    safely(() => approvedReviews({ productSlug: product.slug, limit: 20 }), []),
    safely(() => reviewSummary(product.slug), { count: 0, average: 0 }),
  ]);
  const details = product.details;
  const candle = isCandleDetails(details) ? details : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    brand: { "@type": "Brand", name: siteConfig.brandName },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: siteConfig.currency,
      price: product.price,
      // Availability intentionally omitted: no live inventory system yet.
      // Add "availability" (e.g. https://schema.org/InStock) once real
      // stock tracking is connected.
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

  return (
    <div className="py-12 md:py-16">
      <Container>
        <ProductView product={product} initialVariantId={requestedVariant} />

        <div className="mx-auto mt-16 max-w-2xl md:mt-24">
          <ProductAccordion
            sections={[
              { title: "The Object", content: <p>{product.theObject}</p> },
              {
                title: "Shipping & Returns",
                content: (
                  <p>
                    Free shipping on every order, dispatched within 48 hours. We
                    don&rsquo;t accept returns. If an item arrives damaged or
                    incorrect, contact us. Full details on the{" "}
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
    </div>
  );
}
