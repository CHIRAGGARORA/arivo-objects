import { Hero } from "@/components/home/Hero";
import { FeaturedObjects } from "@/components/home/FeaturedObjects";
import { Philosophy } from "@/components/home/Philosophy";
import { MaterialStory } from "@/components/home/MaterialStory";
import { EditorialImage } from "@/components/home/EditorialImage";
import { ColorCollection } from "@/components/home/ColorCollection";
import { CandleSection } from "@/components/home/CandleSection";
import { Process } from "@/components/home/Process";
import { InstagramSection } from "@/components/home/InstagramSection";
import { EmailSignup } from "@/components/home/EmailSignup";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Arivo Objects — Design-led home objects",
  description:
    "Handcrafted Jesmonite objects designed to bring form, texture and function into everyday spaces.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedObjects />
      <Philosophy />
      <MaterialStory />
      <EditorialImage />
      <ColorCollection />
      <CandleSection />
      <Process />
      <InstagramSection />
      <EmailSignup />
    </>
  );
}
