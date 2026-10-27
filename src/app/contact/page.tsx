"use client";

import { useState, FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/siteConfig";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire to a real endpoint (e.g. an API route + email provider)
    // once the business email is set up. See README.md.
    setSubmitted(true);
  }

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
          <p className="mt-10 text-sm">
            Thank you. This form isn&rsquo;t connected to our inbox yet, so your
            message was not sent — please reach us on Instagram at{" "}
            <a href={siteConfig.socials.instagram ?? "#"} className="underline">
              @{siteConfig.instagramHandle}
            </a>{" "}
            in the meantime.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label htmlFor="name" className="text-sm">Name</label>
              <input
                id="name"
                required
                className="mt-2 w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-sm">Email</label>
              <input
                id="contact-email"
                type="email"
                required
                className="mt-2 w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal"
              />
            </div>
            <div>
              <label htmlFor="message" className="text-sm">Message</label>
              <textarea
                id="message"
                required
                rows={5}
                className="mt-2 w-full border border-sand bg-transparent px-4 py-3 text-sm focus:border-charcoal"
              />
            </div>
            <button
              type="submit"
              className="border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
            >
              Send message
            </button>
          </form>
        )}
      </Container>
    </div>
  );
}
