"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Editorial scroll-linked text reveal (FIND-style): each word fades from
 * muted to solid as the block scrolls through the viewport. Renders fully
 * solid and static under reduced motion.
 */
export default function ScrollHighlightText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const words = text.split(" ");

  useEffect(() => {
    if (reduced || !ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const spans = ref.current.querySelectorAll<HTMLElement>("[data-word]");
    gsap.set(spans, { opacity: 0.24 });
    const tween = gsap.to(spans, {
      opacity: 1,
      ease: "none",
      stagger: 0.4,
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        end: "top 40%",
        scrub: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} data-word style={reduced ? undefined : { opacity: 0.24 }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
