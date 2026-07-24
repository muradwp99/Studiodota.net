import Link from "next/link";
import { db } from "@/lib/db";
import { TrashBar, RowTrashButton, TrashRowActions } from "@/components/admin/TrashActions";

export const metadata = { title: "Projects" };

export default async function AdminProjects({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const isTrash = view === "trash";
  const [projects, allCount, trashCount] = await Promise.all([
    db.project.findMany({ where: { deletedAt: isTrash ? { not: null } : null }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }] }),
    db.project.count({ where: { deletedAt: null } }),
    db.project.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Projects</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">The portfolio shown on /projects and in the homepage sections.</p>
        </div>
        <Link href="/admin/projects/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]">
          + New project
        </Link>
      </div>

      <div className="mt-5">
        <TrashBar basePath="/admin/projects" view={isTrash ? "trash" : "all"} allCount={allCount} trashCount={trashCount} />
      </div>

      <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.heroImage} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
            <div className="min-w-0 flex-1">
              {isTrash ? (
                <div className="truncate font-medium">{p.title}</div>
              ) : (
                <Link href={`/admin/projects/${p.id}`} className="truncate font-medium transition-colors hover:text-[var(--gold-ink)]">{p.title}</Link>
              )}
              <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug} · {p.sector} · {p.year}</div>
            </div>
            {!p.published && !isTrash && <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-[var(--muted)]">Draft</span>}
            {isTrash
              ? <TrashRowActions model="project" id={p.id} title={p.title} />
              : <RowTrashButton model="project" id={p.id} title={p.title} />}
          </li>
        ))}
        {projects.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">{isTrash ? "Trash is empty." : "No projects yet."}</li>
        )}
      </ul>
    </div>
  );
}
