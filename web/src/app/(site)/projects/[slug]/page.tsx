import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";
import ImageReveal from "@/components/motion/ImageReveal";
import ScrollExitImage from "@/components/motion/ScrollExitImage";
import CountUp from "@/components/CountUp";
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
  // "Next project" stays inside the current category, so following it walks you
  // through related work instead of jumping from a single-family house to an
  // industrial yard. Falls back to the full list for a category of one.
  const sameCategory = projects.filter((p) => p.category === project.category);
  const pool = sameCategory.length > 1 ? sameCategory : projects;
  const idx = pool.findIndex((p) => p.slug === slug);
  const next = pool[(idx + 1) % pool.length] ?? project;
  const services = Array.isArray(project.services) ? (project.services as string[]) : [];
  const gallery = (Array.isArray(project.gallery) ? (project.gallery as string[]) : []).filter(
    (g) => g && g !== project.heroImage,
  );
  // Legacy rows without a gallery still get their detail view(s) - deduped
  // so a project with no interior shot doesn't just show the hero twice.
  const fallbackPair = gallery.length
    ? []
    : [project.interiorImage, project.heroImage].filter((v, i, a) => v && a.indexOf(v) === i);
  // Numeric specs worth an animated CountUp focus moment: a clean 4-digit
  // year, and a unit count some titles carry (e.g. "Affordable Housing - 72
  // Units") — there's no dedicated sq-ft/unit field on the Project model.
  const yearNum = /^\d{4}$/.test(project.year) ? Number(project.year) : null;
  const unitsMatch = project.title.match(/(\d+)\s*Units?/i);
  const units = unitsMatch ? Number(unitsMatch[1]) : null;

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

        {/* Flythrough video - only the one project it was delivered for. */}
        {slug === "affordable-housing-136" && (
          <video
            className="mt-6 aspect-[16/9] w-full rounded-2xl border border-[var(--line)] object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={project.heroImage}
          >
            <source src="/media/ah136-flythrough.mp4" type="video/mp4" />
          </video>
        )}

        {/* largo info rows: CATEGORY / LOCATION / SERVICES */}
        <div className="mt-10 grid gap-10 border-y border-[var(--line)] py-10 md:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
          <Meta label="Sector" value={project.sector} />
          {units !== null && <Meta label="Units" end={units} />}
          {project.year && (yearNum !== null ? <Meta label="Year" end={yearNum} /> : <Meta label="Year" value={project.year} />)}
          {project.location && <Meta label="Location" value={project.location} />}
          <Meta label="Services" value={services.join(", ") || "Architectural Design"} />
        </div>

        {/* Every render delivered for the project. Full-bleed beats every
            third image for a focal point; a trailing image that would
            otherwise be stranded alone (empty grid cell beside it) is
            pulled full-bleed too instead of left orphaned. */}
        <div className="section grid gap-6 pt-14 md:grid-cols-2">
          {gallery.map((src, n) => {
            const wide = n % 3 === 2 || (n === gallery.length - 1 && gallery.length % 3 === 1);
            return (
              <ScrollExitImage
                key={src}
                src={src}
                alt={`${project.title} - view ${n + 2}`}
                sizes={wide ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                className={`w-full rounded-2xl border border-[var(--line)] ${wide ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                curtain="var(--ink)"
                delay={wide ? 0 : (n % 3) * 0.08}
                wide={wide}
              />
            );
          })}
          {fallbackPair.map((src, n) => {
            const wide = fallbackPair.length === 1;
            return (
              <ScrollExitImage
                key={`${src}-${n}`}
                src={src}
                alt={`${project.title} - detail view`}
                sizes={wide ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                className={`w-full rounded-2xl border border-[var(--line)] ${wide ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                curtain="var(--ink)"
                delay={n * 0.08}
                wide={wide}
              />
            );
          })}
        </div>
      </div>

      <section className="section border-t border-[var(--line)]">
        <div className="shell flex flex-col items-center gap-6 text-center">
          <span className="eyebrow">Next project</span>
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

function Meta({ label, value, end }: { label: string; value?: string; end?: number }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      {/* Sector/Units/Year/Location/Services are equal-weight facts about
          one project, so every value shares one size - a display-scale
          gradient CountUp on just the numeric fields would outweigh its
          plain-text siblings for no reason beyond "it happened to be a
          number." The counted figures keep a solid (non-gradient) bronze
          as a deliberate, modest nod to the fact that they're animated. */}
      <div className="mt-3 text-lg font-semibold text-[var(--bone)]">
        {end !== undefined ? (
          <span className="tabular-nums text-[var(--gold-ink)]">
            <CountUp end={end} />
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
