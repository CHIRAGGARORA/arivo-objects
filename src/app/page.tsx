import { Hero } from "@/components/home/Hero";
import { FeaturedObjects } from "@/components/home/FeaturedObjects";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ShopByRitual } from "@/components/home/ShopByRitual";
import { CandleSection } from "@/components/home/CandleSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { EmailSignup } from "@/components/home/EmailSignup";
import { ReviewsMarquee } from "@/components/reviews/ReviewsMarquee";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Arivo Objects — Home decor & gifts",
  description:
    "Design-led home decor and gifts: scented candle jar sets and marble trays. Free shipping, dispatched within 48 hours.",
  path: "/",
});

// Re-render every 5 minutes so newly approved reviews appear without a deploy.
export const revalidate = 300;

// Hero, trust strip, the collection, the candle sets, shop-by-ritual tiles,
// reviews, then Instagram and the newsletter. The longer brand-story sections (Philosophy,
// MaterialStory, Process, EditorialImage) still exist as components but are
// off the homepage to keep the scroll quick.
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedObjects />
      <CandleSection />
      <ShopByRitual />
      <ReviewsMarquee />
      <InstagramSection />
      <EmailSignup />
    </>
  );
}
