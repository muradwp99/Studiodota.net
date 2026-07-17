"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Parallax cover image. The outer element clips; an over-sized inner layer
 * drifts vertically as the section passes through the viewport, so no edges
 * are ever revealed. Falls back to a static, correctly-cropped image when the
 * user prefers reduced motion.
 */
export function ParallaxImage({
  src,
  alt,
  sizes,
  priority,
  range = 9,
  className = "",
  overlayClassName,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** drift strength as a % of the image height (each direction) */
  range?: number;
  className?: string;
  overlayClassName?: string;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !inner.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const el = inner.current;
    const tween = gsap.fromTo(
      el,
      { yPercent: -range },
      {
        yPercent: range,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
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
  }, [reduced, range]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={inner} className="absolute inset-x-0" style={{ top: "-14%", height: "128%" }}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />}
    </div>
  );
}

/**
 * Generic vertical parallax drift for any element (floating cards, layered
 * images, decorative marks). Translated in px; no clipping. Static under
 * reduced motion.
 */
export function Parallax({
  children,
  className = "",
  amount = 28,
}: {
  children: ReactNode;
  className?: string;
  /** total travel in px across the scroll range */
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    const tween = gsap.fromTo(
      el,
      { y: amount / 2 },
      {
        y: -amount / 2,
        ease: "none",
        scrollTrigger: {
          trigger: el,
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
  }, [reduced, amount]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
