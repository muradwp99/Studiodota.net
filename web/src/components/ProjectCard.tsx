import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/site";

export function RenderPlaceholder({
  tone,
  label,
  className = "",
}: {
  tone: [string, string];
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 100% at 70% 15%, ${tone[0]}, ${tone[1]} 70%)`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 75% 20%, rgba(87,189,168,0.22), transparent 60%)",
        }}
      />
      {label && (
        <span className="absolute left-5 top-5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--bone-dim)]">
          {label}
        </span>
      )}
    </div>
  );
}

export default function ProjectCard({ project }: { project: Project }) {
  const img = `/media/renders/${project.slug}.jpg`;
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <div className="bezel">
        <div className="bezel-core overflow-hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.15rem]">
            <Image
              src={img}
              alt={`${project.title} — architectural 3D render`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,12,12,0.6), transparent 45%)",
              }}
            />
            <span className="absolute left-5 top-5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--bone)]">
              {project.sector}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 p-6">
            <div>
              <h3 className="font-display text-xl leading-tight">
                {project.title}
              </h3>
              <p className="mt-2 max-w-[38ch] text-sm text-[var(--muted)]">
                {project.summary}
              </p>
            </div>
            <span
              className="mt-1 shrink-0 translate-x-[-4px] text-[var(--gold)] opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
