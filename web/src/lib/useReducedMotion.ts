import { useEffect, useState } from "react";

/**
 * SSR-safe hook that tracks the user's `prefers-reduced-motion` setting.
 * Returns `false` on the server and first client render (so markup matches),
 * then reflects the real value and updates live if the setting changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
