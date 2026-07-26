import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Applies admin-managed URL redirects (Settings → Redirects) before routing.
 * v16 proxy runs on the Node runtime, so Prisma works here. Rules are cached
 * in-module with a short TTL so it isn't a DB hit per request.
 * ponytail: module-level cache is fine for this single-instance self-hosted
 * app; a worker per instance just refreshes its own copy every TTL.
 */
type Rule = { to: string; permanent: boolean };
let cache: { at: number; map: Map<string, Rule> } | null = null;
const TTL = 30_000;

const norm = (p: string) => (p.replace(/\/+$/, "") || "/").toLowerCase();

async function rules(): Promise<Map<string, Rule>> {
  if (cache && Date.now() - cache.at < TTL) return cache.map;
  const map = new Map<string, Rule>();
  try {
    for (const r of await db.redirect.findMany()) {
      map.set(norm(r.from), { to: r.to, permanent: r.permanent });
    }
  } catch {
    // DB down — never block a request over a redirect lookup.
  }
  cache = { at: Date.now(), map };
  return map;
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const path = norm(req.nextUrl.pathname);
  const hit = (await rules()).get(path);

  // No redirect — let it fall through to Next's router (page or 404). A true
  // 404 is logged client-side (see NotFoundLogger), not here, so this stays a
  // plain passthrough and every static route can still prerender.
  if (!hit) return NextResponse.next();

  // Don't let hit-tracking slow down the redirect: not awaited, and the
  // rejection is caught so a DB hiccup can't surface as a request error.
  event.waitUntil(
    db.redirect
      .updateMany({ where: { from: path }, data: { hits: { increment: 1 }, lastHitAt: new Date() } })
      .catch((err) => console.error("[proxy] redirect hit-tracking failed:", err))
  );

  const dest = hit.to.startsWith("http") ? hit.to : new URL(hit.to, req.nextUrl.origin).toString();
  return NextResponse.redirect(dest, hit.permanent ? 308 : 307);
}

export const config = {
  // Skip Next internals, API, admin, and any path with a file extension.
  matcher: ["/((?!_next|api|admin|.*\\.).*)"],
};
