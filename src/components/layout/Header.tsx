"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/lib/siteConfig";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/diwali-gifts", label: "Diwali Gifts" }, // seasonal: remove after Diwali
  { href: "/shop#collection", label: "Collection" },
  { href: "/about", label: "About" },
  { href: "/journal", label: "Journal" },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const instagramHref = siteConfig.instagramUrl ?? "/contact";

  return (
    <header className="sticky top-0 z-40 border-b border-sand/60 bg-ivory/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          className="shrink-0"
          aria-label={`${siteConfig.brandName} home`}
        >
          <Logo variant="lockup" href={null} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-medium uppercase tracking-luxe text-charcoal/75 transition-colors duration-400 hover:text-charcoal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href={instagramHref}
            className="hidden text-charcoal/80 transition-colors duration-400 hover:text-charcoal md:block"
            aria-label="ARIVO on Instagram"
            title={siteConfig.instagramUrl ? "Follow on Instagram" : "Instagram — link pending"}
          >
            <InstagramIcon />
          </a>

          <button
            type="button"
            onClick={openCart}
            className="relative text-charcoal/80 transition-colors duration-400 hover:text-charcoal"
            aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-xs text-ivory">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="text-charcoal/80 md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <nav
          className="border-t border-sand/60 bg-ivory md:hidden"
          aria-label="Mobile"
        >
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-2 text-base"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a href={instagramHref} className="py-2 text-base">
              Instagram
            </a>
          </Container>
        </nav>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8h12l-1 12H7L6 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
