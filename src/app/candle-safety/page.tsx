import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Candle Safety",
  description: "Safety guidance for burning Arivo scented candles.",
  path: "/candle-safety",
});

export default function CandleSafetyPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Candle Safety</h1>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">Burning safely</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Never leave a burning candle unattended.</li>
              <li>Keep away from children, pets, drafts and flammable materials.</li>
              <li>Burn on a stable, heat-resistant surface.</li>
              <li>Trim the wick short before each burn.</li>
              <li>Let the jar cool fully before moving it or putting the lid back on.</li>
              <li>Stop burning when only a little wax remains at the bottom.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Candle details</h2>
            <p className="mt-2">
              Wax type, wick type and approximate burn time will be added to each
              product page once confirmed.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
