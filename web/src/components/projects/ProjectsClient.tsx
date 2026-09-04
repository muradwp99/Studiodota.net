"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ImageReveal from "@/components/motion/ImageReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { EASE_CURTAIN } from "@/lib/motion";
import { CATEGORY_LABELS } from "@/lib/projectCategories";

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
  /**
   * The URL is the single source of truth for the filter — not component
   * state. A `useState` seeded from `initial` only re-seeds when the subtree
   * remounts, and a client-side <Link> to /projects from the projects page
   * (header nav, footer "Portfolio", every Projects mega-panel thumbnail)
   * changes only the search params: React reconciles this component in place,
   * so the stale filter survived while the address bar said otherwise, and no
   * popstate fired to correct it. Next patches history.pushState/replaceState
   * to feed useSearchParams, so `select` below still works by rewriting the URL.
   */
  const params = useSearchParams();
  const requested = params.get("category") ?? initial;
  const cat = filters.some((f) => f.key === requested) ? requested : "all";
  const list = projects.filter((p) => cat === "all" || p.category === cat);

  /**
   * `replaceState` (not push) so tapping through the filter bar doesn't fill
   * the back stack with one entry per tap, while still leaving the category in
   * the URL — which is what makes browser Back out of a project land on the
   * category the visitor was browsing instead of "All work".
   */
  const select = (key: string) => {
    window.history.replaceState(null, "", key === "all" ? "/projects" : `/projects?category=${key}`);
  };

  return (
    // pt-10! (not a typo): .section's padding-block in globals.css is unlayered
    // CSS, which beats any @layer-utilities class in Tailwind v4 - a plain pt-10
    // here is silently dead and this section inherits the full 5-10rem section
    // gap right under the header. The `!important` suffix is the one thing that
    // still wins, closing the gap to the intended tight post-header spacing.
    <section className="section pt-10!">
      <div className="shell">
        <div className="flex flex-wrap gap-2 border-y border-[var(--line)] py-6">
          {filters.map((f) => {
            const on = f.key === cat;
            return (
              <button
                key={f.key}
                onClick={() => select(f.key)}
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-sm transition-colors duration-300 ${on ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--gold-ink)]"}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <motion.div layout={!reduced} className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => {
              // Every filtered view leads with one full-width anchor card, not just
              // "all" — a single active category used to fall back to a flat 2-up
              // grid of identical cards with no focal point (and a lone result sat
              // in a half-empty row). Featuring item 0 always gives each view a
              // hierarchy and fixes that orphaned single-result layout too.
              const feature = i === 0;
              // Grid position for the entrance stagger — the feature card owns a
              // full-width row of its own, so cards after it are reindexed to match
              // their real column/row in the 2-up grid.
              const gridIdx = feature ? 0 : i - 1;
              const col = gridIdx % 2;
              const row = Math.floor(gridIdx / 2);
              const stagger = feature ? 0 : col * 0.1 + row * 0.05;
              return (
                <motion.article
                  key={p.slug}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CURTAIN, delay: reduced ? 0 : stagger } }}
                  viewport={{ once: true, amount: 0.2 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -18, scale: reduced ? 1 : 0.96, transition: { duration: reduced ? 0 : 0.45, ease: EASE_CURTAIN } }}
                  className={feature ? "md:col-span-2" : ""}
                >
                  <Link
                    href={`/projects/${p.slug}`}
                    className="group block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5"
                  >
                    <ImageReveal
                      src={p.heroImage}
                      alt={`${p.title} - ${p.sector}`}
                      sizes={feature ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                      /* 3:2, not 4:3. Measured across all published heroes:
                         a 4:3 box throws away 19.6% of the average render
                         (most are 16:9), 3:2 only 14.8%, and 3:2 stays kinder
                         to the handful of portrait shots than a 16:9 box. */
                      className={`w-full rounded-2xl ${feature ? "aspect-[16/9]" : "aspect-[3/2]"}`}
                      imgClassName={`object-cover ${reduced ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"}`}
                      curtain="var(--ink-2)"
                      delay={feature ? 0 : 0.06}
                    />
                    {/* largo card anatomy: masked-feel title + ruled info columns,
                        hairline gold sweep on hover echoes the stat-card motif. */}
                    <div className="relative mt-5 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 border-t border-[var(--line-strong)] pt-4">
                      <span
                        aria-hidden="true"
                        className="absolute -top-px left-0 h-px w-0 bg-[var(--gold)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"
                      />
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
                      <dl className="flex flex-wrap shrink-0 max-w-full gap-x-10 gap-y-2 text-left">
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
