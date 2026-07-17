import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Projects" };

export default async function AdminProjects() {
  const projects = await db.project.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });

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

      <ul className="mt-6 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {projects.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.heroImage} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.title}</div>
                <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug} · {p.sector} · {p.year}</div>
              </div>
              {!p.published && <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-[var(--muted)]">Draft</span>}
            </Link>
          </li>
        ))}
        {projects.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No projects yet.</li>}
      </ul>
    </div>
  );
}
