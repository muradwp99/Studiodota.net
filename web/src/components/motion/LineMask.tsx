"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { onSiteLoaded } from "@/lib/motion";

/**
 * largo.studio's exact title treatment — words rise out of overflow-hidden
 * masks (.outer > .inner), staggered, on their signature easing. Split at
 * render from plain text (deterministic → hydration-safe).
 *
 * trigger="view"  → plays when scrolled into view (default)
 * trigger="load"  → plays when the Preloader exits (hero headlines)
 */
export default function LineMask({
  text,
  tag = "h2",
  className,
  style,
  stagger = 0.055,
  delay = 0,
  trigger = "view",
}: {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delay?: number;
  trigger?: "view" | "load";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-lm-word]");
    if (!words.length) return;

    gsap.set(words, { yPercent: 115 });
    const vars = {
      yPercent: 0,
      duration: 0.95,
      ease: "expo.out" as const, // closest GSAP curve to largo's cubic-bezier(.37,.16,.12,1)
      stagger,
      delay,
    };

    let tween: gsap.core.Tween | null = null;
    let cleanupLoaded: (() => void) | null = null;

    if (trigger === "load") {
      cleanupLoaded = onSiteLoaded(() => {
        tween = gsap.to(words, vars);
      });
    } else {
      // Defer the ScrollTrigger until the preloader lifts, so above-the-fold
      // titles play as the cover rises instead of finishing behind it.
      cleanupLoaded = onSiteLoaded(() => {
        gsap.registerPlugin(ScrollTrigger);
        tween = gsap.to(words, {
          ...vars,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    }

    return () => {
      cleanupLoaded?.();
      tween?.scrollTrigger?.kill();
      tween?.kill();
      gsap.set(words, { clearProps: "all" });
    };
  }, [reduced, stagger, delay, trigger, text]);

  const words = text.split(/\s+/).filter(Boolean);
  const Tag = tag as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 ? " " : null}
          {/* padding absorbs descenders/italic overhang that the mask would clip */}
          <span className="inline-flex overflow-hidden py-[0.08em] -my-[0.08em] align-bottom">
            <span data-lm-word aria-hidden="true" className="inline-block will-change-transform">
              {w}
            </span>
          </span>
        </span>
      ))}
    </Tag>
  );
}
