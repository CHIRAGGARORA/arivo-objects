import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { products, getProductBySlug, formatPrice, isSellable } from "@/lib/products";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { Product } from "@/types/product";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Seasonal landing page for Instagram, WhatsApp and ads to point at
 * (e.g. /diwali-gifts?utm_source=instagram&utm_medium=bio&utm_campaign=diwali).
 * Prices, budgets and sold-out badges all come from products.ts and stock,
 * so nothing here needs editing when prices change.
 */

export const metadata = pageMetadata({
  title: "Diwali Gift Guide 2026: Candle Sets & Marble Trays",
  description:
    "Diwali gifts under ₹500, under ₹1,000 and beyond: sandalwood soy wax candle sets and hand-poured marble trays. Free shipping across India, dispatched within 48 hours.",
  path: "/diwali-gifts",
  image: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-festive.webp",
});

// Prebuilt and cached like the shop, so sold-out badges stay current.
export const revalidate = 300;

const DIWALI = "Sunday, 8 November";
const transit = siteConfig.delivery.transitDays;

const budgets: { id: string; title: string; note: string; match: (p: Product) => boolean }[] = [
  { id: "under-500", title: "Under ₹500", note: "Return gifts, colleagues and Secret Santa.", match: (p) => p.price <= 500 },
  { id: "under-1000", title: "Under ₹1,000", note: "For festive visits, family and friends.", match: (p) => p.price > 500 && p.price <= 1000 },
  { id: "statement", title: "Statement gifts", note: "For the people who matter most.", match: (p) => p.price > 1000 },
];

function pick(slug: string): Product {
  const p = getProductBySlug(slug);
  if (!p) throw new Error(`Diwali guide references unknown product "${slug}"`);
  return p;
}

const candleSet = pick("scented-candle-jar-pack-of-4");
const miniSet = pick("mini-scented-candle-jar-pack-of-4");
const smallTray = pick("small-oval-marble-tray");
const cloudTray = pick("large-cloud-marble-tray");

const recipients = [
  {
    eyebrow: "Festive visits",
    title: "For the host",
    text: "Four 130 ml sandalwood candles in bright patterned jars, each a different colour. Light one in every corner of the house.",
    product: candleSet.name,
    price: formatPrice(candleSet.price),
    href: `/products/${candleSet.slug}`,
    src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-evening.webp",
    alt: "Four sandalwood candles burning on a side table in the evening",
  },
  {
    eyebrow: "Return gifts & colleagues",
    title: "Small, but thoughtful",
    text: "Four 50 ml tins in mandala prints at a gentle price, and easy to split into four little presents.",
    product: miniSet.name,
    price: formatPrice(miniSet.price),
    href: `/products/${miniSet.slug}`,
    src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp",
    alt: "Mini candle tins in mandala prints laid out from above",
  },
  {
    eyebrow: "Housewarmings",
    title: "A tray and a candle",
    text: "A marble tray for the coffee table with a candle set on top: the new home's first little ritual.",
    product: `${smallTray.name} + ${candleSet.name}`,
    price: `${formatPrice(smallTray.price + candleSet.price)} together`,
    href: `/products/${smallTray.slug}`,
    src: "/editorial/three-trays-styled.jpg",
    alt: "Marble trays in black, terracotta and ochre, styled together",
  },
  {
    eyebrow: "Someone who has everything",
    title: "One of a kind",
    text: "Every tray is hand-poured, so the marble pattern they receive is theirs alone.",
    product: cloudTray.name,
    price: formatPrice(cloudTray.price),
    href: `/products/${cloudTray.slug}`,
    src: "/products/large-cloud-marble-tray/black-marble/lifestyle.jpg",
    alt: "Large cloud marble tray styled on a table",
  },
];

const faqs = [
  {
    q: "Will my order arrive before Diwali?",
    a: `Diwali falls on ${DIWALI}. We dispatch every order within 48 hours of payment, and delivery then usually takes ${transit.min}–${transit.max} working days depending on your pin code, so the earlier you order, the safer.`,
  },
  {
    q: "Is shipping free?",
    a: "Yes, shipping is free on every order across India, with no minimum.",
  },
  {
    q: "Is there a discount?",
    a: "Use code FIRST5 at checkout for 5% off your first order.",
  },
  {
    q: "Can I order in bulk for my team, clients or family?",
    a: "Yes. Send us the products, quantity and the date you need them by through our contact page, and we'll come back to you with availability.",
  },
  {
    q: "Do the candles come with lids?",
    a: "Yes. Every jar and tin has a lid, and once the candle is finished it can be reused for jewellery, matches or small trinkets.",
  },
];

export default function DiwaliGiftsPage() {
  const sellable = products.filter(isSellable);
  const tiers = budgets
    .map((b) => ({ ...b, items: sellable.filter(b.match).sort((x, y) => x.price - y.price) }))
    .filter((t) => t.items.length > 0);
  const url = `${SITE_URL}/diwali-gifts`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Diwali Gift Guide",
      url,
      itemListElement: sellable.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/products/${p.slug}`,
        name: p.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Diwali Gift Guide", item: url },
      ],
    },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Hero */}
      <section className="overflow-hidden">
        <Container className="grid grid-cols-1 items-center gap-10 pb-16 pt-10 md:pb-24 md:pt-14 lg:grid-cols-12 lg:gap-16">
          <div className="order-2 lg:order-1 lg:col-span-6">
            <p className="eyebrow">Diwali gift guide · 2026</p>
            <h1 className="mt-5 text-[2.9rem] leading-[1.02] md:text-7xl">
              Diwali gifts, <em className="italic text-terracotta">ready</em> to give.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal/75 md:text-lg">
              Sandalwood soy wax candle sets and hand-poured marble trays, for
              festive visits, return gifts and everyone on your list.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#under-1000" className="btn-primary">
                Gifts under ₹1,000
              </a>
              <a href="#bulk" className="btn-outline">
                Bulk &amp; corporate
              </a>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-luxe text-charcoal/70">
              <li>Free shipping across India</li>
              <li>Dispatched within 48 hours</li>
              <li>Code FIRST5 · 5% off</li>
            </ul>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-6">
            <ProductPicture
              image={{
                src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-festive.webp",
                alt: "Mini candle tins on a festive tray with marigolds and a gift box",
                isPlaceholder: false,
              }}
              aspect="portrait"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>
        </Container>
      </section>

      {/* Order early */}
      <section className="bg-charcoal py-6 text-ivory">
        <Container className="text-center text-sm md:text-base">
          Diwali is on <strong className="font-semibold">{DIWALI}</strong>. We dispatch within 48 hours,
          so order early to be sure your gifts arrive in time.
        </Container>
      </section>

      {/* By budget */}
      <section className="py-20 md:py-28">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Shop by budget</p>
            <h2 className="mt-4 text-4xl leading-tight md:text-6xl">
              A gift for <em className="italic text-terracotta">every</em> list
            </h2>
          </Reveal>
          {/* On desktop the tiers sit side by side, each as wide as its products. */}
          <div
            className="mt-14 grid grid-cols-1 gap-y-14 md:mt-20 md:gap-x-6 md:[grid-template-columns:repeat(var(--total),minmax(0,1fr))]"
            style={{ "--total": tiers.reduce((n, t) => n + t.items.length, 0) } as React.CSSProperties}
          >
            {tiers.map((t) => (
              <div
                key={t.id}
                id={t.id}
                className="scroll-mt-28 md:[grid-column:span_var(--n)]"
                style={{ "--n": t.items.length } as React.CSSProperties}
              >
                <div className="border-b border-sand pb-4">
                  <h3 className="font-display text-3xl md:text-4xl">{t.title}</h3>
                  <p className="mt-1 text-sm text-charcoal/70">{t.note}</p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]">
                  {t.items.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* By recipient */}
      <section className="bg-sand/30 py-20 md:py-28">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Shop by person</p>
            <h2 className="mt-4 text-4xl leading-tight md:text-6xl">
              Who are you <em className="italic text-terracotta">gifting</em>?
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
            {recipients.map((r, i) => (
              <Reveal key={r.title} delayMs={(i % 2) * 140}>
                <Link href={r.href} className="group block">
                  <div className="overflow-hidden">
                    <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.04]">
                      <ProductPicture
                        image={{ src: r.src, alt: r.alt, isPlaceholder: false }}
                        aspect="landscape"
                        sizes="(min-width: 768px) 50vw, 100vw"
                      />
                    </div>
                  </div>
                  <p className="eyebrow mt-6">{r.eyebrow}</p>
                  <h3 className="mt-2 font-display text-3xl md:text-4xl">{r.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-charcoal/75">{r.text}</p>
                  <p className="mt-4 text-sm">
                    <span className="font-semibold">{r.product}</span>
                    <span className="text-charcoal/70"> · {r.price}</span>
                  </p>
                  <p className="mt-4 inline-block border-b border-charcoal/60 pb-1 text-xs font-medium uppercase tracking-luxe transition-colors duration-400 group-hover:border-charcoal">
                    Shop the gift
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Bulk & corporate */}
      <section id="bulk" className="scroll-mt-28 py-20 md:py-28">
        <Container className="max-w-3xl text-center">
          <p className="eyebrow">Bulk &amp; corporate gifting</p>
          <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
            Gifting a whole <em className="italic text-terracotta">team</em>?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-charcoal/75 md:text-lg">
            Candle sets for clients, colleagues or a big family? Tell us what you
            have in mind, the quantity and the date you need them by, and
            we&rsquo;ll come back to you with availability.
          </p>
          <Link href="/contact" className="btn-primary mt-9">
            Ask about bulk orders
          </Link>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-t border-sand py-20 md:py-24">
        <Container className="max-w-3xl">
          <h2 className="text-4xl md:text-5xl">Good to know</h2>
          <dl className="mt-10 divide-y divide-sand">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-display text-xl font-semibold md:text-2xl">{f.q}</dt>
                <dd className="mt-2 text-base leading-relaxed text-charcoal/75">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              Shop all gifts
            </Link>
            <Link href="/journal/a-small-guide-to-gifting" className="btn-outline">
              Read our gifting guide
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
