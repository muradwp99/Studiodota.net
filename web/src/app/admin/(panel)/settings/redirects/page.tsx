import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import RedirectsManager from "@/components/admin/RedirectsManager";

export const metadata = { title: "Redirects" };

// Formatted server-side (not in the client component) so this can't hydration-mismatch
// on timezone/locale between server render and the browser — see fmt() in messages/page.tsx.
function timeAgo(date: Date): string {
  let n = Math.max(0, (Date.now() - date.getTime()) / 1000);
  const steps: [number, string][] = [[60, "second"], [60, "minute"], [24, "hour"], [30, "day"], [12, "month"]];
  let unit = "year";
  for (const [div, u] of steps) {
    if (n < div) { unit = u; break; }
    n /= div;
  }
  const v = Math.floor(n);
  if (unit === "second" && v < 10) return "just now";
  return `${v} ${unit}${v === 1 ? "" : "s"} ago`;
}

function hitsLabel(hits: number, lastHitAt: Date | null): string {
  if (hits <= 0 || !lastHitAt) return "No hits yet";
  return `${hits} hit${hits === 1 ? "" : "s"} · last ${timeAgo(lastHitAt)}`;
}

export default async function AdminRedirects() {
  await requireOwner();
  const [rows, misses] = await Promise.all([
    db.redirect.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
    db.notFoundLog.findMany({ orderBy: { lastHitAt: "desc" }, take: 50 }).catch(() => []),
  ]);

  const redirects = rows.map((r) => ({
    id: r.id,
    from: r.from,
    to: r.to,
    permanent: r.permanent,
    hitsLabel: hitsLabel(r.hits, r.lastHitAt),
  }));

  const notFound = misses.map((m) => ({
    path: m.path,
    hits: m.hits,
    lastSeenLabel: timeAgo(m.lastHitAt),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Redirects</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-[var(--muted)]">
          Send old or changed URLs to a new page. Use permanent (301) when a page has moved for good —
          it passes SEO value to the new URL. Changes apply within 30 seconds.
        </p>
      </div>
      <RedirectsManager initial={redirects} notFound={notFound} />
    </div>
  );
}
