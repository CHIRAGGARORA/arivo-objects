import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function MaterialStory() {
  return (
    <section className="bg-bone py-20 md:py-28">
      <Container className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        <div className="order-2 md:order-1">
          <h2 className="max-w-md font-display text-3xl leading-tight md:text-4xl">
            Cast by hand. Finished by hand.
          </h2>
          <p className="mt-5 max-w-sm text-base text-charcoal/75">
            Each object is individually cast in Jesmonite, then hand-sanded and
            finished. Marble patterns form during the pour and naturally vary from
            piece to piece — no two objects are exactly identical.
          </p>
        </div>
        <ProductPicture
          image={{
            src: "/products/small-oval-marble-tray/black-marble/detail.jpg",
            alt: "Close-up of hand-finished black marble texture and rope-edge detail",
            isPlaceholder: false,
          }}
          aspect="portrait"
          className="order-1 md:order-2"
        />
      </Container>
    </section>
  );
}
