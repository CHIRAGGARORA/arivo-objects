import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { journalArticles, getArticleBySlug } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return journalArticles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return pageMetadata({ title: "Journal", description: "Notes on material, process and the making of Arivo objects.", path: "/journal" });
  return pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/journal/${article.slug}`,
  });
}

export default function JournalArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <article className="py-16 md:py-24">
      <Container className="max-w-2xl">
        <Link href="/journal" className="text-sm text-charcoal/60 hover:text-charcoal">
          &larr; Journal
        </Link>
        <h1 className="mt-6 font-display text-3xl md:text-4xl">{article.title}</h1>
        <p className="mt-2 text-xs text-charcoal/45">{article.readingTime}</p>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-charcoal/80">
          {article.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </article>
  );
}
