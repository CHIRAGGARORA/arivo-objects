import { JournalArticle } from "@/types/product";
import { formatPrice, getProductBySlug } from "@/lib/products";

/** Current price of a product, so article text never quotes a stale price. */
function price(slug: string): string {
  const p = getProductBySlug(slug);
  if (!p) throw new Error(`Journal references unknown product "${slug}"`);
  return formatPrice(p.price);
}

const MINI = "mini-scented-candle-jar-pack-of-4";
const CANDLES = "scented-candle-jar-pack-of-4";
const OVAL = "small-oval-marble-tray";
const CLOUD = "large-cloud-marble-tray";

/**
 * journal.ts
 * ---------------------------------------------------------------------------
 * Add new articles by appending to this array — the journal index and
 * /journal/[slug] page render entirely from this data.
 * ---------------------------------------------------------------------------
 */
export const journalArticles: JournalArticle[] = [
  {
    slug: "diwali-gift-ideas-under-500-and-1000",
    title: "Diwali Gift Ideas Under ₹500 and ₹1,000",
    category: "Gifting",
    published: "2026-10-28",
    cover: {
      src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-festive.webp",
      alt: "Mini candle tins on a festive tray with marigolds and a gift box",
    },
    excerpt: "Thoughtful Diwali gifts that don't cost the earth: candle sets and marble trays for family, friends, colleagues and return gifts.",
    readingTime: "4 min read",
    products: [MINI, CANDLES, OVAL],
    body: [
      "Diwali gifting has a way of adding up. There's family, the neighbours, friends you'll visit, colleagues, the people who help run your home, and a stack of return gifts for everyone who visits you. The trick is finding something that feels considered without spending a fortune on every name on the list.",
      "Light is at the heart of the festival, which is why candles make such a natural Diwali gift. A good candle gets used, it makes the house smell like an occasion, and once it's finished the container can be kept. Here's how we'd spend at two budgets.",
      `Under ₹500: the Mini Scented Candle Jar Set (${price(MINI)}). Four 50 ml soy wax candles scented with sandalwood, each in its own mandala-printed tin with a lid: maroon floral, pink petal, green leaf and blue mandala. It works as one gift, or you can split the set into four small presents for colleagues, neighbours or return gifts.`,
      `Under ₹1,000: the Scented Candle Jar Set (${price(CANDLES)}). Four larger 130 ml sandalwood soy wax candles in patterned jars, each a different colour: sky blue, mustard yellow, pink-and-teal and red. It looks festive straight out of the box, and the jars can light up four corners of the house on Diwali night.`,
      `Also under ₹1,000: the Small Oval Marble Tray (${price(OVAL)}). A hand-poured Jesmonite tray with a rope-inspired edge, in black, terracotta or ochre marble. It's the gift for someone who appreciates objects: it ends up holding keys by the door, rings on a dresser, or a candle on the coffee table. Because the marbling forms during the pour, no two trays are the same.`,
      "Why sandalwood? It's warm, woody and familiar to almost every Indian home, so it's a safe choice even when you don't know someone's taste. It's soft enough for a bedroom and rich enough for a living room full of guests.",
      "For family or a host you're visiting, pair a tray with a candle set. The tray becomes the base, the candle sits on top, and the gift feels complete without any extra wrapping effort.",
      "A note on timing: every order ships free across India and is dispatched within 48 hours, with delivery usually taking a further 3–7 working days depending on your pin code. If you're gifting for Diwali, order early.",
    ],
  },
  {
    slug: "housewarming-gift-ideas",
    title: "Housewarming Gift Ideas That Actually Get Used",
    category: "Gifting",
    published: "2026-10-28",
    cover: {
      src: "/products/small-oval-marble-tray/terracotta-marble/main.jpg",
      alt: "Terracotta marble tray styled on a table",
    },
    excerpt: "Skip the generic showpiece. Housewarming gifts that earn a place in a new home from the first week.",
    readingTime: "3 min read",
    products: [OVAL, CANDLES, CLOUD],
    body: [
      "A new home is full of boxes and empty surfaces. The best housewarming gifts help fill that gap with something useful, rather than adding one more decorative piece that ends up in a cupboard.",
      "Think about the first week. Keys, wallets and watches need somewhere to land by the door. The coffee table needs something on it. The evenings need to feel like home rather than a half-unpacked flat. Gifts that answer those small needs get used every day.",
      `A tray by the door. The Small Oval Marble Tray (${price(OVAL)}) is sized for an entryway console, a bedside table or a bathroom counter. It gives the clutter a home, and the hand-poured marble finish makes it look deliberate rather than practical.`,
      `A candle for the first evenings. The Scented Candle Jar Set (${price(CANDLES)}) gives them four sandalwood candles in patterned jars, enough for the living room, the bedroom and a couple of spares. Lighting a candle is one of the quickest ways to make a new place smell and feel lived in.`,
      `Something sculptural for the coffee table. If you want a gift that feels a little more special, the Large Cloud Marble Tray (${price(CLOUD)}) has a soft, abstract shape that holds books, a candle or a small plant, and works as an object in its own right when it's empty.`,
      "Our favourite combination is a tray with a candle set on top: the new home's first little ritual, ready the moment it's unwrapped.",
      "Every order ships free across India, so you can have it sent straight to their new address.",
    ],
  },
  {
    slug: "how-to-style-a-decorative-tray",
    title: "How to Style a Decorative Tray: Ideas for Every Room",
    category: "Styling",
    published: "2026-10-28",
    cover: {
      src: "/products/large-cloud-marble-tray/black-marble/lifestyle.jpg",
      alt: "Large cloud marble tray styled with a candle and a vase on a table",
    },
    excerpt: "A tray turns scattered objects into a deliberate arrangement. Simple ways to style one in the entryway, living room, bedroom and bathroom.",
    readingTime: "4 min read",
    products: [OVAL, CLOUD],
    body: [
      "A tray is the easiest styling trick there is. The same keys, rings or bottles that look like clutter scattered across a surface suddenly look intentional once they're gathered together on one.",
      "A few principles work everywhere. Vary the heights: something tall, something medium, something flat. Stick to odd numbers, usually three objects. Leave a little empty space so the tray itself can be seen. And mix textures: marble with wood, glass or ceramic.",
      "In the entryway, keep it practical. A small tray on the console catches keys, a wallet, a watch and sunglasses on the way in. Add one small thing that isn't functional, like a candle or a tiny plant, so it reads as decor rather than a drop zone.",
      "On the coffee table, go a size up. A larger tray like our Large Cloud Marble Tray can hold a short stack of books, a candle and a small vase. Grouping objects this way keeps the rest of the table clear for cups and plates.",
      "On a bedside table or dresser, a tray keeps rings, earrings and a watch in one place overnight, so they don't get lost. A small oval tray fits even a narrow nightstand.",
      "In the bathroom, a tray corrals perfume, soap and skincare on the counter. With Jesmonite, keep it out of standing water: wipe it with a damp cloth rather than letting it sit wet.",
      "On a vanity or desk, use a tray as a frame for a few favourite things: a candle, a perfume bottle, a small dish. Rotate the objects with the seasons and the tray keeps the arrangement looking fresh.",
      "Because every ARIVO tray is hand-poured, the marble pattern is unique to your piece, so even a simple arrangement on top of it looks considered.",
    ],
  },
  {
    slug: "secret-santa-gift-ideas-under-500",
    title: "Secret Santa Gift Ideas Under ₹500",
    category: "Gifting",
    published: "2026-10-28",
    cover: {
      src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp",
      alt: "Mini candle tins in mandala prints laid out from above",
    },
    excerpt: "An office Secret Santa gift that works for almost anyone, stays under budget and doesn't end up in a drawer.",
    readingTime: "3 min read",
    products: [MINI],
    body: [
      "Secret Santa has two rules: stay under the budget, and give something the other person will actually like, often without knowing them very well. That rules out most jokes and novelty items, which tend to be forgotten by January.",
      "A good Secret Santa gift is small, useful, nicely presented and suits almost anyone. Candles tick every box: everyone has a corner of their desk or home where one belongs, and a good scent feels like a treat rather than a token.",
      `Our pick: the Mini Scented Candle Jar Set (${price(MINI)}). Four 50 ml soy wax candles scented with warm sandalwood, each in a different mandala-printed tin with a lid. It looks like a proper gift on its own, so there's no need to hunt for extra wrapping.`,
      "If your office budget is lower per person, the set also splits into four separate gifts: one tin each for four colleagues, or for a team where everyone draws a name.",
      "Sandalwood is a safe choice for someone whose taste you don't know. It's warm and familiar rather than sweet or overpowering, and suits a desk, a bedside table or a bathroom shelf.",
      "Once the candle is finished, the printed tin with its lid can be reused for paper clips, pins, earrings or spare change, so the gift lasts well beyond the last burn.",
      "Every order ships free across India and is dispatched within 48 hours. For a December exchange, order a week or two ahead so it arrives in good time.",
    ],
  },
  {
    slug: "how-to-get-the-best-burn",
    title: "How to Get the Best Burn From Your Candle",
    category: "Candles",
    cover: {
      src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-evening.webp",
      alt: "Four sandalwood candles burning on a side table in the evening",
    },
    excerpt: "Five small habits that make a soy wax candle burn evenly, smell stronger and last longer.",
    readingTime: "3 min read",
    body: [
      "A candle has a memory. The way you burn it the first few times decides how it burns for the rest of its life, so a little care at the start pays off in every evening after.",
      "Let the first burn reach the edges. The first time you light a candle, let it burn until the melted wax reaches all the way to the rim of the tin. For our tins that usually means a couple of hours. Blow it out too soon and the wax tunnels down the middle, leaving a wall of unused wax around the edge.",
      "Trim the wick before every light. Once the wax has cooled, trim the cotton wick to about 5 mm. A short wick gives a calm, steady flame; a long one flickers, smokes and leaves soot on the tin.",
      "Don't burn for more than about four hours at a time. Long burns overheat the wick and the tin. Let the candle cool, trim, and light it again another day.",
      "Keep it out of drafts. Fans, open windows and air conditioners make the flame dance and the wax melt unevenly. A still corner gives the best scent throw.",
      "Stop when there's about a centimetre of wax left. Burning right to the bottom overheats the tin. What's left is a perfect excuse to reuse the tin — see our note on giving your tin a second life.",
    ],
  },
  {
    slug: "why-we-pour-with-soy-wax",
    title: "Why We Pour With Soy Wax",
    category: "Candles",
    cover: {
      src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp",
      alt: "Top-down view of four open candle tins filled with cream soy wax",
    },
    excerpt: "What soy wax is, how it behaves, and why we chose it for every Arivo candle.",
    readingTime: "2 min read",
    body: [
      "Every Arivo candle is soy wax with a cotton wick. Soy wax is made from soybean oil, a renewable plant source, and it has a soft, creamy look that sits beautifully inside a patterned tin.",
      "Soy wax melts at a lower temperature than many other candle waxes. In practice that means a gentle, slower burn and a wide pool of melted wax, which is what carries the fragrance into the room.",
      "It's also why the first burn matters so much with soy. Give it time to melt to the edges, and the candle will burn evenly for the rest of its life.",
      "Soy wax can look slightly different from candle to candle — a little frosting on the surface, or a top that isn't perfectly smooth after burning. That's a natural trait of soy, not a fault, and it doesn't affect how the candle burns or smells.",
    ],
  },
  {
    slug: "sandalwood-a-scent-that-feels-like-home",
    title: "Sandalwood, a Scent That Feels Like Home",
    category: "Candles",
    cover: {
      src: "/products/scented-candle-jar-pack-of-4/sandalwood/styled-row.webp",
      alt: "Four lit candles in patterned tins with sandalwood sticks and rose petals",
    },
    excerpt: "Why our first fragrance is sandalwood — warm, woody, and familiar to almost every Indian home.",
    readingTime: "2 min read",
    body: [
      "Few scents are as familiar in India as sandalwood. It drifts out of temples and puja rooms, it's in attars and soaps, and for many of us it's simply the smell of home.",
      "That familiarity is exactly why we chose it as our first fragrance. Sandalwood is warm and woody without being sharp, soft enough to fill a living room in the evening without overpowering it.",
      "It also works across moods. Light a tin while you read, during a festival evening, or in the bathroom at the end of a long day — it settles a space rather than demanding attention.",
      "More fragrances are on the way. Sandalwood is where we wanted to start.",
    ],
  },
  {
    slug: "give-your-candle-tin-a-second-life",
    title: "Give Your Candle Tin a Second Life",
    category: "Care",
    cover: {
      src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-flatlay.webp",
      alt: "Four mini candle tins with their mandala-printed lids",
    },
    excerpt: "The candle is finished, the tin isn't. How to clean it out and what to use it for next.",
    readingTime: "2 min read",
    body: [
      "Our candle tins are printed metal with lids, and they're far too pretty to throw away. Once your candle is done, they make lovely little storage boxes.",
      "To clean one out, pop the tin in the freezer for an hour or two. The leftover wax shrinks as it gets cold and usually lifts out in one piece. For the last traces, wipe with kitchen towel while the tin is at room temperature, then wash with warm soapy water and dry it straight away.",
      "Then give it a new job: rings and earrings on a dresser, safety pins and buttons in a sewing kit, matches by the diya, paper clips on a desk, or a small stash of cardamom and cloves in the kitchen.",
      "A set of four cleaned tins also makes a neat organiser for a drawer — each design tells you what's inside at a glance.",
    ],
  },
  {
    slug: "a-small-guide-to-gifting",
    title: "A Small Guide to Gifting With Arivo",
    category: "Gifting",
    cover: {
      src: "/products/mini-scented-candle-jar-pack-of-4/sandalwood/styled-festive.webp",
      alt: "Mini candle tins on a wooden tray with marigolds and a gift box",
    },
    excerpt: "Which set for which occasion — from Diwali and housewarmings to return gifts and Secret Santa.",
    readingTime: "3 min read",
    body: [
      "We design our pieces to be gifts first. Here's how we'd choose, depending on the occasion.",
      "For Diwali and festive visits: the Scented Candle Jar Set. Four 130 ml sandalwood candles in bright patterned tins look festive on their own, and every tin can be lit in a different corner of the house.",
      "For return gifts, colleagues and Secret Santa: the Mini Scented Candle Jar Set. Four 50 ml tins in mandala prints — a thoughtful gift at a gentle price, and easy to split into four smaller presents if you need to.",
      "For housewarmings: a marble tray with a candle set. The tray goes by the door or on the coffee table, the candle sits on top of it, and the new home gets its first little ritual.",
      "For someone who has everything: the Large Cloud Marble Tray. Each one is hand-poured, so the pattern is truly theirs alone.",
      "Every order ships free across India and is dispatched within 48 hours, so even a last-minute gift has a good chance of arriving in time.",
    ],
  },
  {
    slug: "what-is-jesmonite",
    category: "Material",
    cover: { src: "/editorial/three-trays-closeup.jpg", alt: "Close-up of three marbled Jesmonite trays" },
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
    category: "Material",
    cover: { src: "/products/small-oval-marble-tray/terracotta-marble/detail.jpg", alt: "Terracotta marble pattern on a hand-poured tray" },
    title: "Why Every ARIVO Object Looks Different",
    excerpt:
      "Marble patterns form during the pour, not after — which is why no two pieces are identical.",
    readingTime: "2 min read",
    body: [
      "The marbling on an ARIVO tray isn't printed, stamped, or painted on. It happens during the pour, when pigmented Jesmonite is introduced into the base mix and swirled by hand before it sets.",
      "That means the exact pattern is never fully repeatable. Two trays cast from the same mould, in the same colourway, on the same day, will still carry slightly different marbling.",
      "We see this as part of the object rather than a flaw to correct. It's also why we ask you to expect natural variation — in the marbling, and occasionally in small surface characteristics like minor air pockets — rather than a uniform, mass-produced finish.",
    ],
  },
  {
    slug: "behind-the-making",
    category: "Material",
    cover: { src: "/editorial/three-trays-styled.jpg", alt: "Three finished Arivo trays styled together" },
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
    category: "Care",
    cover: { src: "/products/small-oval-marble-tray/ochre-marble/main.jpg", alt: "Ochre marble tray holding glasses and a ring dish" },
    title: "How to Care for Jesmonite",
    excerpt: "Simple care guidance to keep a Jesmonite tray looking the way it should.",
    readingTime: "2 min read",
    body: [
      "Jesmonite objects are low-maintenance, but a few habits will keep them looking their best for longer.",
      "Wipe clean with a soft, slightly damp cloth. Avoid soaking pieces in water or leaving them fully submerged, since prolonged water exposure isn't recommended for this material.",
      "Keep pieces out of prolonged direct sunlight, which can affect colour over time — especially on pigmented or marbled surfaces.",
      "Avoid contact with sharp or abrasive objects, which can scratch the finished surface.",
    ],
  },
  {
    slug: "from-material-to-object",
    category: "Material",
    cover: { src: "/products/large-cloud-marble-tray/black-marble/main.jpg", alt: "The Large Cloud Marble Tray on a stone surface" },
    title: "From Material to Object",
    excerpt: "How a design starts as a question about material and form, before it becomes a product.",
    readingTime: "3 min read",
    body: [
      "Every ARIVO object starts as a question about material and form, not a product brief. What does this material want to do, and what shape lets it do that honestly?",
      "Jesmonite pours and marbles in a particular way — it doesn't hold sharp edges the way resin can, but it takes soft, architectural curves very well. The oval tray and the abstract cloud shape both came from working with that tendency rather than against it.",
      "Function comes after form is settled, not before. A tray needs a rim that holds objects without dominating the design. Those constraints get folded in once the object's core shape already feels right.",
      "The result is meant to sit somewhere between a functional object and a small sculptural piece — usable, but not only that.",
    ],
  },
];

export function getArticleBySlug(slug: string): JournalArticle | undefined {
  return journalArticles.find((a) => a.slug === slug);
}
