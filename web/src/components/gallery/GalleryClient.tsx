"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import VideoPlayer from "@/components/VideoPlayer";

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
  const closeRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => items.filter((it) => cat === "all" || it.category === cat), [cat, items]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const selectCat = (c: "all" | Cat) => {
    setCat(c);
    setPage(0);
  };

  // Lightbox: Esc close, scroll lock, focus management.
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("lenis-stopped");
      prev?.focus?.();
    };
  }, [active]);

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
                      <VideoPlayer youtubeId={it.youtubeId} poster={it.image} className="h-full w-full" rounded="" title={`${it.title} — ${it.sector}`} mode="ambient" />
                    </div>
                  ) : (
                    <Image
                      src={it.image}
                      alt={`${it.title} — ${it.sector}`}
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

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${active.title}, ${active.sector}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-10"
            style={{ background: "rgba(8,9,10,0.9)", backdropFilter: "blur(6px)" }}
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={reduced ? false : { scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduced ? undefined : { scale: 0.97, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[1100px] overflow-hidden rounded-2xl bg-[var(--surface)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {active.type === "video" ? (
                  <VideoPlayer youtubeId={active.youtubeId} poster={active.image} className="h-full w-full" rounded="" title={`${active.title} — ${active.sector}`} mode="cinema" />
                ) : (
                  <Image src={active.image} alt={`${active.title} — ${active.sector}`} fill sizes="90vw" className="object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {active.type === "video" ? "Motion" : "Still"} · {active.sector}
                  </div>
                  <div className="text-lg font-medium">{active.title}</div>
                </div>
                <button ref={closeRef} onClick={() => setActive(null)} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-lg transition-colors duration-300 hover:bg-[var(--surface-2)]">
                  ✕
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
