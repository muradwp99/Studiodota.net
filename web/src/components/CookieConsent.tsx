"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";

/**
 * Minimal GDPR-style consent banner. Shows once until a choice is stored;
 * "Accept" is what unlocks the analytics/marketing pixels (see SiteScripts).
 * "Decline" keeps only essential cookies (the site's own — always allowed).
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // localStorage is unreadable during SSR, so consent is resolved post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getConsent() === null) setShow(true);
  }, []);

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
      <div className="glass mx-auto flex max-w-[var(--maxw)] flex-col gap-4 rounded-2xl border border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between">
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
