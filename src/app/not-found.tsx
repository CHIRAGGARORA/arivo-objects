import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <Container>
        <h1 className="font-display text-3xl md:text-4xl">Page not found</h1>
        <p className="mt-4 text-sm text-charcoal/70">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block border border-charcoal px-7 py-3 text-sm tracking-wide transition-colors duration-400 hover:bg-charcoal hover:text-ivory"
        >
          Back to home
        </Link>
      </Container>
    </div>
  );
}
