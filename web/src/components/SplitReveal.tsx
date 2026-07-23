"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * LARGO-style per-word ghost-rise reveal (traced from largo.studio: words rise
 * ~1.1em from below with a stagger — no clip mask). Words are split at render
 * time from plain text (deterministic → hydration-safe); GSAP animates them on
 * first scroll into view. Reduced motion renders static, fully visible text.
 */
export default function SplitReveal({
  text,
  tag = "h2",
  className,
  style,
  stagger = 0.06,
  delay = 0,
}: {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const words = el.querySelectorAll<HTMLElement>("[data-sr-word]");
    if (!words.length) return;
    gsap.set(words, { yPercent: 112, opacity: 0 });
    const tween = gsap.to(words, {
      yPercent: 0,
      opacity: 1,
      duration: 0.9,
      ease: "expo.out",
      stagger,
      delay,
      scrollTrigger: { trigger: el, start: "top 82%", once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(words, { clearProps: "all" });
    };
  }, [reduced, stagger, delay, text]);

  const words = text.split(/\s+/).filter(Boolean);
  // One concrete intrinsic type keeps JSX prop-checking happy across the tag union.
  const Tag = tag as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 ? " " : null}
          <span data-sr-word aria-hidden="true" className="inline-block will-change-transform">
            {w}
          </span>
        </span>
      ))}
    </Tag>
  );
}
