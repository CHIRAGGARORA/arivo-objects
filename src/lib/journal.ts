import { JournalArticle } from "@/types/product";

/**
 * journal.ts
 * ---------------------------------------------------------------------------
 * Add new articles by appending to this array — the journal index and
 * /journal/[slug] page render entirely from this data.
 * ---------------------------------------------------------------------------
 */
export const journalArticles: JournalArticle[] = [
  {
    slug: "what-is-jesmonite",
    title: "What Is Jesmonite?",
    excerpt:
      "The material behind every ARIVO object — what it is, and why it behaves differently to resin or plaster.",
    readingTime: "3 min read",
    body: [
      "Jesmonite is a water-based mineral composite, typically a blend of gypsum-based powders and an acrylic resin binder. It was originally developed for architectural and restoration work, valued for being lighter than stone or concrete while holding fine detail well.",
      "Unlike plaster, Jesmonite can take pigment directly into the casting mix, which is what allows the marbled patterns across the ARIVO collection to form during the pour itself, rather than being painted on afterward.",
      "It also cures harder and more durable than plaster, without the strong odour or curing heat associated with some resin systems — which is part of why it suits small-batch, hand-poured objects made at home-studio scale.",
      "Every ARIVO piece starts as a liquid mix, poured by hand into a mould, left to cure, then released, sanded and finished by hand before it becomes the object you receive.",
    ],
  },
  {
    slug: "why-every-object-looks-different",
    title: "Why Every ARIVO Object Looks Different",
    excerpt:
      "Marble patterns form during the pour, not after — which is why no two pieces are identical.",
    readingTime: "2 min read",
    body: [
      "The marbling on an ARIVO tray or candle vessel isn't printed, stamped, or painted on. It happens during the pour, when pigmented Jesmonite is introduced into the base mix and swirled by hand before it sets.",
      "That means the exact pattern is never fully repeatable. Two trays cast from the same mould, in the same colourway, on the same day, will still carry slightly different marbling.",
      "We see this as part of the object rather than a flaw to correct. It's also why we ask you to expect natural variation — in the marbling, and occasionally in small surface characteristics like minor air pockets — rather than a uniform, mass-produced finish.",
    ],
  },
  {
    slug: "behind-the-making",
    title: "Behind the Making of an ARIVO Object",
    excerpt: "A walk through the four stages every piece goes through: cast, cure, sand, finish.",
    readingTime: "3 min read",
    body: [
      "Every ARIVO object goes through the same four broad stages, regardless of its final shape: cast, cure, sand, finish.",
      "Casting is where colour and pattern are introduced — pigmented Jesmonite is mixed and poured into a mould by hand, with marbling formed through how the colours are introduced and moved before the mix sets.",
      "Curing is a waiting stage. The cast piece needs time at rest before it can be safely removed from its mould without damaging the form.",
      "Sanding refines the surface and edges by hand, removing any rough edges left from the mould and preparing the piece for finishing.",
      "Finishing is the final pass — checking the surface, cleaning any residue, and confirming the piece meets the standard before it's ready to photograph, package and send.",
    ],
  },
  {
    slug: "how-to-care-for-jesmonite",
    title: "How to Care for Jesmonite",
    excerpt: "Simple care guidance to keep a Jesmonite tray or vessel looking the way it should.",
    readingTime: "2 min read",
    body: [
      "Jesmonite objects are low-maintenance, but a few habits will keep them looking their best for longer.",
      "Wipe clean with a soft, slightly damp cloth. Avoid soaking pieces in water or leaving them fully submerged, since prolonged water exposure isn't recommended for this material.",
      "Keep pieces out of prolonged direct sunlight, which can affect colour over time — especially on pigmented or marbled surfaces.",
      "Avoid contact with sharp or abrasive objects, which can scratch the finished surface.",
      "For candle vessels specifically, allow the vessel to cool fully before cleaning out any remaining wax, and avoid using abrasive tools that could damage the engraved detail.",
    ],
  },
  {
    slug: "from-material-to-object",
    title: "From Material to Object",
    excerpt: "How a design starts as a question about material and form, before it becomes a product.",
    readingTime: "3 min read",
    body: [
      "Every ARIVO object starts as a question about material and form, not a product brief. What does this material want to do, and what shape lets it do that honestly?",
      "Jesmonite pours and marbles in a particular way — it doesn't hold sharp edges the way resin can, but it takes soft, architectural curves very well. The oval tray, the abstract cloud shape, and the flower-engraved candle vessel all came from working with that tendency rather than against it.",
      "Function comes after form is settled, not before. A tray needs a rim that holds objects without dominating the design; a candle vessel needs to hold heat and wax safely while still carrying the engraved detail. Those constraints get folded in once the object's core shape already feels right.",
      "The result is meant to sit somewhere between a functional object and a small sculptural piece — usable, but not only that.",
    ],
  },
];

export function getArticleBySlug(slug: string): JournalArticle | undefined {
  return journalArticles.find((a) => a.slug === slug);
}
