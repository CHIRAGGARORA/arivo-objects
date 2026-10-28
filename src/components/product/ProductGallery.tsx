"use client";

import { KeyboardEvent, useRef, useState } from "react";
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
  const many = images.length > 1;
  const touchX = useRef<number | null>(null);

  const go = (to: number) => setActiveIndex((to + images.length) % images.length);

  function onKey(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") go(currentIndex - 1);
    if (e.key === "ArrowRight") go(currentIndex + 1);
  }

  const arrow =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/85 text-charcoal shadow-sm backdrop-blur transition-opacity duration-400 hover:bg-ivory md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100";

  return (
    <div>
      <div
        className="group relative"
        tabIndex={many ? 0 : undefined}
        role={many ? "region" : undefined}
        aria-roledescription={many ? "carousel" : undefined}
        aria-label={many ? "Product photos — use the arrow keys to browse" : undefined}
        onKeyDown={many ? onKey : undefined}
        // Swipe left/right on touch screens.
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || !many) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(currentIndex + (dx < 0 ? 1 : -1));
        }}
      >
        <ProductPicture
          image={active}
          aspect={active.aspect ?? "portrait"}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        {many && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(currentIndex - 1)} className={`${arrow} left-4`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(currentIndex + 1)} className={`${arrow} right-4`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="absolute bottom-4 right-4 z-10 bg-ivory/85 px-3 py-1 text-xs tracking-wide2 text-charcoal backdrop-blur" aria-live="polite">
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>
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
