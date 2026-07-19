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

/**
 * Scroll-linked horizontal drift. The wrapper clips; an over-wide inner track
 * (all children in a flex row) glides horizontally as the section passes
 * through the viewport — `direction="left"` reveals first→last, `direction="right"`
 * reveals last→first (the mirror image). Travel equals the track's overflow, so
 * the row always covers the wrapper (no empty gaps). Static under reduced motion,
 * where the row is horizontally scrollable instead so every card stays reachable.
 */
export function ParallaxX({
  children,
  className = "",
  trackClassName = "",
  direction = "left",
}: {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  direction?: "left" | "right";
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !wrap.current || !track.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const wrapEl = wrap.current;
    const trackEl = track.current;

    // Applied position = scroll-drift (baseX) + manual drag (dragX), clamped to
    // the track's overflow so cards always stay in range. A rAF lerp smooths both.
    let overflow = 0;
    let baseX = 0;
    let dragX = 0;
    let applied = 0;
    let dragging = false;
    let moved = 0;
    let startPointer = 0;
    let startDragX = 0;
    let raf = 0;
    let st: ScrollTrigger | null = null;

    const clampSum = () => Math.max(-overflow, Math.min(0, baseX + dragX));

    const measure = () => {
      overflow = Math.max(0, trackEl.scrollWidth - wrapEl.clientWidth);
      dragX = Math.min(-baseX, Math.max(-overflow - baseX, dragX)); // keep base+drag in range
    };

    const setup = () => {
      st?.kill();
      st = ScrollTrigger.create({
        trigger: wrapEl,
        start: "top bottom",
        end: "bottom top",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          baseX = direction === "left" ? -overflow * self.progress : -overflow * (1 - self.progress);
        },
        onRefresh: () => {
          measure();
          const p = st ? st.progress : 0;
          baseX = direction === "left" ? -overflow * p : -overflow * (1 - p);
        },
      });
      measure();
      const p = st.progress || 0;
      baseX = direction === "left" ? -overflow * p : -overflow * (1 - p);
      applied = clampSum();
    };

    const tick = () => {
      const target = clampSum();
      applied += (target - applied) * 0.14;
      if (Math.abs(target - applied) < 0.1) applied = target;
      trackEl.style.transform = `translate3d(${applied}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      startPointer = e.clientX;
      startDragX = dragX;
      try { trackEl.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
      wrapEl.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = e.clientX - startPointer;
      if (Math.abs(delta) > moved) moved = Math.abs(delta);
      dragX = Math.min(-baseX, Math.max(-overflow - baseX, startDragX + delta));
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      wrapEl.style.cursor = "grab";
      try { trackEl.releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
    };
    // A real drag shouldn't also fire a card's link click.
    const onClickCapture = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    };

    setup();
    tick();
    wrapEl.style.cursor = "grab";
    trackEl.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    trackEl.addEventListener("click", onClickCapture, true);
    window.addEventListener("resize", setup);

    return () => {
      cancelAnimationFrame(raf);
      st?.kill();
      trackEl.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      trackEl.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("resize", setup);
    };
  }, [reduced, direction]);

  return (
    <div
      ref={wrap}
      className={`${reduced ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "cursor-grab select-none overflow-hidden"} ${className}`}
      style={reduced ? undefined : { touchAction: "pan-y" }}
    >
      <div ref={track} className={`flex w-max will-change-transform ${trackClassName}`}>
        {children}
      </div>
    </div>
  );
}
