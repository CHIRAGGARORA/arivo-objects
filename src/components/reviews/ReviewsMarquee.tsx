import { Container } from "@/components/ui/Container";
import { Stars } from "@/components/reviews/Stars";
import { safely, SOURCE_LABEL, type PublicReview } from "@/lib/server/reviews";
import { cachedApprovedReviews } from "@/lib/server/storefront";

/**
 * Approved customer reviews scrolling sideways. Renders nothing until
 * real reviews exist — we never show sample or invented reviews.
 */
export async function ReviewsMarquee() {
  const reviews = await safely(() => cachedApprovedReviews(null, 20), []);
  if (reviews.length === 0) return null;

  // Repeat short lists so one half of the track is always wider than the screen.
  const half = Array.from({ length: Math.ceil(6 / reviews.length) }, () => reviews).flat();
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="overflow-hidden py-20 md:py-28">
      <Container className="text-center">
        <p className="eyebrow">From our customers</p>
        <h2 className="mt-3 text-4xl md:text-5xl">Loved in homes across India</h2>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-charcoal/70">
          <Stars rating={average} /> {average.toFixed(1)} from {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      </Container>
      {reviews.length < 3 ? (
        // Too few to scroll without repeating the same card: show them still.
        <Container>
          <ul className="mt-12 flex flex-wrap justify-center">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
        </Container>
      ) : (
        <div className="mt-12">
          <div className="marquee-track flex w-max" style={{ animationDuration: `${Math.max(40, half.length * 9)}s` }}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1 ? true : undefined}>
                {half.map((r, i) => (
                  <ReviewCard key={`${r.id}-${i}`} review={r} />
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review: r }: { review: PublicReview }) {
  return (
    <li className="mx-3 mb-6 flex w-[300px] shrink-0 flex-col border border-sand/70 bg-bone/40 p-7 md:w-[360px]">
      <Stars rating={r.rating} />
      <p className="mt-4 flex-1 font-display text-xl italic leading-snug">&ldquo;{r.body}&rdquo;</p>
      <p className="mt-6 text-xs font-medium uppercase tracking-luxe">
        {r.authorName}
        {r.city ? `, ${r.city}` : ""}
      </p>
      <p className="mt-1 text-xs text-charcoal/55">
        {SOURCE_LABEL[r.source]} · {r.productName}
      </p>
    </li>
  );
}
