"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Light, architectural geometric backdrop: a drifting blueprint grid, a few
 * slowly-rotating wireframe shapes, and a cursor-following highlight. Purely
 * decorative (pointer-events-none) so content stays interactive. All motion is
 * disabled under reduced motion via the CSS `.geo-*` rules.
 */
export default function GeometricBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    const el = ref.current;
    const parent = el.parentElement;
    if (!parent) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = parent.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    };
    parent.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <div ref={ref} className={`geo-bg pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="geo-grid absolute inset-0" />
      <div className="geo-spot absolute inset-0" />
      <svg className="geo-lines absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
        <circle className="geo-shape geo-shape-1" cx="240" cy="180" r="120" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.4" />
        <rect className="geo-shape geo-shape-2" x="820" y="120" width="200" height="200" stroke="var(--blueprint)" strokeWidth="1" strokeOpacity="0.4" />
        <polygon className="geo-shape geo-shape-3" points="1000,470 1090,470 1045,390" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.35" />
        <line className="geo-shape geo-shape-2" x1="120" y1="470" x2="360" y2="470" stroke="var(--blueprint)" strokeWidth="1" strokeOpacity="0.35" />
      </svg>
    </div>
  );
}
