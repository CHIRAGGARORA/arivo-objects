"use client";

import { useState, FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Newsletter signup. Stores a consented address via /api/newsletter; nothing
 * is emailed automatically.
 */
export function EmailSignup() {
  const [status, setStatus] = useState<"idle" | "busy" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    setStatus("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          consent: f.get("consent") === "on",
          website: f.get("website") || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return setStatus("submitted");
      setError(
        res.status === 400
          ? (Object.values(data.fields ?? {})[0] as string) ?? "Please check your email address."
          : data.message ?? "Sign-up isn't available right now. Please try again later."
      );
    } catch {
      setError("Network error — please try again.");
    }
    setStatus("idle");
  }

  return (
    <section className="relative overflow-hidden bg-charcoal text-ivory">
      <div className="absolute inset-0 opacity-45">
        <ProductPicture
          image={{ src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-row.webp", alt: "", isPlaceholder: false }}
          aspect="wide"
          className="h-full w-full !aspect-auto"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/80" />
      <Container className="relative max-w-2xl py-24 text-center md:py-36">
        <p className="text-xs font-medium uppercase tracking-luxe text-ochre">The Arivo letter</p>
        <h2 className="mt-5 text-4xl leading-tight md:text-6xl">
          Enter the world <em className="italic">of Arivo</em>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base text-ivory/75">
          First look at new scents and drops, restock alerts and the occasional note on slow living.
        </p>
        {status !== "submitted" ? (
          <form onSubmit={handleSubmit} noValidate className="mx-auto mt-10 max-w-lg">
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="signup-website">Website</label>
              <input id="signup-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Your email address"
                className="flex-1 border-0 border-b border-ivory/50 bg-transparent px-1 py-3 text-base text-ivory placeholder:text-ivory/70 focus:border-ivory focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "busy"}
                className="bg-ivory px-8 py-3.5 text-xs font-medium uppercase tracking-luxe text-charcoal transition-opacity duration-400 hover:opacity-90 disabled:opacity-50"
              >
                {status === "busy" ? "Signing up…" : "Subscribe"}
              </button>
            </div>
            <label className="mt-5 flex items-start justify-center gap-2 text-left text-xs text-ivory/65">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              <span>I&rsquo;d like to receive occasional emails from {siteConfig.brandName}. Unsubscribe any time.</span>
            </label>
            {error && <p role="alert" className="mt-4 text-sm text-ochre">{error}</p>}
          </form>
        ) : (
          <p className="mt-10 font-display text-2xl italic" role="status">Thank you — you&rsquo;re on the list.</p>
        )}
      </Container>
    </section>
  );
}
