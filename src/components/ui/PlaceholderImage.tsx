import Image from "next/image";

interface PlaceholderImageProps {
  /** Customer-facing accessible name (used as aria-label — never dev-facing text) */
  alt: string;
  aspect?: "square" | "portrait" | "landscape" | "wide";
  className?: string;
}

const aspectClass: Record<NonNullable<PlaceholderImageProps["aspect"]>, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/7]",
};

/**
 * A neutral, on-brand placeholder used anywhere real product photography is
 * pending. Deliberately shows no visible text to the customer — just a soft
 * warm surface with a faint brand watermark — so it reads as an intentional
 * blank canvas rather than an unfinished template. `alt` is only exposed via
 * aria-label for screen readers, never rendered visibly.
 */
export function PlaceholderImage({
  alt,
  aspect = "square",
  className = "",
}: PlaceholderImageProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden bg-bone ${aspectClass[aspect]} ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-bone via-bone to-sand/40" aria-hidden="true" />
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="relative h-[24%] w-[24%] opacity-[0.09]">
          <Image src="/brand/arivo-mark.png" alt="" fill className="object-contain" sizes="200px" />
        </div>
      </div>
    </div>
  );
}
