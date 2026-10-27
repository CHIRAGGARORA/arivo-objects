"use client";

import { useState, FormEvent } from "react";
import { Container } from "@/components/ui/Container";

/**
 * Frontend-only signup form. Submission is intercepted and does not send
 * data anywhere yet. See README.md, "Connecting email signup" for how to
 * wire this to a real provider (e.g. Mailchimp, Klaviyo, or a simple API
 * route) without changing this component's markup.
 */
export function EmailSignup() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: replace with a real POST to /api/subscribe once an email
    // provider is connected.
    setStatus("submitted");
  }

  return (
    <section className="border-t border-sand/60 py-20 md:py-28">
      <Container className="max-w-xl text-center">
        <h2 className="font-display text-2xl md:text-3xl">Enter the world of Arivo.</h2>
        <p className="mt-3 text-sm text-charcoal/70">
          New drops and restocks.
        </p>
        {status === "idle" ? (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Email address"
              className="flex-1 border border-sand bg-transparent px-4 py-3 text-sm placeholder:text-charcoal/40 focus:border-charcoal"
            />
            <button
              type="submit"
              className="border border-charcoal px-6 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
            >
              Sign up
            </button>
          </form>
        ) : (
          <p className="mt-8 text-sm">Thank you — you&rsquo;re on the list.</p>
        )}
      </Container>
    </section>
  );
}
