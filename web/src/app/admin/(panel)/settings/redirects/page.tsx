import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import RedirectsManager from "@/components/admin/RedirectsManager";

export const metadata = { title: "Redirects" };

export default async function AdminRedirects() {
  await requireOwner();
  const rows = await db.redirect.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Redirects</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-[var(--muted)]">
          Send old or changed URLs to a new page. Use permanent (301) when a page has moved for good —
          it passes SEO value to the new URL. Changes apply within 30 seconds.
        </p>
      </div>
      <RedirectsManager initial={rows} />
    </div>
  );
}
