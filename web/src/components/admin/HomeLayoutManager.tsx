"use client";

import { useState, useTransition } from "react";
import { saveHomeLayout, type SaveState } from "@/lib/actions/appearance";
import { HOME_SECTION_META, HOME_SECTION_IDS, labelFor } from "@/lib/homeSections";
import { btnPrimaryCls, btnGhostCls, Notice } from "@/components/admin/ui";

type Item = { id: string; enabled: boolean };

/** Reconcile a saved layout with the canonical section list: keep saved order,
 *  drop unknown ids, append any new sections at the end (enabled). */
function reconcile(saved: Item[]): Item[] {
  const known = new Set(HOME_SECTION_IDS as string[]);
  const seen = new Set<string>();
  const ordered = saved.filter((s) => known.has(s.id) && !seen.has(s.id) && seen.add(s.id));
  const tail = HOME_SECTION_META.filter((s) => !seen.has(s.id)).map((s) => ({ id: s.id, enabled: true }));
  return [...ordered, ...tail];
}

export default function HomeLayoutManager({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(() => reconcile(initial));
  const [state, setState] = useState<SaveState | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setState(null);
  };
  const toggle = (i: number) => {
    setItems(items.map((it, j) => (j === i ? { ...it, enabled: !it.enabled } : it)));
    setState(null);
  };
  const reset = () => {
    setItems(HOME_SECTION_META.map((s) => ({ id: s.id, enabled: true })));
    setState(null);
  };

  const save = () =>
    startTransition(async () => setState(await saveHomeLayout({ sections: items })));

  const enabledCount = items.filter((i) => i.enabled).length;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2">
        <ul className="divide-y divide-[var(--line)]">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-3 px-3 py-3">
              <span className="w-6 shrink-0 text-center font-mono text-xs text-[var(--muted)]">{i + 1}</span>
              <div className="flex shrink-0 flex-col">
                <button type="button" aria-label={`Move ${labelFor(it.id)} up`} disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="grid h-5 w-6 place-items-center rounded text-[var(--bone-dim)] hover:text-[var(--gold-ink)] disabled:opacity-30">▲</button>
                <button type="button" aria-label={`Move ${labelFor(it.id)} down`} disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                  className="grid h-5 w-6 place-items-center rounded text-[var(--bone-dim)] hover:text-[var(--gold-ink)] disabled:opacity-30">▼</button>
              </div>
              <span className={`flex-1 text-sm font-medium ${it.enabled ? "text-[var(--bone)]" : "text-[var(--muted)] line-through"}`}>
                {labelFor(it.id)}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={it.enabled}
                aria-label={`${it.enabled ? "Hide" : "Show"} ${labelFor(it.id)}`}
                onClick={() => toggle(i)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${it.enabled ? "bg-[var(--gold)]" : "bg-[var(--line-strong)]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${it.enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Notice state={state} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : "Save layout"}
        </button>
        <button type="button" onClick={reset} className={btnGhostCls}>Reset to default</button>
        <span className="text-xs text-[var(--muted)]">{enabledCount} of {items.length} sections visible</span>
      </div>
    </div>
  );
}
