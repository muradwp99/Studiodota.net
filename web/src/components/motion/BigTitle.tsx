"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useHeaderReveal } from "@/lib/useHeaderReveal";

/**
 * The page-name treatment: one giant word, sliding in from off-screen left.
 * Gated behind useHeaderReveal() so it never starts - or finishes - while
 * still hidden behind the Preloader/PageTransition cover panel.
 */
export default function BigTitle({
  text,
  tag = "h1",
  className = "",
  style,
}: {
  text: string;
  tag?: "h1" | "h2" | "div";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const ready = useHeaderReveal();

  useLayoutEffect(() => {
    if (reduced || !ready) return;
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { xPercent: -60, opacity: 0 });
    const tween = gsap.to(el, { xPercent: 0, opacity: 1, duration: 1.1, ease: "expo.out" });
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "all" });
    };
  }, [reduced, ready, text]);

  const Tag = tag as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={`display-huge ${className}`} style={style}>
      {text}
    </Tag>
  );
}
