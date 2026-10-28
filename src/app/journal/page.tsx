import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { Reveal } from "@/components/ui/Reveal";
import { journalArticles } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Journal",
  description: "Candle care, Jesmonite, gifting ideas and the making of Arivo objects.",
  path: "/journal",
});

export default function JournalIndexPage() {
  const [lead, ...rest] = journalArticles;

  return (
    <div className="py-16 md:py-24">
      <Container>
        <p className="eyebrow">The Arivo journal</p>
        <h1 className="mt-3 text-5xl md:text-7xl">Notes &amp; rituals</h1>
        <p className="mt-5 max-w-lg text-base text-charcoal/70">
          Candle care, the material behind our trays, gifting ideas and how every object is made.
        </p>

        <Link href={`/journal/${lead.slug}`} className="group mt-14 grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="overflow-hidden">
            <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.03]">
              <ProductPicture image={{ ...lead.cover, isPlaceholder: false }} aspect="landscape" sizes="(min-width: 768px) 50vw, 100vw" priority />
            </div>
          </div>
          <div>
            <p className="eyebrow">{lead.category} · {lead.readingTime}</p>
            <h2 className="mt-4 text-4xl leading-tight md:text-5xl">{lead.title}</h2>
            <p className="mt-4 max-w-md text-base text-charcoal/70">{lead.excerpt}</p>
            <p className="mt-6 text-xs font-medium uppercase tracking-luxe underline-offset-4 group-hover:underline">Read the article</p>
          </div>
        </Link>

        <div className="mt-20 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, i) => (
            <Reveal key={article.slug} delayMs={(i % 3) * 120}>
              <Link href={`/journal/${article.slug}`} className="group block">
                <div className="overflow-hidden">
                  <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.04]">
                    <ProductPicture image={{ ...article.cover, isPlaceholder: false }} aspect="landscape" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  </div>
                </div>
                <p className="eyebrow mt-5">{article.category} · {article.readingTime}</p>
                <h3 className="mt-2 text-2xl leading-snug">{article.title}</h3>
                <p className="mt-2 text-sm text-charcoal/70">{article.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-24 border-t border-sand/70 pt-12 text-center">
          <h2 className="text-3xl md:text-4xl">Have a question?</h2>
          <p className="mt-3 text-base text-charcoal/70">Shipping, payments, candle care and more.</p>
          <Link href="/faq" className="btn-outline mt-7">
            Read the FAQ
          </Link>
        </div>
      </Container>
    </div>
  );
}
