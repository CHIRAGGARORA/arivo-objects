import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Answers to common questions about Arivo trays, candles, orders, shipping and payments.",
  path: "/faq",
});

interface Faq {
  q: string;
  a: string;
}

const sections: { title: string; items: Faq[] }[] = [
  {
    title: "Orders & payment",
    items: [
      {
        q: "How can I pay?",
        a: "Checkout is processed securely by Razorpay. You can pay with UPI, debit or credit cards and netbanking. Orders are prepaid; we don't offer cash on delivery.",
      },
      {
        q: "How do I use the FIRST5 coupon?",
        a: "At checkout, tap the coupon box and choose FIRST5. It takes 5% off your first order with us and works once per email address.",
      },
      {
        q: "Will I get an order confirmation?",
        a: "Yes. As soon as your payment is confirmed we email a confirmation with your order number and a link to your order page, where you can check its status at any time.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Please contact us as soon as possible with your order number. We dispatch within 48 hours, so once an order has shipped we can no longer change it.",
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        q: "Do you ship across India?",
        a: "Yes. Shipping is free on every order across India.",
      },
      {
        q: "How fast do you dispatch?",
        a: "Every order is packed and dispatched within 48 hours of payment. Delivery time after that depends on your PIN code and the courier.",
      },
      {
        q: "What if my order arrives damaged or incorrect?",
        a: "Contact us promptly after delivery with your order number and photos of the item and packaging, and we'll make it right. Details are on our Shipping & Returns page.",
      },
      {
        q: "Do you accept returns?",
        a: "We don't accept returns or exchanges for change of mind, so please choose carefully. Damaged, defective or incorrect items are always covered.",
      },
    ],
  },
  {
    title: "Candles",
    items: [
      {
        q: "What are the candles made of?",
        a: "Soy wax scented with sandalwood, with a cotton wick, poured into printed metal tins with lids. The larger set holds 130 ml of wax per tin; the Mini set holds 50 ml per tin.",
      },
      {
        q: "What's in each candle set?",
        a: "Four candle tins with lids, each in a different design. Props in our photos are for styling only.",
      },
      {
        q: "Which fragrances are available?",
        a: "Sandalwood for now — warm and woody. More fragrances are on the way.",
      },
      {
        q: "How do I get the best burn?",
        a: "On the first light, let the wax melt all the way to the edge of the tin before blowing it out, trim the wick to about 5 mm before each burn, and avoid burning for more than about 4 hours at a time. Our Journal has a full guide.",
      },
      {
        q: "Can I reuse the tins?",
        a: "Yes. Once the candle is finished, clean out the last of the wax and use the tin for jewellery, pins, matches or small trinkets.",
      },
      {
        q: "Are the candles safe to burn anywhere?",
        a: "Burn on a stable, heat-resistant surface away from drafts, curtains, children and pets, and never leave a burning candle unattended. The tin gets hot while burning. See Candle Safety for more.",
      },
    ],
  },
  {
    title: "Marble trays",
    items: [
      {
        q: "What is Jesmonite?",
        a: "Jesmonite is a water-based mineral composite. We hand-pour it into moulds with pigment swirled in, which is how each tray gets its marble pattern.",
      },
      {
        q: "Why does my tray look different from the photo?",
        a: "The marbling forms during the pour, so no two trays are identical. The photo shows the colourway, not the exact piece you'll receive. Small surface characteristics such as minor air pockets are part of the handmade process.",
      },
      {
        q: "How do I care for my tray?",
        a: "Wipe it with a soft, slightly damp cloth. Don't soak it in water, and keep it out of prolonged direct sunlight to protect the colour.",
      },
      {
        q: "What can I use the trays for?",
        a: "Keys, watches, rings and jewellery, a candle, a coffee cup, or bathroom bits like soap and perfume. They're decorative trays, not for hot pans or sharp tools.",
      },
    ],
  },
  {
    title: "Gifting",
    items: [
      {
        q: "Are the sets good for gifting?",
        a: "That's what we designed them for. The four-tin candle sets work for Diwali, housewarmings and birthdays, and the Mini set makes a lovely small gift or return gift. A tray with a candle set is a complete present.",
      },
    ],
  },
];

export default function FaqPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
    ),
  };

  return (
    <div className="py-16 md:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Container className="max-w-3xl">
        <p className="eyebrow">Help</p>
        <h1 className="mt-3 text-5xl md:text-6xl">Questions, answered</h1>
        <p className="mt-5 max-w-xl text-base font-light text-charcoal/70">
          Can&rsquo;t find what you&rsquo;re looking for?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:no-underline">
            Get in touch
          </Link>
          .
        </p>

        {sections.map((section) => (
          <section key={section.title} className="mt-14">
            <h2 className="text-3xl">{section.title}</h2>
            <div className="mt-5 divide-y divide-sand/70 border-y border-sand/70">
              {section.items.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="text-xl font-light text-charcoal/50 transition-transform duration-400 group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-charcoal/75">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </Container>
    </div>
  );
}
