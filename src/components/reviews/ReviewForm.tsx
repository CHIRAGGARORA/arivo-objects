"use client";

import { FormEvent, useState } from "react";

/** Lets the customer of a paid order review one product. */
export function ReviewForm({ token, productSlug, productName, defaultName }: { token: string; productSlug: string; productName: string; defaultName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Choose a star rating.");
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, productSlug, rating, body, authorName: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("idle");
        const fields = data.fields as Record<string, string> | undefined;
        return setError(fields ? Object.values(fields)[0] : data.message ?? "Couldn't send your review. Please try again.");
      }
      setState("done");
    } catch {
      setState("idle");
      setError("Couldn't send your review. Please try again.");
    }
  }

  if (state === "done") {
    return <p className="text-sm text-charcoal/75">Thank you! Your review of {productName} will appear on the site once we&rsquo;ve checked it.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-base">{productName}</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-ochre"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z"
                fill={(hover || rating) >= n ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="What did you like? How does it look in your home?"
        aria-label={`Your review of ${productName}`}
        className="w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal"
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          aria-label="Name shown with your review"
          className="w-48 border border-sand bg-transparent px-4 py-2.5 text-sm focus:border-charcoal"
        />
        <button type="submit" disabled={state === "sending"} className="btn-primary disabled:opacity-50">
          {state === "sending" ? "Sending…" : "Submit review"}
        </button>
      </div>
      {error && <p className="text-xs text-terracotta">{error}</p>}
    </form>
  );
}
