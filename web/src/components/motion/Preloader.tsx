"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { markSiteLoaded } from "@/lib/motion";

/**
 * Geometric first-load reveal (largo.studio pattern, Studio Dot A geometry):
 * an ink cover with concentric gold arcs drawing themselves around the
 * wordmark + three pulsing dots; the whole panel then wipes upward.
 *
 * - Full intro only once per session (~1.6s); repeat visits get a short beat.
 * - Fires `sd:loaded` as the exit starts so hero titles rise with the wipe.
 * - Reduced motion: quick fade, no arcs/dots animation.
 * - Server-rendered visible, so content never flashes before the cover.
 */
const ARCS = [
  { r: 86, opacity: 0.85, delay: 0.1 },
  { r: 62, opacity: 0.55, delay: 0.26 },
  { r: 38, opacity: 0.35, delay: 0.42 },
];

export default function Preloader() {
  const [phase, setPhase] = useState<"intro" | "exit" | "done">("intro");
  const reduced = useReducedMotion();
  const exitStarted = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("lenis-stopped");

    const timers: ReturnType<typeof setTimeout>[] = [];
    const seen = sessionStorage.getItem("sd-preloaded") === "1";
    sessionStorage.setItem("sd-preloaded", "1");

    const beginExit = () => {
      if (exitStarted.current) return;
      exitStarted.current = true;
      html.classList.remove("lenis-stopped");
      markSiteLoaded();
      setPhase("exit");
      timers.push(setTimeout(() => setPhase("done"), 1000));
    };

    if (reduced) {
      timers.push(setTimeout(beginExit, 200));
    } else {
      const minHold = seen ? 550 : 1600;
      const started = performance.now();
      const finishAfterMinHold = () => {
        const remaining = Math.max(0, minHold - (performance.now() - started));
        timers.push(setTimeout(beginExit, remaining));
      };
      if (document.readyState === "complete") finishAfterMinHold();
      else window.addEventListener("load", finishAfterMinHold, { once: true });
      // Hard cap — never hold the page hostage on a slow asset.
      timers.push(setTimeout(beginExit, seen ? 1300 : 2800));
    }

    return () => {
      timers.forEach(clearTimeout);
      html.classList.remove("lenis-stopped");
    };
  }, [reduced]);

  if (phase === "done") return null;

  return (
    <div className={`sd-preloader ${phase === "exit" ? "sd-preloader--exit" : ""}`} aria-hidden="true">
      <noscript>
        <style>{`.sd-preloader{display:none}`}</style>
      </noscript>
      <div className="sd-preloader-core">
        <span className="sd-arcs-pos" aria-hidden="true">
          <svg className="sd-arcs" width="300" height="300" viewBox="0 0 220 220" fill="none">
            {ARCS.map(({ r, opacity, delay }) => {
              const c = 2 * Math.PI * r;
              return (
                <circle
                  key={r}
                  className="sd-arc"
                  cx="110"
                  cy="110"
                  r={r}
                  stroke="var(--gold)"
                  strokeWidth="1.25"
                  opacity={opacity}
                  style={{ strokeDasharray: c, strokeDashoffset: c, animationDelay: `${delay}s` }}
                />
              );
            })}
          </svg>
        </span>
        <div className="sd-preloader-mark">
          {/* Brand words appear through geometric clip wipes — left, top, bottom. */}
          <div className="sd-preloader-big" aria-hidden="true">
            {["STUDIO", "DOT", "A"].map((w, i) => (
              <span key={w} className="sd-bigword" style={{ animationDelay: `${0.18 + i * 0.24}s` }}>
                {w}
              </span>
            ))}
          </div>
          <span className="sd-preloader-word">ARCHITECTURE + ENGINEERING</span>
          <span className="sd-preloader-dots">
            <span className="sd-dot" />
            <span className="sd-dot" />
            <span className="sd-dot" />
          </span>
        </div>
      </div>
    </div>
  );
}
