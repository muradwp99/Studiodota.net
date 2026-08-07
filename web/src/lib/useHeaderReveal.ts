"use client";

import { useEffect, useState } from "react";
import { COVERING_ATTR, LOADED_EVENT, PAGE_REVEAL_EVENT, isSiteLoaded } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * True once it's safe for a mount-triggered header effect (e.g. BigTitle)
 * to start playing - after the first-load Preloader exits, or after
 * PageTransition's cover has lifted on a route change. Without this, an
 * effect that starts on mount/in-view can play - or finish - while still
 * hidden behind the cover panel, since sd:loaded only ever fires once per
 * session and every later navigation would otherwise read as "already ready."
 */
export function useHeaderReveal(): boolean {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return;
    }
    const covering = document.documentElement.hasAttribute(COVERING_ATTR);
    if (!covering && isSiteLoaded()) {
      setReady(true);
      return;
    }
    const onReady = () => setReady(true);
    window.addEventListener(LOADED_EVENT, onReady, { once: true });
    window.addEventListener(PAGE_REVEAL_EVENT, onReady, { once: true });
    return () => {
      window.removeEventListener(LOADED_EVENT, onReady);
      window.removeEventListener(PAGE_REVEAL_EVENT, onReady);
    };
  }, [reduced]);

  return ready;
}
