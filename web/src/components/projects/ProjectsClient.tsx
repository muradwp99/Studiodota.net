"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ImageReveal from "@/components/motion/ImageReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  sector: string;
  location: string;
  year: string;
  heroImage: string;
};

/**
 * Display order + labels. Affordable housing leads; "office" is gone, folded
 * into commercial. Keep this in step with projectCategories in the taxonomies
 * block and with scripts/update-project-structure.mjs.
 */
const CATEGORY_LABELS: [key: string, label: string][] = [
  ["affordable-housing", "Affordable housing"],
  ["single-family", "Single family"],
  ["multifamily", "Multifamily"],
  ["mixed-use", "Mixed use"],
  ["commercial", "Commercial"],
  ["senior-living", "Senior living"],
  ["adu", "ADU"],
  ["interior", "Interior"],
  // legacy demo categories — shown only if such rows still exist
  ["residential", "Residential"],
  ["institutional", "Institutional"],
  ["masterplan", "Masterplan"],
];

/**
 * Categories that appear in the filter bar even with nothing in them yet.
 * ADU is announced work with no renders delivered, so the client wants it
 * visible and clickable, landing on an empty state rather than being hidden.
 */
const ALWAYS_SHOWN = new Set(["adu"]);

export default function ProjectsClient({
  projects,
  initial = "all",
}: {
  projects: ProjectCardData[];
  initial?: string;
}) {
  const reduced = useReducedMotion();
  const filters: { key: string; label: string }[] = [
    { key: "all", label: "All work" },
    ...CATEGORY_LABELS.filter(([key]) => ALWAYS_SHOWN.has(key) || projects.some((p) => p.category === key)).map(
      ([key, label]) => ({ key, label }),
    ),
  ];
  const [cat, setCat] = useState<string>(
    filters.some((f) => f.key === initial) ? initial : "all",
  );
  const list = projects.filter((p) => cat === "all" || p.category === cat);

  return (
    <section className="section pt-10">
      <div className="shell">
        <div className="flex flex-wrap gap-2 border-y border-[var(--line)] py-6">
          {filters.map((f) => {
            const on = f.key === cat;
            return (
              <button
                key={f.key}
                onClick={() => setCat(f.key)}
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-sm transition-colors duration-300 ${on ? "bg-[var(--bone)] text-[var(--ink)]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <motion.div layout={!reduced} className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => {
              const feature = cat === "all" && i === 0;
              return (
                <motion.article
                  key={p.slug}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={feature ? "md:col-span-2" : ""}
                >
                  <Link href={`/projects/${p.slug}`} className="group block">
                    <ImageReveal
                      src={p.heroImage}
                      alt={`${p.title} - ${p.sector}`}
                      sizes={feature ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                      className={`w-full rounded-2xl ${feature ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                      imgClassName={`object-cover ${reduced ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"}`}
                      curtain="var(--ink-2)"
                      delay={feature ? 0 : 0.06}
                    />
                    {/* largo card anatomy: masked-feel title + ruled info columns */}
                    <div className="mt-5 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 border-t border-[var(--line-strong)] pt-4">
                      <div className="min-w-0">
                        {/* h2: these cards are the page's top-level sections, sitting
                            directly under the h1, so h3 skipped a level. */}
                        <h2 className={`${feature ? "display-m" : "text-xl font-semibold"} transition-colors duration-300 group-hover:text-[var(--gold-ink)]`}>
                          {p.title}
                        </h2>
                        {feature && (
                          <p className="mt-2 max-w-[52ch] text-sm text-[var(--muted)]">{p.summary}</p>
                        )}
                      </div>
                      <dl className="flex shrink-0 gap-10 text-left">
                        <div>
                          <dt className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[var(--muted)]">Category</dt>
                          <dd className="mt-1.5 text-sm text-[var(--bone-dim)]">{p.sector}</dd>
                        </div>
                        {p.location && (
                          <div>
                            <dt className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[var(--muted)]">Location</dt>
                            <dd className="mt-1.5 text-sm text-[var(--bone-dim)]">{p.location}</dd>
                          </div>
                        )}
                        {p.year && (
                          <div>
                            <dt className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[var(--muted)]">Year</dt>
                            <dd className="mt-1.5 text-sm text-[var(--bone-dim)]">{p.year}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {list.length === 0 && (
          <p className="py-20 text-center text-[var(--muted)]">No projects in this sector yet - view all work instead.</p>
        )}
      </div>
    </section>
  );
}
