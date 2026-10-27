import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";

const colourways = [
  {
    name: "Black Marble",
    hex: "#2B2A28",
    href: "/products/small-oval-marble-tray?variant=black-marble",
    src: "/products/small-oval-marble-tray/black-marble/detail.jpg",
  },
  {
    name: "Terracotta",
    hex: "#B5654A",
    href: "/products/small-oval-marble-tray?variant=terracotta-marble",
    src: "/products/small-oval-marble-tray/terracotta-marble/detail.jpg",
  },
  {
    name: "Ochre",
    hex: "#C89B4A",
    href: "/products/small-oval-marble-tray?variant=ochre-marble",
    src: "/products/small-oval-marble-tray/ochre-marble/detail.jpg",
  },
];

export function ColorCollection() {
  return (
    <section className="py-20 md:py-28" id="collection">
      <Container>
        <h2 className="font-display text-2xl md:text-3xl">Trays, in three colours</h2>
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {colourways.map((c) => (
            <Link key={c.name} href={c.href} className="group block">
              <ProductPicture
                image={{
                  src: c.src,
                  alt: `${c.name} marble texture close-up`,
                  isPlaceholder: false,
                }}
                aspect="portrait"
                className="transition-opacity duration-400 group-hover:opacity-90"
              />
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-charcoal/20"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <p className="text-sm">{c.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
