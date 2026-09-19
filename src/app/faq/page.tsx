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
    a: "Jesmonite is a water-based mineral composite used to cast each Arivo object by hand. Read more on the Journal page, \"What Is Jesmonite?\"",
  },
  {
    q: "Why does my piece look different from the photo?",
    a: "Marble patterns form during the pour and vary naturally from piece to piece. The photo shows a representative example of the colourway, not the exact piece you'll receive.",
  },
  {
    q: "Is checkout available yet?",
    a: "Not yet. Online payment is being set up. You can browse the collection and use the cart preview, but purchases cannot be completed on the site at this time.",
  },
  {
    q: "When will the candle be available with wax?",
    a: "The complete candle (vessel, soy wax, sandalwood fragrance, cotton wick) will go on sale once burn and safety testing is finished. The Jesmonite vessel's specifications will be published once confirmed.",
  },
  {
    q: "Do you ship across India?",
    a: "Shipping details are being finalised — see the Shipping & Returns page for the latest information.",
  },
  {
    q: "How do I care for my object?",
    a: "Wipe clean with a soft, slightly damp cloth, avoid soaking in water, and keep out of prolonged direct sunlight. Full guidance is on each product page under \"Care\".",
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
