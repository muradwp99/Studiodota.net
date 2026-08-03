import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import NotFoundLogger from "@/components/NotFoundLogger";

export const metadata: Metadata = { title: "Page not found" };

// Deliberately a plain static component — no headers()/cookies() here. This is
// Next's single shared fallback for every unmatched URL in the app, so any
// Dynamic API call in this file forces the ENTIRE site to render on-demand
// instead of statically. Logging (which needs the real attempted path) happens
// client-side via NotFoundLogger instead.
export default function NotFound() {
  return (
    <div className="shell flex min-h-screen flex-col items-start justify-center py-24">
      <NotFoundLogger />
      <Reveal>
        <span className="eyebrow">404</span>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="display-l mt-5 max-w-[20ch]">Page not found</h1>
      </Reveal>
      <Reveal delay={130}>
        <p className="lede mt-7 max-w-[52ch]">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>
      </Reveal>
      <Reveal delay={180}>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-semibold text-[var(--gold-ink)] underline underline-offset-4 transition-colors hover:text-[var(--gold)]"
        >
          Back to homepage
        </Link>
      </Reveal>
    </div>
  );
}
