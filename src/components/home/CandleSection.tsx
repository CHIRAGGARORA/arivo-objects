import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export function CandleSection() {
  return (
    <section className="bg-charcoal py-20 text-ivory md:py-28">
      <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <h2 className="max-w-md font-display text-3xl leading-tight md:text-4xl">
            A small ritual, held in Jesmonite.
          </h2>
          <p className="mt-5 max-w-sm text-base text-ivory/75">
            The flower-engraved candle vessel is designed to be lit, and kept once
            the wax is gone. Final wax, fragrance and burn specifications are being
            confirmed through testing before the complete candle goes on sale.
          </p>
          <Link
            href="/products/flower-jesmonite-candle"
            className="mt-8 inline-block border border-ivory px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-ivory hover:text-charcoal"
          >
            View the candle
          </Link>
        </div>
        <PlaceholderImage
          alt="The Arivo flower candle, lit"
          aspect="portrait"
        />
      </Container>
    </section>
  );
}
