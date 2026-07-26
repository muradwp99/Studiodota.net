import { cache } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { NOT_FOUND_PATH_HEADER } from "@/proxy";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = { title: "Page not found" };

// Resolving the 404 status on a non-streamed response means Next renders this
// boundary's body more than once per request — cache() (same dedupe pattern as
// getAdmin() in lib/auth.ts) keeps the upsert to one write per request.
const logMiss = cache(async (path: string | null) => {
  // No header means proxy never saw this request (e.g. excluded by its
  // matcher) — nothing to log, and that's fine.
  if (!path) return;
  try {
    await db.notFoundLog.upsert({
      where: { path },
      update: { hits: { increment: 1 }, lastHitAt: new Date() },
      create: { path },
    });
  } catch {
    // Never let logging break the 404 page itself.
  }
});

export default async function NotFound() {
  const path = (await headers()).get(NOT_FOUND_PATH_HEADER);
  await logMiss(path);

  return (
    <div className="shell flex min-h-screen flex-col items-start justify-center py-24">
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
