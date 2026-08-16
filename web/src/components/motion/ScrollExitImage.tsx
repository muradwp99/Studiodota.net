"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import ImageReveal from "@/components/motion/ImageReveal";

/**
 * Pairs ImageReveal's entry curtain-wipe with a scroll-scrubbed exit, same
 * GSAP/ScrollTrigger idiom as Parallax.tsx. The scrub range starts once the
 * image is centered (already fully revealed) and ends as it clears the top
 * of the viewport, so it dissolves/settles away as it scrolls past instead
 * of just hard-cutting off screen. Reduced motion: the wrapper still mounts
 * (so `wide` keeps working) but no scroll listener attaches.
 *
 * `wide` puts the grid-column span on THIS wrapper rather than folding it
 * into `className`: a `col-span-*` class only takes effect on an actual
 * grid item, and ImageReveal's own root renders one level deeper than that
 * (inside this wrapper), so baking `md:col-span-2` into the className handed
 * to ImageReveal would silently do nothing when this sits in a CSS grid.
 */
export default function ScrollExitImage({
  wide,
  ...props
}: ComponentProps<typeof ImageReveal> & { wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    const tween = gsap.fromTo(
      el,
      { opacity: 1, scale: 1, y: 0 },
      {
        opacity: 0,
        scale: 0.92,
        y: -32,
        ease: "none",
        scrollTrigger: { trigger: el, start: "center center", end: "bottom top", scrub: true },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <div ref={ref} className={wide ? "md:col-span-2" : undefined}>
      <ImageReveal {...props} />
    </div>
  );
}
