import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";
import Arcs from "@/components/motion/Arcs";
import ProjectsClient from "@/components/projects/ProjectsClient";
import { getBlock, getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.projects");
  return pageMetadata({ seo: d.seo, title: "Work", description: d.lede, path: "/projects" });
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
      {/* Typographic header — largo's giant-title-with-circle-geometry gesture */}
      <header className="relative overflow-hidden pb-12 pt-40 md:pt-56">
        <Arcs className="absolute -right-[28vw] -top-[26vw] w-[74vw] min-w-[520px]" />
        <div className="shell relative">
          <Reveal><span className="eyebrow eyebrow--sheet">{d.eyebrow}</span></Reveal>
          <LineMask text={d.title} tag="h1" className="display-2xl mt-8 max-w-[14ch]" delay={0.08} />
          <Reveal delay={260}>
            <p className="lede mt-8 max-w-[54ch]">{d.lede}</p>
          </Reveal>
        </div>
      </header>

      <ProjectsClient
        projects={projects.map((p) => ({
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          category: p.category,
          sector: p.sector,
          location: p.location,
          year: p.year,
          heroImage: p.heroImage,
        }))}
        initial={category}
      />
    </>
  );
}
