import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Arivo Objects is a design-led home decor and gifting brand: hand-poured Jesmonite marble trays and sandalwood soy wax candles.",
  path: "/about",
});

const values = [
  {
    title: "Made by hand",
    text: "Our trays are hand-poured in Jesmonite, a water-based mineral composite. The marble pattern forms during the pour, so every tray is one of a kind.",
  },
  {
    title: "Poured with soy",
    text: "Our candles are soy wax with a cotton wick, scented with warm sandalwood and set in printed tins you'll want to keep long after the last burn.",
  },
  {
    title: "Ready to give",
    text: "We design in sets and colourways that feel complete on their own: a gift that needs no extra effort, or a small luxury for your own shelf.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-3xl">
        <p className="eyebrow">Our story</p>
        <h1 className="mt-3 text-5xl leading-[1.05] md:text-7xl">
          Objects for <em className="italic text-terracotta">slow</em> living
        </h1>
        <p className="mt-7 max-w-xl text-lg font-light leading-relaxed text-charcoal/80">
          Arivo Objects is an independent, design-led home decor and gifting brand.
          We make small objects for everyday rituals: a tray by the door for your
          keys, a candle lit at the end of the day. Things that look good, feel
          considered and are easy to give.
        </p>
      </Container>

      <Container className="mt-16 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-3 md:gap-5">
        <ProductPicture
          image={{ src: "/editorial/three-trays-closeup.jpg", alt: "Close-up of three Arivo marble trays", isPlaceholder: false }}
          aspect="portrait"
          sizes="(min-width: 768px) 33vw, 50vw"
        />
        <ProductPicture
          image={{
            src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-festive.webp",
            alt: "Mini sandalwood candle tins lit on a wooden tray with marigolds",
            isPlaceholder: false,
          }}
          aspect="portrait"
          className="md:mt-12"
          sizes="(min-width: 768px) 33vw, 50vw"
        />
        <ProductPicture
          image={{ src: "/editorial/three-trays-shelf.jpg", alt: "Arivo marble trays styled on a shelf", isPlaceholder: false }}
          aspect="portrait"
          className="hidden md:block"
          sizes="33vw"
        />
      </Container>

      <Container className="mt-20 grid max-w-5xl gap-12 md:grid-cols-3 md:gap-10">
        {values.map((v, i) => (
          <Reveal key={v.title} delayMs={i * 120}>
            <p className="font-display text-sm italic text-terracotta">0{i + 1}</p>
            <h2 className="mt-2 text-3xl">{v.title}</h2>
            <p className="mt-3 text-base font-light leading-relaxed text-charcoal/75">{v.text}</p>
          </Reveal>
        ))}
      </Container>

      <Container className="mt-20 max-w-3xl text-center">
        <Reveal>
          <p className="font-display text-3xl italic leading-snug md:text-4xl">
            &ldquo;Every object starts with material and shape before it starts with purpose.&rdquo;
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-primary">
              Shop the collection
            </Link>
            <Link href="/journal" className="btn-outline">
              Read the journal
            </Link>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
