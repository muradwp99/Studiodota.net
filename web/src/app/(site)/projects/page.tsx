import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ProjectsClient from "@/components/projects/ProjectsClient";
import { getBlock, getProjects } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.projects");
  return { title: "Work", description: d.lede };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const [d, projects] = await Promise.all([getBlock("page.projects"), getProjects()]);

  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} lede={d.lede} image={d.image} imageAlt="" />
      <ProjectsClient
        projects={projects.map((p) => ({
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          category: p.category,
          sector: p.sector,
          year: p.year,
          heroImage: p.heroImage,
        }))}
        initial={category}
      />
    </>
  );
}
