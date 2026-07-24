"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * largo-style route transitions for the App Router: internal link clicks are
 * intercepted, an ink panel wipes up to cover the page, the route is pushed,
 * and once the new pathname renders the panel continues upward to reveal it
 * (three pulsing dots while the next page compiles/loads).
 *
 * Passes through untouched: modified clicks, external/download/#hash links,
 * /admin, same-page links, and reduced-motion users. A failsafe always
 * reveals after 4s so navigation can never get stuck behind the panel.
 */
const COVER_MS = 480;
const REVEAL_HOLD_MS = 140; // small beat for the new page's first paint
const FAILSAFE_MS = 4000;

export default function PageTransition() {
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const reduced = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const coveringSince = useRef(0);
  const awaiting = useRef<string | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (failsafe.current) clearTimeout(failsafe.current);
    failsafe.current = null;
  };

  // Intercept internal navigations.
  useEffect(() => {
    if (reduced) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/")) return; // internal root-relative links only
      if (href.startsWith("/admin")) return;
      const url = new URL(href, window.location.origin);
      // Same page (incl. pure #hash jumps) → let the browser/Lenis handle it.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      awaiting.current = url.pathname + url.search;
      coveringSince.current = performance.now();
      setPhase("cover");
      router.push(url.pathname + url.search + url.hash);
      if (failsafe.current) clearTimeout(failsafe.current);
      failsafe.current = setTimeout(() => {
        awaiting.current = null;
        setPhase("reveal");
        timers.current.push(setTimeout(() => setPhase("idle"), 750));
      }, FAILSAFE_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Reveal once the awaited route has rendered (never before the cover lands).
  useEffect(() => {
    if (awaiting.current === null) return;
    awaiting.current = null;
    if (failsafe.current) clearTimeout(failsafe.current);
    failsafe.current = null;

    const elapsed = performance.now() - coveringSince.current;
    const wait = Math.max(COVER_MS - elapsed, 0) + REVEAL_HOLD_MS;
    timers.current.push(
      setTimeout(() => {
        setPhase("reveal");
        timers.current.push(setTimeout(() => setPhase("idle"), 750));
      }, wait),
    );
  }, [pathname]);

  if (reduced) return null;

  return (
    <div className={`sd-page-transition sd-pt--${phase}`} aria-hidden="true">
      <span className="sd-preloader-dots">
        <span className="sd-dot" />
        <span className="sd-dot" />
        <span className="sd-dot" />
      </span>
    </div>
  );
}
