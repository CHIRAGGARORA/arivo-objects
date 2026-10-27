import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: "Arivo Objects is a design-led home decor and gifting brand.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-3xl">
        <h1 className="font-display text-3xl md:text-5xl">About Arivo</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/80">
          Arivo Objects is an independent, design-led home decor and gifting
          brand. We make and curate objects for your space, from marble trays
          to scented candles, that look good and are easy to give.
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
            purpose. Our marble trays are cast in Jesmonite, which pours and
            marbles in a particular way, so each one is slightly different.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Made to give</h2>
          <p className="mt-3 text-base leading-relaxed text-charcoal/75">
            We&rsquo;re building a small range of decor that works as a gift as
            much as it does on your own shelf, starting with scented candle
            jar sets and trays, with more on the way.
          </p>
        </div>
      </Container>
    </div>
  );
}
