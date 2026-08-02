"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Scroll-triggered text reveal, split at render time from plain text
 * (deterministic → hydration-safe) and animated on first scroll into view.
 * Reduced motion renders static, fully visible text.
 *
 * `by="word"` + `mode="rise"` (default) = LARGO-style ghost-rise, traced from
 * largo.studio: words rise ~1.1em from below with a stagger, no clip mask.
 * `by="letter"` + `mode="fade"` = per-letter dim-to-full opacity reveal, no
 * movement. Words still wrap as a whole (each word is one inline-block box)
 * so line-breaking is unaffected by the per-letter split.
 */
export default function SplitReveal({
  text,
  tag = "h2",
  className,
  style,
  by = "word",
  mode = "rise",
  stagger,
  delay = 0,
}: {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
  style?: React.CSSProperties;
  by?: "word" | "letter";
  mode?: "rise" | "fade";
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const effectiveStagger = stagger ?? (by === "letter" ? 0.02 : 0.06);

  useLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const units = el.querySelectorAll<HTMLElement>("[data-sr-unit]");
    if (!units.length) return;
    const scrollTrigger = { trigger: el, start: "top 82%", once: true } as const;
    let tween: gsap.core.Tween;
    if (mode === "fade") {
      gsap.set(units, { opacity: 0.15 });
      tween = gsap.to(units, { opacity: 1, duration: 0.5, ease: "power1.out", stagger: effectiveStagger, delay, scrollTrigger });
    } else {
      gsap.set(units, { yPercent: 112, opacity: 0 });
      tween = gsap.to(units, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: effectiveStagger, delay, scrollTrigger });
    }
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(units, { clearProps: "all" });
    };
  }, [reduced, effectiveStagger, delay, text, by, mode]);

  const words = text.split(/\s+/).filter(Boolean);
  // One concrete intrinsic type keeps JSX prop-checking happy across the tag union.
  const Tag = tag as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          {by === "letter" ? (
            <span className="inline-block">
              {[...w].map((ch, ci) => (
                <span key={ci} data-sr-unit aria-hidden="true" className="inline-block will-change-[opacity]">
                  {ch}
                </span>
              ))}
            </span>
          ) : (
            <span data-sr-unit aria-hidden="true" className="inline-block will-change-transform">
              {w}
            </span>
          )}
        </Fragment>
      ))}
    </Tag>
  );
}
