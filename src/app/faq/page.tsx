import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Answers to common questions about Arivo objects, materials and orders.",
  path: "/faq",
});

const faqs = [
  {
    q: "What is Jesmonite?",
    a: "Jesmonite is a water-based mineral composite used to cast our marble trays by hand. Read more on the Journal page, \"What Is Jesmonite?\"",
  },
  {
    q: "Why does my tray look different from the photo?",
    a: "Marble patterns form during the pour and vary naturally from piece to piece. The photo shows a representative example of the colourway, not the exact piece you'll receive.",
  },
  {
    q: "How can I pay?",
    a: "Checkout is processed securely through Razorpay, supporting UPI, cards and netbanking.",
  },
  {
    q: "Which fragrances do the candle jars come in?",
    a: "Sandalwood for now. More fragrances are coming soon.",
  },
  {
    q: "How fast do you dispatch?",
    a: "Orders are dispatched within 48 hours of payment.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes, with free shipping on every order, dispatched within 48 hours. We don't accept returns. See the Shipping & Returns page for details, including what to do if an item arrives damaged or incorrect.",
  },
  {
    q: "How do I use the FIRST5 coupon code?",
    a: "Enter FIRST5 at checkout for 5% off your order. It can be applied by anyone and isn't currently restricted to a single use per customer.",
  },
  {
    q: "How do I care for my tray?",
    a: "Wipe clean with a soft, slightly damp cloth, avoid soaking in water, and keep out of prolonged direct sunlight. Care guidance for every product is on its page under \"Care\".",
  },
];

export default function FaqPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">FAQ</h1>
        <div className="mt-10 divide-y divide-sand/60 border-t border-sand/60">
          {faqs.map((item) => (
            <div key={item.q} className="py-6">
              <p className="text-base font-medium">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{item.a}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
