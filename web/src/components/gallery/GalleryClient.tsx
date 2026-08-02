"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import VideoPlayer from "@/components/VideoPlayer";
import MediaLightbox from "@/components/MediaLightbox";

type Cat = "architecture" | "residential" | "commercial";
export type GalleryItemData = {
  id: string;
  title: string;
  sector: string;
  image: string;
  category: string;
  type: string;
  youtubeId?: string;
  tall?: boolean;
};

const filters = [
  { key: "all", label: "All" },
  { key: "architecture", label: "Architecture" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
] as const;

const PAGE = 8;

export default function GalleryClient({ items }: { items: GalleryItemData[] }) {
  const reduced = useReducedMotion();
  const [cat, setCat] = useState<"all" | Cat>("all");
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<GalleryItemData | null>(null);

  const filtered = useMemo(() => items.filter((it) => cat === "all" || it.category === cat), [cat, items]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const selectCat = (c: "all" | Cat) => {
    setCat(c);
    setPage(0);
  };

  return (
    <section className="section pt-14">
      <div className="shell">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const on = cat === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => selectCat(f.key)}
                  aria-pressed={on}
                  className={`rounded-full px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-300 ${on ? "bg-[var(--bone)] text-[var(--ink)]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {String(filtered.length).padStart(2, "0")} works
          </div>
        </div>

        {/* Grid */}
        <motion.div layout={!reduced} className="mt-8 grid auto-rows-[64vw] grid-cols-1 gap-5 sm:auto-rows-[320px] sm:grid-cols-2 lg:auto-rows-[380px]">
          <AnimatePresence mode="popLayout">
            {shown.map((it) => (
              <motion.div
                key={it.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={it.tall ? "row-span-2" : ""}
              >
                <div className="group relative h-full w-full overflow-hidden rounded-2xl">
                  {it.type === "video" ? (
                    <div className="absolute inset-0">
                      <VideoPlayer youtubeId={it.youtubeId} poster={it.image} className="h-full w-full" rounded="" title={`${it.title} - ${it.sector}`} mode="ambient" />
                    </div>
                  ) : (
                    <Image
                      src={it.image}
                      alt={`${it.title} - ${it.sector}`}
                      fill
                      sizes="(max-width:768px) 100vw, 50vw"
                      className={`object-cover ${reduced ? "" : "transition-transform duration-700 group-hover:scale-105"}`}
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.82), transparent 60%)" }} />
                  {it.type === "video" && (
                    <span className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-[rgba(11,11,12,0.5)] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-[var(--on-media)] backdrop-blur">
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[var(--gold-media)] text-[7px] leading-none text-[var(--ink)]">▶</span>
                      Video
                    </span>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 opacity-0 transition-all duration-500 group-hover:opacity-100" style={{ color: "var(--on-media)" }}>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em]" style={{ color: "var(--on-media-dim)" }}>{it.sector}</div>
                    <div className="text-lg font-medium">{it.title}</div>
                  </div>
                  <button onClick={() => setActive(it)} aria-label={`Open ${it.title}`} className="absolute inset-0 z-20" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {shown.length === 0 && (
          <p className="py-20 text-center text-[var(--muted)]">No works in this category yet.</p>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <span className="mr-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">See</span>
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={page === i}
                className={`h-9 w-9 rounded-full font-mono text-sm transition-colors duration-300 ${page === i ? "bg-[var(--gold)] text-[var(--ink)]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <MediaLightbox
        active={
          active
            ? {
                title: active.title,
                sector: active.sector,
                image: active.image,
                // Gallery stills carry a youtubeId field but only "video" rows
                // mean it; passing it unconditionally would play stale ids.
                youtubeId: active.type === "video" ? active.youtubeId : undefined,
              }
            : null
        }
        onClose={() => setActive(null)}
      />
    </section>
  );
}
