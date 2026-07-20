"use client";

import { useState } from "react";
import { blockTypeFor, type BlockType } from "@/lib/pageBlocks";

/**
 * Persistent left elements panel — the block library. Groups every block type
 * into WordPress-style categories, filters by a search box, and inserts a block
 * on click OR by dragging it onto the canvas. Mirrors the reference editor's
 * left panel.
 */

const CATEGORIES: { name: string; types: string[] }[] = [
  { name: "Layout", types: ["hero", "columns", "divider", "spacer"] },
  { name: "Text", types: ["heading", "text", "quote"] },
  { name: "Media", types: ["image", "imageText", "gallery", "video"] },
  { name: "Widgets", types: ["buttons", "stats", "features", "faq", "cta", "contactForm", "clients"] },
  { name: "Embed", types: ["embed"] },
];

export default function ElementsPanel({ onInsert, onDragType }: { onInsert: (type: string) => void; onDragType?: (type: string | null) => void }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const match = (bt: BlockType) =>
    !query || bt.label.toLowerCase().includes(query) || bt.description.toLowerCase().includes(query);

  return (
    <div className="p-3">
      <div className="mb-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search blocks…"
          aria-label="Search blocks"
          className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--bone)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
        />
      </div>

      {CATEGORIES.map((cat) => {
        const items = cat.types
          .map((t) => blockTypeFor(t))
          .filter((bt): bt is BlockType => Boolean(bt) && match(bt as BlockType));
        if (items.length === 0) return null;
        return (
          <div key={cat.name} className="mb-4 last:mb-0">
            <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{cat.name}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((bt) => (
                <button
                  key={bt.type}
                  type="button"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", bt.type); onDragType?.(bt.type); }}
                  onDragEnd={() => onDragType?.(null)}
                  onClick={() => onInsert(bt.type)}
                  title={bt.description}
                  className="flex cursor-grab flex-col items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-3 text-center transition-colors hover:border-[var(--gold)] hover:bg-[var(--surface-2)] active:cursor-grabbing"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--surface-2)] text-sm text-[var(--gold-ink)]" aria-hidden="true">{bt.icon}</span>
                  <span className="text-[0.72rem] font-semibold leading-tight text-[var(--bone)]">{bt.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {CATEGORIES.every((cat) => cat.types.every((t) => { const bt = blockTypeFor(t); return !bt || !match(bt); })) && (
        <p className="px-1 py-4 text-center text-xs text-[var(--muted)]">No blocks match “{q}”.</p>
      )}
    </div>
  );
}
