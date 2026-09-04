"use client";

import { motion } from "framer-motion";
import { EASE_CURTAIN } from "@/lib/motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Item = { quote: string; name: string; role: string };

/**
 * The short notes. A CSS multi-column wall so cards of very different lengths
 * pack without the ragged bottom edge a fixed grid leaves, each one lifting in
 * as it scrolls into view.
 */
export default function VoiceWall({ items }: { items: Item[] }) {
  const reduced = useReducedMotion();
  if (items.length === 0) return null;

  return (
    <div className="mt-14 gap-6 md:columns-2 xl:columns-3">
      {items.map((t, i) => (
        <motion.figure
          key={t.name + i}
          className="mb-6 break-inside-avoid rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] p-7 md:p-8"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE_CURTAIN, delay: (i % 3) * 0.08 }}
        >
          <span aria-hidden="true" className="block select-none font-display text-4xl font-extrabold leading-none text-[var(--gold)] opacity-[0.28]">
            &ldquo;
          </span>
          <blockquote className="mt-4 text-[1.0625rem] leading-relaxed text-[var(--bone-dim)]">{t.quote}</blockquote>
          <figcaption className="mt-6 border-t border-[var(--line)] pt-5">
            <div className="font-semibold text-[var(--bone)]">{t.name}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{t.role}</div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
