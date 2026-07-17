"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { Project } from "@/content/site";

const R = (n: string) => `/media/renders/${n}.jpg`;

const filters = [
  { key: "all", label: "All work" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "institutional", label: "Institutional" },
  { key: "masterplan", label: "Masterplan" },
] as const;

export default function ProjectsClient({
  projects,
  initial = "all",
}: {
  projects: Project[];
  initial?: string;
}) {
  const reduced = useReducedMotion();
  const [cat, setCat] = useState<string>(
    filters.some((f) => f.key === initial) ? initial : "all",
  );
  const list = projects.filter((p) => cat === "all" || p.category === cat);

  return (
    <section className="section pt-14">
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

        <motion.div layout={!reduced} className="mt-10 grid gap-6 md:grid-cols-2">
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
                    <div className={`relative w-full overflow-hidden rounded-2xl ${feature ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                      <Image
                        src={R(p.slug)}
                        alt={`${p.title} — ${p.sector}`}
                        fill
                        sizes={feature ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                        className={`object-cover ${reduced ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"}`}
                      />
                      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.62), transparent 55%)" }} />
                      <span className="absolute left-5 top-5 font-mono text-[0.62rem] uppercase tracking-[0.22em]" style={{ color: "var(--on-media)" }}>
                        {p.sector} · {p.year}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6" style={{ color: "var(--on-media)" }}>
                        <div>
                          <h3 className={feature ? "display-m" : "text-xl font-medium"}>{p.title}</h3>
                          {feature && (
                            <p className="mt-2 max-w-[48ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{p.summary}</p>
                          )}
                        </div>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(246,245,242,0.16)] backdrop-blur transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true">→</span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {list.length === 0 && (
          <p className="py-20 text-center text-[var(--muted)]">No projects in this sector yet — view all work instead.</p>
        )}
      </div>
    </section>
  );
}
