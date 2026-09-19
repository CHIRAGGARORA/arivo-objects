import { Container } from "@/components/ui/Container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Candle Safety",
  description: "Safety information for the Arivo flower Jesmonite candle.",
  path: "/candle-safety",
});

export default function CandleSafetyPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <h1 className="font-display text-3xl md:text-5xl">Candle Safety</h1>

        <div className="mt-6 border border-terracotta/50 bg-terracotta/10 px-5 py-4 text-sm text-charcoal/80">
          <strong>Not yet available for sale as a lit candle.</strong> The
          Jesmonite vessel and cotton wick combination has not completed burn
          and safety testing. This page will be updated with tested, confirmed
          information — burn time, safe clearance, and handling instructions —
          once that testing is complete. Nothing below should be treated as a
          final safety claim.
        </div>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal/80">
          <section>
            <h2 className="font-display text-xl text-charcoal">General candle handling</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Never leave a burning candle unattended.</li>
              <li>Keep away from children, pets, drafts and flammable materials.</li>
              <li>Burn on a stable, heat-resistant surface.</li>
              <li>Trim the wick before each burn (exact length to be confirmed after testing).</li>
              <li>Discontinue use once the recommended remaining wax level is reached (to be confirmed).</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Vessel reuse</h2>
            <p className="mt-2">
              The Jesmonite vessel is designed to be kept and reused once the
              candle is finished. Guidance on safely removing remaining wax
              will be published alongside the final tested specifications.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl text-charcoal">Pending information</h2>
            <p className="mt-2">
              Wax type, fragrance load, wick type, and approximate burn time
              are not yet finalised. These will be published here and on the
              product page once burn testing is complete.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
