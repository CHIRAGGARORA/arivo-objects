/** Read-only star rating (rounded to the nearest half). */
export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={`inline-flex gap-0.5 text-ochre ${className}`} aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id={`half-${n}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z"
            fill={rounded >= n ? "currentColor" : rounded >= n - 0.5 ? `url(#half-${n})` : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}
