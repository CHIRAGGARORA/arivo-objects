import { Stars } from "@/components/reviews/Stars";
import { SOURCE_LABEL, type PublicReview, type ReviewSummary } from "@/lib/server/reviews";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export function ProductReviews({ reviews, summary }: { reviews: PublicReview[]; summary: ReviewSummary }) {
  return (
    <section className="mx-auto mt-20 max-w-3xl md:mt-28" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-sand/70 pb-6">
        <div>
          <p className="eyebrow">Customer reviews</p>
          <h2 className="mt-3 text-4xl">Reviews</h2>
        </div>
        {summary.count > 0 && (
          <p className="flex items-center gap-2 text-sm text-charcoal/70">
            <Stars rating={summary.average} /> {summary.average.toFixed(1)} · {summary.count} review{summary.count === 1 ? "" : "s"}
          </p>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="mt-8 text-sm font-light leading-relaxed text-charcoal/70">
          No reviews yet. Bought this? You can leave a review from your order page — the link is in your order
          confirmation email.
        </p>
      ) : (
        <ul className="divide-y divide-sand/60">
          {reviews.map((r) => (
            <li key={r.id} className="py-7">
              <Stars rating={r.rating} />
              <p className="mt-3 font-display text-xl italic leading-snug">&ldquo;{r.body}&rdquo;</p>
              <p className="mt-4 text-xs text-charcoal/60">
                <span className="font-medium uppercase tracking-luxe text-charcoal">
                  {r.authorName}
                  {r.city ? `, ${r.city}` : ""}
                </span>{" "}
                · {SOURCE_LABEL[r.source]} · {fmt(r.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
