import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function Hero() {
  return (
    <section className="relative">
      <ProductPicture
        image={{
          src: "/editorial/three-trays-shelf.jpg",
          alt: "The Arivo tray collection — black, terracotta and ochre marble — styled together",
          isPlaceholder: false,
        }}
        aspect="wide"
        className="w-full"
        priority
      />
      <Container className="py-10 md:py-14">
        <h1 className="max-w-2xl font-display text-4xl leading-[1.1] md:text-6xl">
          Objects for everyday spaces.
        </h1>
        <p className="mt-5 max-w-md text-base text-charcoal/75 md:text-lg">
          Handcrafted objects shaped by form, texture and the rituals of everyday life.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
        >
          Shop the collection
        </Link>
      </Container>
    </section>
  );
}
