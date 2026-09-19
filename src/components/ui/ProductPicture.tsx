import Image from "next/image";
import { ProductImage } from "@/types/product";
import { PlaceholderImage } from "./PlaceholderImage";

interface ProductPictureProps {
  image: ProductImage;
  aspect?: "square" | "portrait" | "landscape" | "wide";
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ProductPicture({
  image,
  aspect = "square",
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
}: ProductPictureProps) {
  if (image.isPlaceholder) {
    return <PlaceholderImage alt={image.alt} aspect={aspect} className={className} />;
  }

  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "portrait"
      ? "aspect-[3/4]"
      : aspect === "landscape"
      ? "aspect-[4/3]"
      : "aspect-[16/7]";

  return (
    <div className={`relative overflow-hidden bg-bone ${aspectClass} ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
