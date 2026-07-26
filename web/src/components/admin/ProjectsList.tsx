"use client";

import { useState } from "react";
import Link from "next/link";
import { reorderProjects } from "@/lib/actions/collections";
import { RowTrashButton } from "@/components/admin/TrashActions";

export type ProjectRow = { id: string; slug: string; title: string; heroImage: string; sector: string; year: string; published: boolean };

/** Drag-to-reorder project list — mirrors the ⠿-handle/draggable/dataTransfer
 *  pattern from PageBuilder's EditableNode, applied to a flat list. Dropping a
 *  row rewrites `sort` 0..n for every row and saves immediately (optimistic). */
export default function ProjectsList({ items }: { items: ProjectRow[] }) {
  // Resync local order when the server gives us a fresh `items` array (e.g.
  // after a trash action) without clobbering an in-progress drag reorder.
  const [prevItems, setPrevItems] = useState(items);
  const [list, setList] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setList(items);
  }
  const [dragId, setDragId] = useState<string | null>(null);

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    setList((cur) => {
      const fi = cur.findIndex((p) => p.id === from);
      const ti = cur.findIndex((p) => p.id === to);
      if (fi < 0 || ti < 0) return cur;
      const next = [...cur];
      const [moved] = next.splice(fi, 1);
      next.splice(ti, 0, moved);
      reorderProjects(next.map((p) => p.id)).then((res) => { if (res.error) setList(items); });
      return next;
    });
  };

  return (
    <ul className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      {list.map((p) => (
        <li
          key={p.id}
          onDragOver={(e) => { if (dragId && dragId !== p.id) e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, p.id); setDragId(null); }}
          className={`flex items-center gap-3 px-5 py-3.5 ${dragId === p.id ? "opacity-40" : ""}`}
        >
          <span
            draggable
            aria-label="Drag to reorder"
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", p.id); setDragId(p.id); }}
            onDragEnd={() => setDragId(null)}
            className="shrink-0 cursor-grab select-none px-1 text-[var(--muted)] active:cursor-grabbing"
          >
            ⠿
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.heroImage} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
          <div className="min-w-0 flex-1">
            <Link href={`/admin/projects/${p.id}`} className="truncate font-medium transition-colors hover:text-[var(--gold-ink)]">{p.title}</Link>
            <div className="font-mono text-[0.65rem] text-[var(--muted)]">/{p.slug} · {p.sector} · {p.year}</div>
          </div>
          {!p.published && <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-[var(--muted)]">Draft</span>}
          <RowTrashButton model="project" id={p.id} title={p.title} />
        </li>
      ))}
      {list.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No projects yet.</li>}
    </ul>
  );
}
