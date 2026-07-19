"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { BlockData } from "@/content/defaults";

/**
 * Scroll-scrub hero. A tall track holds a sticky, full-viewport canvas; as the
 * page scrolls through the track, ScrollTrigger maps progress → frame index and
 * the frame is drawn to the canvas (cover-fit, DPR-aware). Frames are preloaded
 * progressively so the first paint is fast. Reduced-motion users get a single
 * static frame with no scrubbing. Headline/lede/CTA stay CMS-editable via `d`.
 *
 * Frames are produced by scripts/build-hero-frames.mjs — keep FRAME_COUNT in sync.
 */

const FRAME_COUNT = 300; // must match scripts/build-hero-frames.mjs TARGET
const PIN_SCREENS = 2.5; // viewport-heights the hero holds while scrubbing
const frameSrc = (i: number) => `/media/hero-seq/frame-${String(i).padStart(3, "0")}.webp`;

export default function HeroScrub({ d }: { d: BlockData["home.hero"] }) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const drawnRef = useRef<number>(-1);
  const [progress, setProgress] = useState(0); // preload progress 0..1

  // Draw frame `i` (cover-fit). If it isn't loaded yet, draw the nearest loaded
  // frame so the canvas never flashes blank while preloading catches up.
  const draw = (i: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let idx = i;
    if (!loadedRef.current[idx]) {
      let found = -1;
      for (let lo = i, hi = i; lo >= 0 || hi < FRAME_COUNT; lo--, hi++) {
        if (lo >= 0 && loadedRef.current[lo]) { found = lo; break; }
        if (hi < FRAME_COUNT && loadedRef.current[hi]) { found = hi; break; }
      }
      if (found === -1) return;
      idx = found;
    }
    const img = imagesRef.current[idx];
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawnRef.current = i;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw(drawnRef.current < 0 ? 0 : drawnRef.current);
  };

  // Preload frames (frame 0 kicks off first paint as soon as it arrives).
  useEffect(() => {
    let cancelled = false;
    let count = 0;
    loadedRef.current = new Array(FRAME_COUNT).fill(false);
    imagesRef.current = new Array(FRAME_COUNT);

    const onDone = (i: number) => {
      if (cancelled) return;
      loadedRef.current[i] = true;
      count += 1;
      setProgress(count / FRAME_COUNT);
      // Draw if this is the frame we currently want (or the very first frame).
      if (i === 0 && drawnRef.current < 0) { resizeCanvas(); draw(0); }
      else if (i === drawnRef.current) draw(i);
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => onDone(i);
      img.onerror = () => onDone(i); // still count, so progress can complete
      img.src = frameSrc(i);
      imagesRef.current[i] = img;
    }
    return () => { cancelled = true; };
  }, []);

  // Scroll scrub (skipped entirely for reduced motion).
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (reduced) {
      draw(0);
      return () => window.removeEventListener("resize", resizeCanvas);
    }

    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: trackRef.current!,
      start: "top top",
      end: () => "+=" + window.innerHeight * PIN_SCREENS,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const i = Math.min(FRAME_COUNT - 1, Math.round(self.progress * (FRAME_COUNT - 1)));
        if (i !== drawnRef.current) draw(i);
      },
    });
    return () => {
      st.kill();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [reduced]);

  return (
    <section
      ref={trackRef}
      className="relative w-full"
      style={{ height: reduced ? "100dvh" : `${(1 + PIN_SCREENS) * 100}dvh` }}
    >
      <div
        ref={stickyRef}
        data-nav-tone="dark"
        className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#0b0b0c]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* scrim — weighted to the bottom so the footage leads and the lower lockup stays legible */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(11,11,12,0.9) 0%, rgba(11,11,12,0.5) 24%, rgba(11,11,12,0.08) 50%, rgba(11,11,12,0) 66%)",
          }}
        />

        {/* headline lockup — bottom-anchored + restrained so the footage stays the hero */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="shell w-full pb-16 md:pb-20" style={{ color: "var(--on-media)" }}>
            <h1
              className="max-w-[18ch] font-light leading-[1.03] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2.1rem, 5vw, 4.25rem)" }}
            >
              <span className="grad-text-media font-extrabold">{d.titleAccent}</span>{" "}
              {d.titleRestLine1} {d.titleRestLine2}
            </h1>
            <div className="mt-7 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-[46ch] leading-relaxed" style={{ color: "var(--on-media-dim)" }}>
                {d.lede}
              </p>
              <Link
                href={d.ctaHref || "/projects"}
                className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[var(--gold)] px-7 py-3.5 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-[#17191c] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.03] hover:bg-[var(--gold-hi)]"
              >
                {d.ctaLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* scroll cue — vertical on the right edge, clear of the footage and the lockup */}
        <div
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 sm:block"
          style={{ color: "var(--on-media-dim)" }}
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.35em] [writing-mode:vertical-rl]">
            Scroll
          </span>
        </div>

        {/* preload indicator — only while the opening frames are still arriving */}
        {progress < 0.12 && (
          <div
            className="pointer-events-none absolute bottom-6 right-6 font-mono text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ color: "var(--on-media-dim)" }}
          >
            Loading {Math.round(progress * 100)}%
          </div>
        )}
      </div>
    </section>
  );
}
