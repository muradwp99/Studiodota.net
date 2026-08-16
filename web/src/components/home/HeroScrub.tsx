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
 *
 * Two more ScrollTriggers ride alongside the scrub, both reduced-motion gated:
 * the headline keeps swelling as frames advance (an independent trigger over
 * the same range - it never touches the scrub/loader logic below), and once
 * the sticky panel reaches its release stretch (the container's trailing "+1"
 * screen), the lockup sinks/fades and a scrim fades the hero to the brand
 * dark, so the handoff to the next section reads as a deliberate exit.
 */

// The `-v2` suffix is a cache-bust, not decoration: these are served
// `immutable`, and the previous sequence shipped without any Cache-Control at
// all, so CDN edges and browsers are still holding the old frames under the
// unsuffixed paths. Re-encoding under the same names served a mix of old and
// new. Any future re-encode needs a fresh suffix here, in next.config.ts, and
// in scripts/build-hero-frames.mjs.
// `width` is the encoded pixel width of these frames - keep it in sync with
// VARIANTS in scripts/build-hero-frames.mjs. resizeCanvas uses it as the cap on
// the canvas backing store.
// v4: the studio's own Ball Residence render animation (Hero_Video/FINAL_4K.mp4,
// 4K/60fps/16.7s), sampled linearly to 300 frames. Linear rather than
// motion-equalised on purpose: the edit contains two hard cuts at 5.5s and
// 11.1s, and equalising would spend frames on those cuts and fight the
// animator's pacing, which is already slow and even between them.
// v5 raises the desktop frames from 1280px to 1600px. 1280 was chosen when the
// source was generated footage and the binding constraint was decode time; with
// a real 4K render behind it, 1280 was visibly soft because `width` also caps
// the canvas backing store, so the frame was being upscaled on any wide or
// retina display. Measured on this footage, sharpness at a 1600px viewing size:
//
//     1280px -> 13.3     1600px -> 15.1     1760px -> 11.7 (downscaled again)
//
// and webp quality barely moves it (q72 -> q90 went 13.31 -> 13.34 for 3x the
// bytes), which is why this is a resolution change and not a quality one.
const SEQ_DESKTOP = { base: "/media/hero-seq-v5", count: 300, width: 1600 };
const SEQ_MOBILE = { base: "/media/hero-seq-mobile-v5", count: 150, width: 1080 };
const PIN_SCREENS = 2.5; // viewport-heights the hero holds while scrubbing
// 6 matches the per-origin connection limit browsers apply on HTTP/1.1, which
// is what `next start` speaks. Going above it queues requests at the socket
// layer where this code cannot see or recover them.
const MAX_INFLIGHT = 6; // concurrent frame fetches — see the loader below
// A detached Image() request can wedge and fire neither onload nor onerror,
// holding its slot forever. Observed on a local production build: loading
// dead-stopped with exactly MAX_INFLIGHT frames hung, while the same files
// returned 200 in ~1ms via fetch(). The watchdog is what makes the loader
// self-healing rather than one bad socket away from a frozen hero.
const FRAME_TIMEOUT_MS = 10_000;
const MAX_TRIES = 2;
// Live Image() objects the loader will hold, centred on the scrub position.
//
// Holding the WHOLE 300-frame sequence does not work: measured repeatedly on a
// local production build, loading races to ~215-226 frames in about 3 seconds
// and then stops dead - permanently, with the watchdog unable to recover it -
// while the very same files still return 200 in ~1ms via fetch(). That is a
// browser ceiling on concurrent live image objects, and v1's "preload all 300"
// hit it too; it only ever felt complete because nothing measured it.
//
// A window stays well under the ceiling and never wedges. It costs a re-fetch
// when scrubbing somewhere far away, which is free once the `immutable`
// headers on /media are actually live - on production today they are not,
// which is why the window felt network-bound there.
const WINDOW_AHEAD = 96;
const WINDOW_BEHIND = 24;
// How hard GSAP smooths the scrub. Higher = the footage eases toward the
// scroll position instead of tracking it rigidly, which is what reads as
// "gentle". Above ~1.5 it starts to feel disconnected from the wheel.
const SCRUB_SMOOTHING = 1.2;

export default function HeroScrub({ d }: { d: BlockData["home.hero"] }) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const exitScrimRef = useRef<HTMLDivElement>(null);
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
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;

    // Cap the backing store at the source frame's own width.
    //
    // drawImage's cost scales with the DESTINATION area, and the frames are
    // only 1280px wide. Sizing the canvas at cssWidth x devicePixelRatio means
    // a 2x display gets a ~2880px backing store: five times the pixels to
    // rasterise every scrub tick, entirely spent upscaling a 1280px source.
    // There is no detail to recover, so it is pure cost - and it is invisible
    // in testing at dpr 1, which is why the scrub measured fine locally while
    // still feeling laggy on a retina screen.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(dpr, seqRef.current.width / cssW);
    canvas.width = Math.max(1, Math.round(cssW * scale));
    canvas.height = Math.max(1, Math.round(cssH * scale));
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
  // The WHOLE sequence loads, not a rolling window. A window looked like the
  // responsible choice, but it made the scrub feel worse than the original
  // build: measured on production, only the 48 windowed frames were ever
  // resident and every one came off the network mid-scroll, so scrubbing was
  // network-bound. The original preloaded all 300 up front, which is exactly
  // why it felt smooth - it was just paying 57MB for the privilege. At
  // 1280px/q72 the sequence is 13.7MB, so loading all of it is affordable, and
  // the two rules above keep it from starving the frames being scrubbed past.
  useEffect(() => {
    cancelledRef.current = false;
    seqRef.current = window.matchMedia("(max-width: 767px)").matches ? SEQ_MOBILE : SEQ_DESKTOP;
    const { base, count } = seqRef.current;
    loadedRef.current = new Array(count).fill(false);
    imagesRef.current = new Array(count);
    wantedRef.current = 0;
    let inflight = 0;
    const tries = new Array<number>(count).fill(0);
    const retry: number[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Nearest unloaded frame, preferring ahead of the scrub position: frames
    // about to be drawn win slots, then everything else back-fills. Linear,
    // but a few hundred array reads is nothing next to an image decode.
    const nextFrame = () => {
      const w = wantedRef.current;
      const hi = Math.min(count, w + WINDOW_AHEAD);
      const lo = Math.max(0, w - WINDOW_BEHIND);
      for (let i = w; i < hi; i++) if (!imagesRef.current[i]) return i;
      for (let i = w - 1; i >= lo; i--) if (!imagesRef.current[i]) return i;
      // Everything has been attempted once — now re-attempt whatever timed out.
      while (retry.length) {
        const i = retry.shift() as number;
        if (!loadedRef.current[i]) {
          imagesRef.current[i] = undefined as unknown as HTMLImageElement;
          return i;
        }
      }
      return -1; // whole sequence resident
    };

    // `pumping` makes this non-re-entrant, and it is load-bearing: an image
    // already in the browser cache fires onload SYNCHRONOUSLY from the
    // `img.src = ...` assignment below, so onSettle -> pump() would re-enter
    // while the outer loop is mid-iteration. That nested call raced the loop's
    // own accounting and wedged loading at frame 189 of 300 - the sequence
    // simply stopped, with 110 frames never requested.
    let pumping = false;
    const pump = () => {
      if (cancelledRef.current || pumping) return;
      pumping = true;
      try {
        fill();
      } finally {
        pumping = false; // never leave the pump wedged, even on a throw
      }
    };

    const fill = () => {
      while (inflight < MAX_INFLIGHT) {
        const i = nextFrame();
        if (i < 0) return; // whole sequence claimed
        const img = new Image();
        imagesRef.current[i] = img; // claim the slot before the request starts
        inflight++;
        img.decoding = "async";
        // Opening frames are urgent so the hero paints; the rest stay at the
        // browser default. Explicitly marking them "low" starved the sequence
        // - it took ~14s to reach 190 frames locally - and a resident sequence
        // is the whole reason the scrub feels smooth. Images already rank below
        // render-blocking CSS/JS without being pinned to the bottom.
        if (i < 8) img.fetchPriority = "high";

        let done = false;
        // Declared before `settle` closes over it: a cached image can fire
        // onload synchronously, and reading `timer` in its TDZ would throw
        // straight out of the loop.
        let timer: ReturnType<typeof setTimeout> | undefined = undefined;
        const settle = (ok: boolean) => {
          if (done) return; // onload/onerror and the watchdog can all fire
          done = true;
          clearTimeout(timer);
          if (cancelledRef.current) return;
          inflight--;
          if (ok) {
            loadedRef.current[i] = true;
            if (drawnRef.current < 0) {
              resizeCanvas();
              draw(i);
              setReady(true);
            } else if (i === drawnRef.current) {
              draw(i); // upgrade from whatever nearest-loaded frame stood in
            }
          } else if (tries[i] < MAX_TRIES) {
            // Queue for retry but keep the claim, so the pump moves on to
            // never-tried frames first. Releasing it here would just re-request
            // the frame that only just wedged and stall again.
            retry.push(i);
          }
          pump();
        };
        timer = setTimeout(() => settle(false), FRAME_TIMEOUT_MS);
        timers.push(timer);

        tries[i] = (tries[i] ?? 0) + 1;
        img.onload = () => settle(true);
        img.onerror = () => settle(false);
        img.src = `${base}/frame-${String(i).padStart(3, "0")}.webp`;
      }
    };

    pumpRef.current = pump;
    pump();

    return () => {
      cancelledRef.current = true;
      for (const t of timers) clearTimeout(t);
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

  // Size the canvas from a ResizeObserver rather than a window resize listener.
  // resizeCanvas needs the element's laid-out size, and on mount that can still
  // be 0 - a background tab, or a hero that has not been laid out yet. A window
  // listener never fires for that, so the canvas would keep its default 300x150
  // and the footage would render stretched. The observer fires as soon as the
  // element gets a real size, and covers viewport resizes too.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvas);
    resizeCanvas();
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // Scroll scrub (skipped entirely for reduced motion).
  useEffect(() => {
    if (reduced) {
      draw(0);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: trackRef.current!,
      start: "top top",
      end: () => "+=" + window.innerHeight * PIN_SCREENS,
      scrub: SCRUB_SMOOTHING,
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
    };
  }, [reduced, draw]);

  // Scroll-scrubbed headline growth — an independent ScrollTrigger over the
  // same trigger/start/end as the scrub above (never touches that effect),
  // so the giant word keeps swelling as frames advance instead of sitting
  // inert after its mount entrance. Targets the <h1> itself, never the
  // [data-hero-word] spans the entrance timeline owns, so the two never
  // fight over a property on the same element.
  useEffect(() => {
    if (reduced) return;
    const head = headRef.current;
    if (!head) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(head, { transformOrigin: "0% 100%" });
    const tween = gsap.fromTo(
      head,
      { scale: 1 },
      {
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: trackRef.current!,
          start: "top top",
          end: () => "+=" + window.innerHeight * PIN_SCREENS,
          scrub: SCRUB_SMOOTHING,
        },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(head, { clearProps: "all" });
    };
  }, [reduced]);

  // Exit choreography for the release stretch. The container's trailing "+1"
  // screen (see PIN_SCREENS above) is exactly the distance the sticky panel
  // takes to un-stick once the scrub has reached its last frame, so
  // "bottom bottom" -> "bottom top" brackets that stretch with stock
  // ScrollTrigger markers — no manual pixel math needed. The lockup sinks and
  // dissolves while a flat scrim fades the hero to the brand dark, so the
  // handoff to whatever follows reads as a deliberate cut rather than the pin
  // just snapping loose. Deliberately leaves the canvas and the "Scroll" cue
  // alone — both are still owned by the entrance timeline if this range is
  // somehow reached before it settles, and a second tween grabbing the same
  // property would fight it; the scrim (painted last, above everything) hides
  // the cue for free as it fades in.
  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    const lockup = lockupRef.current;
    const scrim = exitScrimRef.current;
    if (!track || !lockup || !scrim) return;
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: track, start: "bottom bottom", end: "bottom top", scrub: true },
    });
    tl.to(lockup, { autoAlpha: 0, y: 40, duration: 0.6, ease: "none" }, 0.05);
    tl.to(scrim, { autoAlpha: 0.94, duration: 0.7, ease: "none" }, 0.15);
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set([lockup, scrim], { clearProps: "all" });
    };
  }, [reduced]);

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

        {/* Scrim, in three layers.
            The bottom gradient carries the headline lockup and already measured
            13.7-15.5:1 over this footage. The TOP gradient is the one that was
            missing: the scrim used to be bottom-only, so the navbar sat directly
            on the footage and dropped to 1.36:1 against a bright sky frame -
            far under the 4.5:1 floor. The flat base tint takes the brightest
            frames down a touch without flattening the render. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(11,11,12,0.62) 0%, rgba(11,11,12,0.30) 14%, rgba(11,11,12,0) 34%)",
              "linear-gradient(to top, rgba(11,11,12,0.92) 0%, rgba(11,11,12,0.58) 24%, rgba(11,11,12,0.14) 50%, rgba(11,11,12,0) 66%)",
              "rgba(11,11,12,0.14)",
            ].join(","),
          }}
        />

        {/* headline lockup — bottom-anchored + restrained so the footage stays the hero */}
        <div className="absolute inset-x-0 bottom-0">
          <div ref={lockupRef} className="shell w-full pb-16 md:pb-20 will-change-transform" style={{ color: "var(--on-media)" }}>
            <h1
              ref={headRef}
              className="max-w-[18ch] font-light leading-[1.03] tracking-[-0.02em] will-change-transform"
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
                    <span
                      data-hero-word
                      aria-hidden="true"
                      className={`inline-block will-change-transform ${accent ? "grad-text-media font-display font-extrabold" : ""}`}
                    >
                      {w}
                    </span>
                  </span>
                </span>
              ))}
            </h1>
            <div ref={subRef} className="mt-7 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
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

        {/* exit scrim — fades the whole hero to the brand dark as the sticky
            panel releases (see the exit-choreography effect above). Painted
            last so it sits above the footage, gradients, lockup, and cue
            alike; opacity-0 by default so reduced-motion users never see it,
            with no JS needed to guarantee that resting state. */}
        <div ref={exitScrimRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#0b0b0c] opacity-0 will-change-[opacity]" />
      </div>
    </section>
  );
}
