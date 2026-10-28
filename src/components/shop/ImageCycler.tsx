"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/types/product";
import { ProductPicture } from "@/components/ui/ProductPicture";

const HOVER_MS = 1300;
const TOUCH_MS = 2600;

/**
 * Product card photos. Cross-fades through every image on hover with a
 * mouse, or slowly while on screen on touch devices; the arrows and dots let
 * shoppers flip through by hand (which stops the automatic cycling). Shows
 * the first photo only when the visitor prefers reduced motion.
 */
export function ImageCycler({ images, sizes }: { images: ProductImage[]; sizes: string }) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const manual = useRef(false);
  const many = images.length > 1;

  function start(ms: number) {
    if (!many || timer.current || manual.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActive((i) => (i + 1) % images.length);
    timer.current = setInterval(() => setActive((i) => (i + 1) % images.length), ms);
  }

  function stop(reset: boolean) {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (reset) setActive(0);
  }

  // The card is a link: arrow/dot taps must not open the product page.
  function go(e: MouseEvent, to: number) {
    e.preventDefault();
    e.stopPropagation();
    manual.current = true;
    stop(false);
    setActive((to + images.length) % images.length);
  }

  // Touch screens have no hover: cycle while most of the card is visible.
  useEffect(() => {
    const el = ref.current;
    if (!many || !el || !window.matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start(TOUCH_MS) : stop(false)), { threshold: 0.6 });
    io.observe(el);
    return () => {
      io.disconnect();
      stop(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [many]);

  const arrow =
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/85 text-charcoal shadow-sm backdrop-blur transition-opacity duration-400 hover:bg-ivory md:opacity-0 md:group-hover:opacity-100";

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => window.matchMedia("(hover: hover)").matches && start(HOVER_MS)}
      onMouseLeave={() => {
        if (!window.matchMedia("(hover: hover)").matches) return;
        manual.current = false;
        stop(true);
      }}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          className={`${i === 0 ? "" : "absolute inset-0"} transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i === active ? undefined : true}
        >
          <ProductPicture image={i === 0 ? img : { ...img, alt: "" }} aspect="portrait" sizes={sizes} />
        </div>
      ))}

      {many && (
        <>
          <button type="button" aria-label="Previous photo" onClick={(e) => go(e, active - 1)} className={`${arrow} left-2.5`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" aria-label="Next photo" onClick={(e) => go(e, active + 1)} className={`${arrow} right-2.5`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === active ? "true" : undefined}
                onClick={(e) => go(e, i)}
                className={`h-1.5 rounded-full transition-all duration-400 ${i === active ? "w-5 bg-ivory" : "w-1.5 bg-ivory/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
