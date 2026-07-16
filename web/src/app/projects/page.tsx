import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import { projects } from "@/content/site";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected architecture and design projects across residential, commercial, institutional, and masterplan sectors.",
};

const filters = [
  { key: "all", label: "All work" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "institutional", label: "Institutional" },
  { key: "masterplan", label: "Masterplan" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const list =
    category === "all"
      ? projects
      : projects.filter((p) => p.category === category);

  return (
    <>
      <PageHeader
        eyebrow="Selected work"
        title="Projects that speak for themselves."
        lede="Over 400 projects delivered across the built environment — a selection of recent architecture and design work below."
      />

      <div className="shell">
        <div className="flex flex-wrap gap-2 border-y border-[var(--line)] py-6">
          {filters.map((f) => {
            const active = f.key === category;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/projects" : `/projects?category=${f.key}`}
                className={`rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                  active
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-[var(--line-strong)] text-[var(--bone-dim)] hover:text-[var(--bone)]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <div className="section grid gap-6 pt-14 md:grid-cols-2">
          {list.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) * 80}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>

        {list.length === 0 && (
          <p className="section text-center text-[var(--muted)]">
            No projects in this sector yet — explore all work instead.
          </p>
        )}
      </div>
    </>
  );
}
