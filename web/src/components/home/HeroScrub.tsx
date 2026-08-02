"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { onSiteLoaded } from "@/lib/motion";
import type { BlockData } from "@/content/defaults";

/**
 * Scroll-scrub hero. A tall track holds a sticky, full-viewport canvas; as the
 * page scrolls through the track, ScrollTrigger maps progress → frame index and
 * the frame is drawn to the canvas (cover-fit, DPR-aware). Only the first
 * EAGER_FRAMES load up front; the rest load on demand as the scrub position
 * approaches them, so a visitor who never scrolls past the hero doesn't pay
 * for the full sequence. Reduced-motion users get one static frame. Mobile
 * viewports load a lighter, lower-res sequence. Headline/lede/CTA stay
 * CMS-editable via `d`.
 *
 * Frames are produced by scripts/build-hero-frames.mjs — keep the counts in sync.
 */

// The `-v2` suffix is a cache-bust, not decoration: these are served
// `immutable`, and the previous sequence shipped without any Cache-Control at
// all, so CDN edges and browsers are still holding the old frames under the
// unsuffixed paths. Re-encoding under the same names served a mix of old and
// new. Any future re-encode needs a fresh suffix here, in next.config.ts, and
// in scripts/build-hero-frames.mjs.
const SEQ_DESKTOP = { base: "/media/hero-seq-v2", count: 300 };
const SEQ_MOBILE = { base: "/media/hero-seq-mobile-v2", count: 150 };
const PIN_SCREENS = 2.5; // viewport-heights the hero holds while scrubbing
const MAX_INFLIGHT = 6; // concurrent frame fetches — see the loader below
const WINDOW_AHEAD = 48; // frames kept loaded ahead of the scrub position
const WINDOW_BEHIND = 8; // ...and behind it, for scrubbing back up

export default function HeroScrub({ d }: { d: BlockData["home.hero"] }) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const cancelledRef = useRef(false);
  const drawnRef = useRef<number>(-1);
  const seqRef = useRef(SEQ_DESKTOP);
  const wantedRef = useRef(0); // frame the scrub currently needs
  const pumpRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false); // first frame painted

  // Draw frame `i` (cover-fit). If it isn't loaded yet, draw the nearest loaded
  // frame so the canvas never flashes blank while preloading catches up.
  const draw = useCallback((i: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const count = seqRef.current.count;

    let idx = i;
    if (!loadedRef.current[idx]) {
      let found = -1;
      for (let lo = i, hi = i; lo >= 0 || hi < count; lo--, hi++) {
        if (lo >= 0 && loadedRef.current[lo]) { found = lo; break; }
        if (hi < count && loadedRef.current[hi]) { found = hi; break; }
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
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw(drawnRef.current < 0 ? 0 : drawnRef.current);
  }, [draw]);

  // Frame loading. Two rules, and both matter:
  //
  //   1. At most MAX_INFLIGHT requests are ever outstanding. The previous
  //      version fired requests and forgot about them, so an idle back-fill
  //      queued the whole sequence from index 0 upward and the frames actually
  //      being scrubbed past sat behind a couple hundred pending low-priority
  //      requests. Measured on production: loading dead-stalled at 67 frames
  //      and the canvas painted identical pixels from 60% scroll to the end.
  //   2. Every freed slot goes to the unloaded frame nearest whatever the
  //      scrub needs *right now*, so jumping ahead re-prioritises instead of
  //      waiting out a queue. Worst case the next frame needed is MAX_INFLIGHT
  //      requests deep, not 200.
  //
  // A window around the scrub position bounds total weight, so a visitor who
  // never scrolls pays for WINDOW_AHEAD frames rather than the whole sequence.
  useEffect(() => {
    cancelledRef.current = false;
    seqRef.current = window.matchMedia("(max-width: 767px)").matches ? SEQ_MOBILE : SEQ_DESKTOP;
    const { base, count } = seqRef.current;
    loadedRef.current = new Array(count).fill(false);
    imagesRef.current = new Array(count);
    wantedRef.current = 0;
    let inflight = 0;

    // Nearest unloaded frame inside the window, preferring ahead of the scrub.
    // Linear, but it is a few hundred array reads next to a ~200KB image
    // decode — not worth a cleverer structure.
    const nextFrame = () => {
      const w = wantedRef.current;
      for (let i = w; i < Math.min(count, w + WINDOW_AHEAD); i++) {
        if (!imagesRef.current[i]) return i;
      }
      for (let i = w - 1; i >= Math.max(0, w - WINDOW_BEHIND); i--) {
        if (!imagesRef.current[i]) return i;
      }
      return -1; // window satisfied; the scrub effect re-kicks us when it moves
    };

    const pump = () => {
      if (cancelledRef.current) return;
      while (inflight < MAX_INFLIGHT) {
        const i = nextFrame();
        if (i < 0) return;
        const img = new Image();
        imagesRef.current[i] = img; // claim the slot before the request starts
        inflight++;
        img.decoding = "async";
        // Only the opening frames are urgent; let the browser deprioritise the
        // rest behind the page's own critical JS/CSS/fonts.
        img.fetchPriority = i < 4 ? "high" : "low";
        const onSettle = () => {
          if (cancelledRef.current) return;
          inflight--;
          loadedRef.current[i] = true;
          if (drawnRef.current < 0) {
            resizeCanvas();
            draw(i);
            setReady(true);
          } else if (i === drawnRef.current) {
            draw(i); // upgrade from whatever nearest-loaded frame stood in
          }
          pump();
        };
        img.onload = onSettle;
        img.onerror = onSettle; // free the slot regardless, or loading stalls
        img.src = `${base}/frame-${String(i).padStart(3, "0")}.webp`;
      }
    };

    pumpRef.current = pump;
    pump();

    return () => {
      cancelledRef.current = true;
    };
  }, [draw, resizeCanvas]);

  // Hero intro — released by the Preloader's exit: the footage settles from a
  // slight over-scale while the headline rises out of line masks, then the
  // lede/CTA row and the scroll cue follow.
  useEffect(() => {
    if (reduced) return;
    const words = headRef.current?.querySelectorAll<HTMLElement>("[data-hero-word]");
    const sub = subRef.current;
    const cue = cueRef.current;
    const media = canvasRef.current;
    if (!words?.length || !sub || !media) return;
    gsap.set(words, { yPercent: 115 });
    gsap.set(sub, { autoAlpha: 0, y: 26 });
    if (cue) gsap.set(cue, { autoAlpha: 0 });
    let tl: gsap.core.Timeline | null = null;
    const cleanup = onSiteLoaded(() => {
      tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(media, { scale: 1.055 }, { scale: 1, duration: 2.1, ease: "expo.out" }, 0);
      tl.to(words, { yPercent: 0, duration: 0.95, ease: "expo.out", stagger: 0.06 }, 0.15);
      tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, "-=0.55");
      if (cue) tl.to(cue, { autoAlpha: 1, duration: 0.7, ease: "power2.out" }, "-=0.35");
    });
    return () => {
      cleanup();
      tl?.kill();
      gsap.set([...words, sub, media, ...(cue ? [cue] : [])], { clearProps: "all" });
    };
  }, [reduced]);

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
        const count = seqRef.current.count;
        const i = Math.min(count - 1, Math.round(self.progress * (count - 1)));
        if (i !== drawnRef.current) draw(i);
        // Re-aim the loader. Cheap when every slot is busy, and it restarts the
        // pump once the window has moved past what's already loaded.
        wantedRef.current = i;
        pumpRef.current();
      },
    });
    return () => {
      st.kill();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [reduced, draw, resizeCanvas]);

  return (
    <section
      ref={trackRef}
      className="relative w-full"
      style={{ height: reduced ? "100dvh" : `${(1 + PIN_SCREENS) * 100}dvh` }}
    >
      <div
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
              ref={headRef}
              className="max-w-[18ch] font-light leading-[1.03] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2.1rem, 5vw, 4.25rem)" }}
              aria-label={`${d.titleAccent} ${d.titleRestLine1} ${d.titleRestLine2}`}
            >
              {[
                ...d.titleAccent.split(/\s+/).filter(Boolean).map((w) => ({ w, accent: true })),
                ...`${d.titleRestLine1} ${d.titleRestLine2}`.split(/\s+/).filter(Boolean).map((w) => ({ w, accent: false })),
              ].map(({ w, accent }, i) => (
                <span key={i}>
                  {i > 0 ? " " : null}
                  <span className="inline-flex overflow-hidden py-[0.06em] -my-[0.06em] align-bottom">
                    <span data-hero-word aria-hidden="true" className={`inline-block will-change-transform ${accent ? "grad-text-media font-extrabold" : ""}`}>
                      {w}
                    </span>
                  </span>
                </span>
              ))}
            </h1>
            <div ref={subRef} className="mt-7 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
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
          ref={cueRef}
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 sm:block"
          style={{ color: "var(--on-media-dim)" }}
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.35em] [writing-mode:vertical-rl]">
            Scroll
          </span>
        </div>

        {/* preload indicator — only until the first frame lands on the canvas */}
        {!ready && (
          <div
            className="pointer-events-none absolute bottom-6 right-6 font-mono text-[0.6rem] uppercase tracking-[0.2em]"
            style={{ color: "var(--on-media-dim)" }}
          >
            Loading
          </div>
        )}
      </div>
    </section>
  );
}
