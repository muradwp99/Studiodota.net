import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";
import ImageReveal from "@/components/motion/ImageReveal";
import { getProject, getProjects } from "@/lib/content";
import { pageMetadata, type SeoBlob } from "@/lib/seo";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return pageMetadata({
    seo: project.seo as SeoBlob,
    title: project.title,
    description: project.summary,
    image: project.heroImage,
    path: `/projects/${slug}`,
  });
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const projects = await getProjects();
  const idx = projects.findIndex((p) => p.slug === slug);
  const next = projects[(idx + 1) % projects.length] ?? project;
  const services = Array.isArray(project.services) ? (project.services as string[]) : [];
  const gallery = (Array.isArray(project.gallery) ? (project.gallery as string[]) : []).filter(
    (g) => g && g !== project.heroImage,
  );
  // Legacy rows without a gallery still get their pair of detail views.
  const fallbackPair = gallery.length
    ? []
    : [project.interiorImage || project.heroImage, project.heroImage];

  return (
    <article>
      <header className="shell pb-10 pt-40 md:pt-52">
        <Reveal>
          <Link href="/projects" className="eyebrow eyebrow-muted link-underline">
            ← All work
          </Link>
        </Reveal>
        <LineMask text={project.title} tag="h1" className="display-xl mt-6 max-w-[16ch]" delay={0.08} />
        <Reveal delay={200}>
          <p className="lede mt-6 max-w-[54ch]">{project.summary}</p>
        </Reveal>
      </header>

      <div className="shell">
        <ImageReveal
          src={project.heroImage}
          alt={`${project.title} - hero view`}
          sizes="100vw"
          priority
          className="aspect-[16/9] w-full rounded-2xl border border-[var(--line)]"
          curtain="var(--ink)"
        />

        {/* largo info rows: CATEGORY / LOCATION / SERVICES */}
        <div className="mt-10 grid gap-10 border-y border-[var(--line)] py-10 md:grid-cols-4">
          <Meta label="Sector" value={project.sector} />
          {project.year && <Meta label="Year" value={project.year} />}
          {project.location && <Meta label="Location" value={project.location} />}
          <Meta label="Services" value={services.join(", ") || "Architectural Design"} />
        </div>

        {/* Every render delivered for the project — full-width beat every third image */}
        <div className="section grid gap-6 pt-14 md:grid-cols-2">
          {gallery.map((src, n) => {
            const wide = n % 3 === 2;
            return (
              <ImageReveal
                key={src}
                src={src}
                alt={`${project.title} - view ${n + 2}`}
                sizes={wide ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                className={`w-full rounded-2xl border border-[var(--line)] ${wide ? "aspect-[16/9] md:col-span-2" : "aspect-[4/3]"}`}
                curtain="var(--ink)"
                delay={wide ? 0 : (n % 3) * 0.08}
              />
            );
          })}
          {fallbackPair.map((src, n) => (
            <ImageReveal
              key={`${src}-${n}`}
              src={src}
              alt={`${project.title} - detail view`}
              sizes="(max-width:768px) 100vw, 50vw"
              className="aspect-[4/3] w-full rounded-2xl border border-[var(--line)]"
              curtain="var(--ink)"
              delay={n * 0.08}
            />
          ))}
        </div>
      </div>

      <section className="section border-t border-[var(--line)]">
        <div className="shell flex flex-col items-center gap-6 text-center">
          <span className="eyebrow eyebrow-muted">Next project</span>
          <Link href={`/projects/${next.slug}`} className="group inline-flex items-baseline gap-4">
            <span className="display-m link-underline">{next.title}</span>
            <span aria-hidden="true" className="text-2xl text-[var(--gold-ink)] transition-transform duration-500 group-hover:translate-x-2">→</span>
          </Link>
          <Link href="/contact" className="btn btn-primary mt-4">
            Start a project like this
            <span className="btn-icon" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow eyebrow-muted">{label}</div>
      <div className="mt-3 text-[var(--bone)]">{value}</div>
    </div>
  );
}
