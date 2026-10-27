"use client";

import { useState, FormEvent } from "react";
import { Container } from "@/components/ui/Container";
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
    <section className="border-t border-sand/60 py-20 md:py-28">
      <Container className="max-w-xl text-center">
        <h2 className="font-display text-2xl md:text-3xl">Enter the world of Arivo.</h2>
        <p className="mt-3 text-sm text-charcoal/70">
          Occasional notes on new objects, restocks and the studio.
        </p>
        {status !== "submitted" ? (
          <form onSubmit={handleSubmit} noValidate className="mt-8">
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="signup-website">Website</label>
              <input id="signup-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                className="flex-1 border border-sand bg-transparent px-4 py-3 text-sm placeholder:text-charcoal/40 focus:border-charcoal"
              />
              <button
                type="submit"
                disabled={status === "busy"}
                className="border border-charcoal px-6 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory disabled:opacity-50"
              >
                {status === "busy" ? "Signing up…" : "Sign up"}
              </button>
            </div>
            <label className="mt-3 flex items-start justify-center gap-2 text-left text-xs text-charcoal/65">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              <span>I&rsquo;d like to receive occasional emails from {siteConfig.brandName}. Unsubscribe any time.</span>
            </label>
            {error && <p role="alert" className="mt-3 text-sm text-terracotta">{error}</p>}
          </form>
        ) : (
          <p className="mt-8 text-sm" role="status">Thank you — you&rsquo;re on the list.</p>
        )}
      </Container>
    </section>
  );
}
