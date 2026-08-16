"use client";

import { useEffect, useRef, useState } from "react";

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

/** Counts up from 0 to `end` once the span scrolls into view. */
export default function CountUp({ end, prefix = "", suffix = "", duration = 1600 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          setVal(end * easeOut(p));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);
  const display = end % 1 === 0 ? Math.round(val) : val.toFixed(1);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}
