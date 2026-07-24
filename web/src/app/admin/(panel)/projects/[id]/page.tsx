import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProjectForm, { type ProjectInput } from "@/components/admin/ProjectForm";
import type { SeoBlob } from "@/lib/seoScore";

export const metadata = { title: "Edit project" };

const EMPTY: ProjectInput = {
  slug: "",
  title: "",
  summary: "",
  category: "single-family",
  sector: "Single Family Residence",
  location: "",
  year: "",
  services: [],
  heroImage: "",
  interiorImage: "",
  gallery: [],
  published: true,
  sort: 0,
  seo: {},
};

export default async function AdminProjectEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const project = isNew ? null : await db.project.findUnique({ where: { id } });
  if (!isNew && !project) notFound();

  const initial: ProjectInput = project
    ? {
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        category: project.category,
        sector: project.sector,
        location: project.location,
        year: project.year,
        services: Array.isArray(project.services) ? (project.services as string[]) : [],
        heroImage: project.heroImage,
        interiorImage: project.interiorImage,
        gallery: Array.isArray(project.gallery) ? (project.gallery as string[]) : [],
        published: project.published,
        sort: project.sort,
        seo: (project.seo && typeof project.seo === "object" ? project.seo : {}) as SeoBlob,
      }
    : EMPTY;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/projects" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]">← All projects</Link>
        <h1 className="mt-1 text-2xl font-extrabold">{isNew ? "New project" : `Edit — ${project!.title}`}</h1>
        {!isNew && (
          <Link href={`/projects/${project!.slug}`} target="_blank" className="text-sm text-[var(--gold-ink)] hover:underline">
            View live ↗
          </Link>
        )}
      </div>
      <ProjectForm id={isNew ? null : id} initial={initial} />
    </div>
  );
}
