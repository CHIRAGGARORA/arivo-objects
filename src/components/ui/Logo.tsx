import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface LogoProps {
  /**
   * "lockup" — compact mark + wordmark, for the header, where the full
   *            circular badge would read too small.
   * "mark"   — the cropped monogram only, no wordmark text.
   * "full"   — the complete supplied circular badge, for footer/brand/social
   *            use where it has room to breathe.
   */
  variant?: "lockup" | "mark" | "full";
  className?: string;
  /** Pass null to render without the wrapping link (e.g. inside another link) */
  href?: string | null;
}

export function Logo({ variant = "lockup", className = "", href = "/" }: LogoProps) {
  let content: ReactNode;

  if (variant === "full") {
    content = (
      <span className={`relative block aspect-square ${className}`}>
        <Image
          src="/brand/arivo-logo.png"
          alt="Arivo Objects"
          fill
          className="object-contain"
          sizes="200px"
        />
      </span>
    );
  } else {
    content = (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <span className="relative h-7 w-7 shrink-0 md:h-8 md:w-8">
          <Image
            src="/brand/arivo-mark.png"
            alt={variant === "mark" ? "Arivo Objects" : ""}
            fill
            className="object-contain"
            sizes="32px"
            priority
          />
        </span>
        {variant === "lockup" && (
          <span className="font-display text-lg tracking-wide md:text-xl">Arivo Objects</span>
        )}
      </span>
    );
  }

  if (href === null) return content;

  return (
    <Link href={href} aria-label="Arivo Objects — home">
      {content}
    </Link>
  );
}
