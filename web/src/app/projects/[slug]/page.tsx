import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { projects } from "@/content/site";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const idx = projects.findIndex((p) => p.slug === slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <article>
      <header className="shell pb-10 pt-40 md:pt-52">
        <Reveal>
          <Link
            href="/projects"
            className="eyebrow eyebrow-muted link-underline"
          >
            ← All work
          </Link>
        </Reveal>
        <Reveal delay={70}>
          <h1 className="display-l mt-6 max-w-[20ch]">{project.title}</h1>
        </Reveal>
        <Reveal delay={130}>
          <p className="lede mt-6 max-w-[54ch]">{project.summary}</p>
        </Reveal>
      </header>

      <div className="shell">
        <Reveal>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[var(--line)]">
            <Image
              src={`/media/renders/${project.slug}.jpg`}
              alt={`${project.title} — architectural 3D render`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="grid gap-10 border-y border-[var(--line)] py-10 md:grid-cols-4">
          <Meta label="Sector" value={project.sector} />
          <Meta label="Year" value={project.year} />
          <Meta label="Services" value={project.services.join(", ")} />
          <Meta label="Status" value="Delivered" />
        </div>

        <div className="section grid gap-6 pt-14 md:grid-cols-2">
          {["center top", "center bottom"].map((pos, n) => (
            <Reveal key={pos} delay={n * 80}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--line)]">
                <Image
                  src={`/media/renders/${project.slug}.jpg`}
                  alt={`${project.title} — detail view`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: pos }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <section className="section border-t border-[var(--line)]">
        <div className="shell flex flex-col items-center gap-6 text-center">
          <span className="eyebrow eyebrow-muted">Next project</span>
          <Link href={`/projects/${next.slug}`} className="display-m link-underline">
            {next.title}
          </Link>
          <Link href="/contact" className="btn btn-primary mt-4">
            Start a project like this
            <span className="btn-icon" aria-hidden="true">
              →
            </span>
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
