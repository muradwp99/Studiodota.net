import Link from "next/link";
import { db } from "@/lib/db";
import { PAGES } from "@/lib/pageRegistry";

export const metadata = { title: "Pages" };

export default async function AdminPagesIndex() {
  const pages = await db.page.findMany({ orderBy: { updatedAt: "desc" } }).catch(() => []);

  return (
    <div className="space-y-10">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold">Pages</h1>
          <Link href="/admin/pages/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]">
            + Add New
          </Link>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">Pages you design from scratch with the block editor.</p>

        <ul className="mt-5 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {pages.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              <Link href={`/admin/pages/block/${p.id}`} className="min-w-0 flex-1 transition-colors hover:text-[var(--gold-ink)]">
                <span className="font-medium">{p.title || "(untitled)"}</span>
                {p.status !== "published" && <span className="ml-2 text-sm text-[var(--muted)]">— Draft</span>}
                <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug}</div>
              </Link>
              <time className="shrink-0 text-xs text-[var(--muted)]">{p.updatedAt.toISOString().slice(0, 10)}</time>
              {p.status === "published" && (
                <Link href={`/${p.slug}`} target="_blank" className="shrink-0 text-xs text-[var(--gold-ink)] hover:underline">View ↗</Link>
              )}
            </li>
          ))}
          {pages.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">
              No custom pages yet — click “Add New” to design one with blocks.
            </li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-bold">Template pages</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">The site&rsquo;s built-in pages — edited section by section.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link key={p.slug} href={`/admin/pages/${p.slug}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition-colors hover:border-[var(--gold)]">
              <div className="font-semibold">{p.title}</div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">{p.blurb}</div>
              <div className="mt-2 font-mono text-[0.65rem] text-[var(--muted)]">{p.blocks.length} section{p.blocks.length === 1 ? "" : "s"}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
