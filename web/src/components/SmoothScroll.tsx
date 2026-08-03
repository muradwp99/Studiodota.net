"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      lerp: 0.09,
      // Same-page "#section" links smooth-scroll to their target instead of
      // being swallowed by the virtual scroll.
      anchors: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /**
   * Land every navigation at the top of the page.
   *
   * Next resets window.scrollY on route change, but Lenis drives scrolling
   * through its own virtual position and simply carries the old offset over —
   * so following a link from halfway down one page dropped you halfway down
   * the next. Only an explicit `#hash` should land anywhere but the top, and
   * that case is left to the `anchors` handler above.
   */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (window.location.hash) return; // deep link — let the anchor win
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0); // reduced-motion: no Lenis instance exists
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
