"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import SplitReveal from "@/components/SplitReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { HomeData } from "@/components/home/Sections";

type Item = HomeData["featured"]["items"][number];

/**
 * Typographic project index (traced from largo.studio): each project is its
 * NAME at display scale plus a small meta row — photography appears only on
 * intent, as a cursor-following preview card. On small screens the card is
 * replaced by an inline thumbnail; under reduced motion the list is static.
 */
export default function ProjectIndex({ items, linkLabel }: { items: Item[]; linkLabel: string }) {
  const [hovered, setHovered] = useState<Item | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const move = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = card.current;
    if (!el) return;
    gsap.set(el, { xPercent: 4, yPercent: -50, autoAlpha: 0, scale: 0.94 });
    move.current = {
      x: gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" }),
    };
    return () => {
      move.current = null;
    };
  }, [reduced]);

  const onMove = (e: React.PointerEvent) => {
    move.current?.x(e.clientX);
    move.current?.y(e.clientY);
  };
  const show = (p: Item) => {
    setHovered(p);
    if (!reduced && card.current) gsap.to(card.current, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" });
  };
  const hide = () => {
    if (!reduced && card.current) gsap.to(card.current, { autoAlpha: 0, scale: 0.94, duration: 0.3, ease: "power3.out" });
  };

  const rowMeta = "font-mono text-[0.68rem] uppercase tracking-[0.22em]";

  return (
    <div onPointerMove={onMove}>
      <div>
        {items.map((p, i) => (
          <Link
            key={p.slug + i}
            href={`/projects/${p.slug}`}
            onPointerEnter={() => show(p)}
            onPointerLeave={hide}
            className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-[rgba(246,245,242,0.14)] py-7 md:grid-cols-[3.5rem_1fr_auto] md:py-9"
          >
            <span className={rowMeta} style={{ color: "var(--on-media-dim)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="display-index block transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 group-hover:text-[var(--gold-media)]">
              <SplitReveal text={p.title} tag="span" className="block" />
            </span>
            <span className={`${rowMeta} col-start-2 mt-3 md:col-start-3 md:mt-0 md:self-center md:text-right`} style={{ color: "var(--on-media-dim)" }}>
              {p.location} · {p.year}
            </span>
            <span className="relative col-span-2 mt-5 block aspect-[16/7] overflow-hidden rounded-lg md:hidden">
              <Image src={p.image} alt="" fill sizes="92vw" className="object-cover" />
            </span>
          </Link>
        ))}

        {/* Giant closing link — the LARGO "All projects" move. */}
        <Link
          href="/projects"
          className="group block border-t border-b border-[rgba(246,245,242,0.14)] py-7 md:py-9"
        >
          <span className="display-index block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3" style={{ color: "var(--gold-media)" }}>
            {linkLabel.replace(/\s*→\s*$/, "")}
            <span aria-hidden="true" className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-4"> →</span>
          </span>
        </Link>
      </div>

      {/* Cursor-following preview (desktop pointers, full-motion users only). */}
      {!reduced && (
        <div
          ref={card}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-30 hidden w-[min(30vw,380px)] overflow-hidden rounded-xl shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)] md:block"
          style={{ visibility: "hidden" }}
        >
          <div className="relative aspect-[4/3] bg-[#1b1d20]">
            {hovered && <Image src={hovered.image} alt="" fill sizes="380px" className="object-cover" />}
          </div>
        </div>
      )}
    </div>
  );
}
