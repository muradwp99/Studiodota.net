import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ProjectsClient from "@/components/projects/ProjectsClient";
import { projects } from "@/content/site";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected architecture and design projects across residential, commercial, institutional, and masterplan sectors.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Selected work"
        title="Projects that speak for themselves."
        lede="Over 400 projects delivered across the built environment — a selection of recent architecture and design work below."
        image="/media/renders/meridian-sports.jpg"
        imageAlt="Meridian Sports Centre render"
      />
      <ProjectsClient projects={projects} initial={category} />
    </>
  );
}
