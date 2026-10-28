import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductPicture } from "@/components/ui/ProductPicture";
import { journalArticles, getArticleBySlug } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return journalArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return pageMetadata({ title: "Journal", description: "Notes on material, process and the making of Arivo objects.", path: "/journal" });
  return pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/journal/${article.slug}`,
  });
}

export default async function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  const more = journalArticles.filter((a) => a.slug !== article.slug && a.category === article.category).slice(0, 2);
  const others = more.length ? more : journalArticles.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <article className="py-16 md:py-24">
      <Container className="max-w-3xl">
        <Link href="/journal" className="text-[11px] font-medium uppercase tracking-luxe text-charcoal/60 hover:text-charcoal">
          &larr; Journal
        </Link>
        <p className="eyebrow mt-10">{article.category} · {article.readingTime}</p>
        <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl">{article.title}</h1>
        <p className="mt-5 text-lg font-light text-charcoal/70">{article.excerpt}</p>
      </Container>
      <Container className="mt-12 max-w-5xl">
        <ProductPicture image={{ ...article.cover, isPlaceholder: false }} aspect="landscape" sizes="(min-width: 1024px) 1024px, 100vw" priority />
      </Container>
      <Container className="max-w-2xl">
        <div className="mt-12 space-y-6 text-[17px] font-light leading-relaxed text-charcoal/85 first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.85]">
          {article.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3 border-t border-sand/70 pt-10">
          <Link href={article.category === "Material" || article.category === "Care" ? "/shop?category=tray" : "/shop?category=candle"} className="btn-primary">
            {article.category === "Material" ? "Shop the trays" : article.category === "Care" ? "Shop the collection" : "Shop the candles"}
          </Link>
          <Link href="/faq" className="btn-outline">
            Read the FAQ
          </Link>
        </div>
      </Container>

      <Container className="mt-20 max-w-5xl">
        <h2 className="text-3xl">Keep reading</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {others.map((a) => (
            <Link key={a.slug} href={`/journal/${a.slug}`} className="group block">
              <div className="overflow-hidden">
                <div className="transition-transform duration-1200 ease-out group-hover:scale-[1.04]">
                  <ProductPicture image={{ ...a.cover, isPlaceholder: false }} aspect="landscape" sizes="(min-width: 640px) 50vw, 100vw" />
                </div>
              </div>
              <h3 className="mt-4 text-2xl">{a.title}</h3>
            </Link>
          ))}
        </div>
      </Container>
    </article>
  );
}
