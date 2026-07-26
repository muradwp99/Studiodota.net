import Link from "next/link";
import { db } from "@/lib/db";
import { TrashBar, TrashRowActions } from "@/components/admin/TrashActions";
import ProjectsList from "@/components/admin/ProjectsList";

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

      {isTrash ? (
        <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.heroImage} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.title}</div>
                <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug} · {p.sector} · {p.year}</div>
              </div>
              <TrashRowActions model="project" id={p.id} title={p.title} />
            </li>
          ))}
          {projects.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">Trash is empty.</li>}
        </ul>
      ) : (
        <ProjectsList items={projects.map((p) => ({ id: p.id, slug: p.slug, title: p.title, heroImage: p.heroImage, sector: p.sector, year: p.year, published: p.published }))} />
      )}
    </div>
  );
}
