"use client";

import { useState, FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/siteConfig";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFields({});
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          message: f.get("message"),
          website: f.get("website") || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
      } else if (res.status === 400) {
        setFields(data.fields ?? {});
        setError("Please check the highlighted fields.");
      } else {
        setError(
          data.message ??
            "Your message couldn't be sent right now. Please try again shortly, or reach us on Instagram."
        );
      }
    } catch {
      setError("Network error — your message wasn't sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "mt-2 w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal aria-[invalid=true]:border-terracotta";

  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-xl">
        <h1 className="font-display text-3xl md:text-5xl">Contact</h1>
        <p className="mt-4 text-base text-charcoal/70">
          For questions about an order, a product, or anything else.
        </p>

        <div className="mt-8 space-y-1 text-sm text-charcoal/75">
          <p>
            Email:{" "}
            {siteConfig.email ? (
              <a href={`mailto:${siteConfig.email}`} className="underline hover:no-underline">
                {siteConfig.email}
              </a>
            ) : (
              <span>Business email coming soon — use the form below in the meantime.</span>
            )}
          </p>
          <p>
            Instagram:{" "}
            {siteConfig.instagramHandle ? (
              <a href={siteConfig.instagramUrl ?? "#"} className="underline hover:no-underline">
                @{siteConfig.instagramHandle}
              </a>
            ) : (
              <span>Handle to be added.</span>
            )}
          </p>
        </div>

        {submitted ? (
          <p className="mt-10 text-sm" role="status">
            Thank you — we&rsquo;ve received your message and will reply by email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
            {/* Spam trap: hidden from people, filled in by bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="name" className="text-sm">Name</label>
              <input id="name" name="name" required maxLength={100} autoComplete="name"
                aria-invalid={Boolean(fields.name)} className={fieldClass} />
              {fields.name && <p className="mt-1 text-xs text-terracotta">{fields.name}</p>}
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm">Email</label>
              <input id="contact-email" name="email" type="email" required autoComplete="email"
                aria-invalid={Boolean(fields.email)} className={fieldClass} />
              {fields.email && <p className="mt-1 text-xs text-terracotta">{fields.email}</p>}
            </div>
            <div>
              <label htmlFor="message" className="text-sm">Message</label>
              <textarea id="message" name="message" required rows={5} maxLength={5000}
                aria-invalid={Boolean(fields.message)} className={fieldClass} />
              {fields.message && <p className="mt-1 text-xs text-terracotta">{fields.message}</p>}
            </div>
            {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </Container>
    </div>
  );
}
