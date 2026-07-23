"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomeData } from "@/components/home/Sections";

type Item = HomeData["featured"]["items"][number];

/**
 * Typographic project index with imagery present at rest: names lead on the
 * left, and a persistent sticky preview panel on the right crossfades to the
 * hovered/focused row (first project shown by default — never an empty box).
 * Small screens swap the panel for an inline photo per row. No pointer-chasing,
 * no scaffold numbering; keyboard focus drives the preview too.
 */
export default function ProjectIndex({ items, linkLabel }: { items: Item[]; linkLabel: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
      <div>
        {items.map((p, i) => (
          <Link
            key={p.slug + i}
            href={`/projects/${p.slug}`}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            className="group block border-t border-[rgba(246,245,242,0.14)] py-5 md:py-6"
          >
            <span className={`display-index block transition-colors duration-500 ${i === active ? "text-[var(--gold-media)]" : ""}`}>
              {p.title}
            </span>
            <span className="mt-1 block text-xs" style={{ color: "var(--on-media-dim)" }}>
              {p.location} · {p.year}
            </span>
            <span className="relative mt-4 block aspect-[16/8] overflow-hidden rounded-lg lg:hidden">
              <Image src={p.image} alt="" fill sizes="92vw" className="object-cover" />
            </span>
          </Link>
        ))}
        <div className="border-t border-[rgba(246,245,242,0.14)] pt-6">
          <Link href="/projects" className="link-underline text-sm font-semibold" style={{ color: "var(--gold-media)" }}>
            {linkLabel}
          </Link>
        </div>
      </div>

      <div className="relative hidden self-start overflow-hidden rounded-xl lg:sticky lg:top-24 lg:block lg:aspect-[4/3]" aria-hidden="true">
        {items.map((p, i) => (
          <Image
            key={p.slug + i}
            src={p.image}
            alt=""
            fill
            sizes="42vw"
            className={`object-cover transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
