"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { EASE_CURTAIN } from "@/lib/motion";
import VideoPlayer from "@/components/VideoPlayer";

/**
 * The site's one lightbox. Extracted from the gallery page so the showreel
 * opens exactly the same way rather than growing a second implementation that
 * drifts from this one.
 *
 * Plays a video when `youtubeId` is set, otherwise shows the still. Closes on
 * Escape or backdrop click, locks Lenis while open, and restores focus to
 * whatever opened it.
 *
 * Pass `layoutId` to morph the media in from a matching `motion.*` element
 * elsewhere on the page (e.g. the grid tile that was clicked) via Framer
 * Motion's shared layout animation — omit it for a plain fade/scale open.
 */

export type LightboxMedia = {
  title: string;
  /** Small line above the title — sector, category, whatever fits. */
  sector?: string;
  image: string;
  youtubeId?: string;
  /** Self-hosted mp4 path — takes the same video slot as youtubeId. */
  mp4?: string;
};

export default function MediaLightbox({
  active,
  onClose,
  layoutId,
}: {
  active: LightboxMedia | null;
  onClose: () => void;
  /** Shared `layoutId` for the media frame — see the doc comment above. */
  layoutId?: string;
}) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const sharedId = reduced ? undefined : layoutId;

  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("lenis-stopped");
      prev?.focus?.();
    };
  }, [active, onClose]);

  const isVideo = Boolean(active?.youtubeId || active?.mp4);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={active.sector ? `${active.title}, ${active.sector}` : active.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-10"
          style={{ background: "rgba(8,9,10,0.9)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={reduced ? false : { scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduced ? undefined : { scale: 0.97, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[1100px] overflow-hidden rounded-2xl bg-[var(--surface)]"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              layoutId={sharedId}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE_CURTAIN }}
              className="relative aspect-video w-full overflow-hidden bg-black"
            >
              {isVideo ? (
                <VideoPlayer
                  youtubeId={active.youtubeId}
                  mp4={active.mp4}
                  poster={active.image}
                  className="h-full w-full"
                  rounded=""
                  title={active.sector ? `${active.title} - ${active.sector}` : active.title}
                  mode="cinema"
                />
              ) : (
                <Image
                  src={active.image}
                  alt={active.sector ? `${active.title} - ${active.sector}` : active.title}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              )}
            </motion.div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                  {isVideo ? "Motion" : "Still"}
                  {active.sector ? ` · ${active.sector}` : null}
                </div>
                <div className="text-lg font-medium">{active.title}</div>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-lg transition-colors duration-300 hover:bg-[var(--surface-2)]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
