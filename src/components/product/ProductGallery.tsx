"use client";

import { useState } from "react";
import { ProductImage } from "@/types/product";
import { ProductPicture } from "@/components/ui/ProductPicture";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // If the images array changes (e.g. the person switched colour variants)
  // and the previously active index no longer exists for the new variant,
  // fall back to the first image rather than showing nothing. If the index
  // *does* still exist (the common case — every variant here has the same
  // main/detail shape), it's left alone, so switching Black -> Terracotta
  // while viewing the detail shot keeps you on Terracotta's detail shot
  // instead of silently jumping back to the main image.
  const currentIndex = activeIndex < images.length ? activeIndex : 0;
  const active = images[currentIndex];

  return (
    <div>
      <ProductPicture
        image={active}
        aspect={active.aspect ?? "portrait"}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === currentIndex}
              className={`border transition-colors duration-400 ${
                i === currentIndex ? "border-charcoal" : "border-sand/60 hover:border-charcoal/40"
              }`}
            >
              <ProductPicture image={img} aspect="square" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
