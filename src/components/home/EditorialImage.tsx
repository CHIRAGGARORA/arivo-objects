import { ProductPicture } from "@/components/ui/ProductPicture";

export function EditorialImage() {
  return (
    <section>
      <ProductPicture
        image={{
          src: "/editorial/three-trays-styled.jpg",
          alt: "The Arivo tray collection styled with a lit candle, a watch and everyday objects",
          isPlaceholder: false,
        }}
        aspect="wide"
        className="w-full"
      />
    </section>
  );
}
