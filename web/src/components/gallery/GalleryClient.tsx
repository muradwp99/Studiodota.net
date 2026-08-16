"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { EASE_CURTAIN } from "@/lib/motion";
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
        <motion.div layout={!reduced} className="mt-8 grid auto-rows-[64vw] grid-cols-1 gap-5 grid-flow-dense sm:auto-rows-[320px] sm:grid-cols-2 lg:auto-rows-[380px]">
          <AnimatePresence mode="popLayout">
            {shown.map((it, i) => (
              <motion.div
                key={it.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={it.tall ? "sm:row-span-2" : ""}
              >
                {/* layoutId lets this tile morph into the lightbox's media
                    frame (see MediaLightbox) instead of just cross-fading. */}
                <motion.div
                  layoutId={reduced ? undefined : `gallery-media-${it.id}`}
                  transition={{ duration: reduced ? 0 : 0.6, ease: EASE_CURTAIN }}
                  className="group relative h-full w-full overflow-hidden rounded-2xl"
                >
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
                      {/* fixed dark ink, not var(--ink) — gold-media is always the light champagne tone, and --ink flips to paper-white in the light theme, which would wash this glyph out to near-invisible */}
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[var(--gold-media)] text-[7px] leading-none text-[#17191c]">▶</span>
                      Video
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-4 top-4 z-10 grid h-9 w-9 -translate-y-1 place-items-center rounded-full text-base opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${reduced ? "" : "transition-all duration-500"}`}
                    style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(6px)", color: "var(--on-media)" }}
                  >
                    ↗
                  </span>
                  <div
                    className={`pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${reduced ? "" : "transition-all duration-500"}`}
                    style={{ color: "var(--on-media)" }}
                  >
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em]" style={{ color: "var(--on-media-dim)" }}>{it.sector}</div>
                    <div className="text-lg font-medium">{it.title}</div>
                  </div>
                  <button onClick={() => setActive(it)} aria-label={`Open ${it.title}`} className="on-media absolute inset-0 z-20" />
                </motion.div>
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
                // fixed dark ink on the active dot, not var(--ink) — gold doesn't flip
                // to a dark tone in the light theme, so pairing it with the (then
                // paper-white) --ink token left the current page number unreadable.
                className={`h-9 w-9 rounded-full font-mono text-sm transition-colors duration-300 ${page === i ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"}`}
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
        layoutId={active && !reduced ? `gallery-media-${active.id}` : undefined}
      />
    </section>
  );
}
