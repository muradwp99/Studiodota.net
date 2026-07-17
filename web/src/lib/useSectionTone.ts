import { useEffect, useState } from "react";

export type Tone = "light" | "dark";

/**
 * Returns the background tone ("light" | "dark") of whichever
 * `[data-nav-tone]` element currently sits behind a horizontal probe line
 * `probeY` pixels from the top of the viewport (i.e. behind the nav pill).
 *
 * Sections opt in by setting `data-nav-tone="dark"` (dark imagery/ink surface)
 * or `data-nav-tone="light"` (pale paper surface). Defaults to "dark" so the
 * nav is legible over the hero before any measurement.
 */
export function useSectionTone(probeY = 44): Tone {
  const [tone, setTone] = useState<Tone>("dark");

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const els = document.querySelectorAll<HTMLElement>("[data-nav-tone]");
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.top <= probeY && r.bottom > probeY) {
            const t = el.dataset.navTone;
            setTone(t === "dark" ? "dark" : "light");
            return;
          }
        }
        // No marked section under the probe -> the base paper surface is light.
        setTone("light");
      });
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [probeY]);

  return tone;
}
