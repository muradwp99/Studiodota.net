"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Exit counterpart to this page's entrance reveals: as a section's bottom
 * edge nears the top of the viewport - i.e. it's scrolling past and out -
 * its content recedes: fades, shrinks slightly, drifts up. Transform/opacity
 * only, so it never touches layout (safe alongside the grid-stretch math the
 * phase sections rely on for the ghost numeral). Page-local, not a shared
 * primitive: this is a one-off scroll-scrub, not a reusable API.
 */
export default function ScrollExit({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.to(el, {
      opacity: 0.3,
      scale: 0.93,
      yPercent: -5,
      ease: "none",
      scrollTrigger: { trigger: el, start: "bottom 70%", end: "bottom 8%", scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(el, { clearProps: "all" });
    };
  }, [reduced]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
