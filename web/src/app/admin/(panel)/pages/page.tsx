import Link from "next/link";
import { db } from "@/lib/db";
import { PAGES } from "@/lib/pageRegistry";
import { TrashBar, RowTrashButton, TrashRowActions } from "@/components/admin/TrashActions";

export const metadata = { title: "Pages" };

export default async function AdminPagesIndex({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const isTrash = view === "trash";
  const [pages, allCount, trashCount] = await Promise.all([
    db.page.findMany({ where: { deletedAt: isTrash ? { not: null } : null }, orderBy: { updatedAt: "desc" } }).catch(() => []),
    db.page.count({ where: { deletedAt: null } }).catch(() => 0),
    db.page.count({ where: { deletedAt: { not: null } } }).catch(() => 0),
  ]);

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

        <div className="mt-5">
          <TrashBar basePath="/admin/pages" view={isTrash ? "trash" : "all"} allCount={allCount} trashCount={trashCount} />
        </div>

        <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {pages.map((p) => (
            <li key={p.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]/50">
              <div className="min-w-0 flex-1">
                {isTrash ? (
                  <>
                    <span className="font-medium">{p.title || "(untitled)"}</span>
                    <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug}</div>
                  </>
                ) : (
                  <>
                    <Link href={`/admin/pages/block/${p.id}`} className="font-medium transition-colors hover:text-[var(--gold-ink)]">
                      {p.title || "(untitled)"}{p.status !== "published" && <span className="ml-2 text-sm text-[var(--muted)]">— Draft</span>}
                    </Link>
                    <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug}</div>
                    {/* Row actions — appear on hover (WordPress-style) */}
                    <div className="mt-1 flex items-center gap-2.5 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                      <Link href={`/admin/pages/block/${p.id}`} className="font-semibold text-[var(--gold-ink)] hover:underline">Edit</Link>
                      {p.status === "published" && (
                        <>
                          <span className="text-[var(--line-strong)]" aria-hidden="true">·</span>
                          <Link href={`/${p.slug}`} target="_blank" className="text-[var(--bone-dim)] hover:underline">View</Link>
                        </>
                      )}
                      <span className="text-[var(--line-strong)]" aria-hidden="true">·</span>
                      <RowTrashButton model="page" id={p.id} title={p.title || p.slug} />
                    </div>
                  </>
                )}
              </div>
              {isTrash && <TrashRowActions model="page" id={p.id} title={p.title || p.slug} />}
            </li>
          ))}
          {pages.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">
              {isTrash ? "Trash is empty." : "No custom pages yet — click “Add New” to design one with blocks."}
            </li>
          )}
        </ul>
      </div>

      {!isTrash && (
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
      )}
    </div>
  );
}
