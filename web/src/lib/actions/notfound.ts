"use server";

import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Logs a real 404 miss. Called from a client-side beacon (see NotFoundLogger)
 * so the shared not-found.tsx boundary never touches a Dynamic API — reading
 * headers()/cookies() there would force every route in the app to render
 * dynamically, since it's Next's single shared fallback for all unmatched URLs.
 * cache()'d so a duplicate call within the same request/render pass is a no-op.
 */
export const logNotFoundMiss = cache(async (path: string): Promise<void> => {
  const clean = path.trim().slice(0, 500);
  if (!clean.startsWith("/")) return;
  try {
    await db.notFoundLog.upsert({
      where: { path: clean },
      update: { hits: { increment: 1 }, lastHitAt: new Date() },
      create: { path: clean },
    });
  } catch {
    // Never let logging break the 404 page itself.
  }
});
