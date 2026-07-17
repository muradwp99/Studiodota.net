"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Big display text with an image showing through the letterforms
 * (background-clip: text). The image drifts vertically inside the mask on
 * scroll for a subtle parallax. Static under reduced motion.
 */
export default function ImageMaskText({
  text,
  image,
  className = "",
}: {
  text: string;
  image: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.fromTo(
      ref.current,
      { backgroundPositionY: "20%" },
      {
        backgroundPositionY: "80%",
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center 50%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
    >
      {text}
    </span>
  );
}
