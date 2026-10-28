import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/lib/siteConfig";

const shopLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const infoLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/candle-safety", label: "Candle Safety" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer() {
  return (
    <footer className="border-t border-sand/60 bg-ivory">
      <Container className="grid grid-cols-2 gap-10 py-16 md:grid-cols-4 md:py-20">
        <div className="col-span-2 md:col-span-1">
          <Logo variant="full" href="/" className="w-14" />
          <p className="mt-4 max-w-[26ch] text-sm text-charcoal/70">
            Design-led home decor and gifts.
          </p>
        </div>

        <FooterColumn title="Shop" links={shopLinks} />
        <FooterColumn title="Information" links={infoLinks} />

        <div>
          <p className="text-sm font-medium">Connect</p>
          <ul className="mt-4 space-y-2 text-sm text-charcoal/70">
            <li>
              {siteConfig.instagramHandle ? (
                <a href={siteConfig.instagramUrl ?? "#"} className="hover:text-charcoal">
                  @{siteConfig.instagramHandle}
                </a>
              ) : (
                <span title="Instagram handle to be added">Instagram — coming soon</span>
              )}
            </li>
            <li>
              {siteConfig.email ? (
                <a href={`mailto:${siteConfig.email}`} className="hover:text-charcoal">
                  {siteConfig.email}
                </a>
              ) : (
                <Link href="/contact" className="hover:text-charcoal">
                  Contact us
                </Link>
              )}
            </li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-sand/60 py-6 text-xs text-charcoal/60 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} Arivo Objects. All rights reserved.</p>
        <p>Designed in India.</p>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-4 space-y-2 text-sm text-charcoal/70">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-charcoal">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
