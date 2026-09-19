import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { journalArticles } from "@/lib/journal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Journal",
  description: "Notes on material, process and the making of Arivo objects.",
  path: "/journal",
});

export default function JournalIndexPage() {
  return (
    <div className="py-16 md:py-24">
      <Container className="max-w-3xl">
        <h1 className="font-display text-3xl md:text-5xl">Journal</h1>
        <p className="mt-4 text-base text-charcoal/70">
          Notes on material, process and the making of Arivo objects.
        </p>

        <div className="mt-12 divide-y divide-sand/60 border-t border-sand/60">
          {journalArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/journal/${article.slug}`}
              className="group block py-6"
            >
              <p className="font-display text-xl transition-colors duration-400 group-hover:text-charcoal/70">
                {article.title}
              </p>
              <p className="mt-2 text-sm text-charcoal/70">{article.excerpt}</p>
              <p className="mt-2 text-xs text-charcoal/45">{article.readingTime}</p>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
