"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/types/product";
import { ProductPicture } from "@/components/ui/ProductPicture";

const HOVER_MS = 1300;
const TOUCH_MS = 2600;

/**
 * Product card photos that cross-fade through every image: on hover with a
 * mouse, or slowly while the card is on screen on touch devices. Shows the
 * first photo only when the visitor prefers reduced motion.
 */
export function ImageCycler({ images, sizes }: { images: ProductImage[]; sizes: string }) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const many = images.length > 1;

  function start(ms: number) {
    if (!many || timer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActive((i) => (i + 1) % images.length);
    timer.current = setInterval(() => setActive((i) => (i + 1) % images.length), ms);
  }

  function stop(reset: boolean) {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (reset) setActive(0);
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

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => window.matchMedia("(hover: hover)").matches && start(HOVER_MS)}
      onMouseLeave={() => window.matchMedia("(hover: hover)").matches && stop(true)}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          className={`${i === 0 ? "" : "absolute inset-0"} transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i === 0 ? undefined : true}
        >
          <ProductPicture image={i === 0 ? img : { ...img, alt: "" }} aspect="portrait" sizes={sizes} />
        </div>
      ))}
    </div>
  );
}
