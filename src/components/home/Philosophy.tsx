import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function Philosophy() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        <ProductPicture
          image={{
            src: "/editorial/three-trays-closeup.jpg",
            alt: "Close-up of the rope-edge detail across the Arivo tray collection",
            isPlaceholder: false,
          }}
          aspect="portrait"
        />
        <div>
          <h2 className="max-w-md font-display text-3xl leading-tight md:text-4xl">
            Made to be lived with.
          </h2>
          <p className="mt-5 max-w-sm text-base text-charcoal/75">
            ARIVO creates functional objects that bring sculptural form and tactile
            material into everyday spaces. Each piece is designed to be used, not
            just displayed — a tray that holds what you set down, a vessel that
            becomes part of a room.
          </p>
        </div>
      </Container>
    </section>
  );
}
