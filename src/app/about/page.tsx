import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: "Arivo Objects explores the relationship between everyday function and sculptural form.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-3xl">
        <h1 className="font-display text-3xl md:text-5xl">About Arivo</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/80">
          Arivo Objects is an independent, design-led home-object brand. It
          explores the relationship between everyday function and sculptural
          form — objects that hold their own as designed pieces, and that
          also happen to be useful.
        </p>
      </Container>

      <Container className="mt-16">
        <PlaceholderImage alt="The Arivo studio" aspect="wide" className="w-full" />
      </Container>

      <Container className="mt-16 grid max-w-3xl gap-10">
        <div>
          <h2 className="font-display text-2xl">Form, texture, function</h2>
          <p className="mt-3 text-base leading-relaxed text-charcoal/75">
            Every object starts with material and shape before it starts with
            purpose. Jesmonite pours and marbles in a particular way, and the
            first collection — the trays, the candle vessel — grew out of
            working with that tendency rather than against it.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Individuality</h2>
          <p className="mt-3 text-base leading-relaxed text-charcoal/75">
            Each piece is cast and finished by hand, in small batches. Marble
            patterns form during the pour itself, which means no two objects
            are exactly identical — a deliberate part of how these pieces are
            made, not a limitation of it.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Slow production</h2>
          <p className="mt-3 text-base leading-relaxed text-charcoal/75">
            Objects are made in small runs rather than mass-produced. That
            means occasional waiting between order and dispatch — the trade-off
            for pieces that are cast, cured, sanded and finished individually.
          </p>
        </div>
      </Container>
    </div>
  );
}
