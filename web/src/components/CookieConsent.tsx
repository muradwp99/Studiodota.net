"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";

/**
 * Minimal GDPR-style consent banner. Shows once until a choice is stored;
 * "Accept" is what unlocks the analytics/marketing pixels (see SiteScripts).
 * "Decline" keeps only essential cookies (the site's own — always allowed).
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // localStorage is unreadable during SSR, so consent is resolved post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getConsent() === null) setShow(true);
  }, []);

  // Publish this banner's real height as --consent-h so content anchored to the
  // bottom of the viewport can reserve room for it instead of being covered.
  // Measured rather than hard-coded because the copy wraps to a different
  // number of lines at different widths. Kept in sync on resize, and always
  // reset to 0px on dismiss/unmount so the space is given back.
  useEffect(() => {
    const root = document.documentElement;
    const clear = () => root.style.setProperty("--consent-h", "0px");
    if (!show) {
      clear();
      return;
    }
    const measure = () => {
      const h = panelRef.current?.offsetHeight;
      if (h) root.style.setProperty("--consent-h", `${h}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      clear();
    };
  }, [show]);

  if (!show) return null;

  const choose = (v: "accepted" | "declined") => {
    setConsent(v);
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[90] px-[var(--edge)] pb-4"
    >
      <div ref={panelRef} className="glass mx-auto flex max-w-[var(--maxw)] flex-col gap-4 rounded-2xl border border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[70ch] text-sm text-[var(--bone-dim)]">
          We use essential cookies to run this site, and optional analytics cookies to understand
          traffic. See our{" "}
          <Link href="/privacy" className="text-[var(--gold-ink)] underline">privacy policy</Link>.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-medium text-[var(--bone)] transition-colors hover:border-[var(--gold)]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-full bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-[#17191c] transition-colors hover:bg-[var(--gold-hi)]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
