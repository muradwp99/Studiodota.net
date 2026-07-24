"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCategory, renameCategory, deleteCategory } from "@/lib/actions/taxonomy";
import { inputCls, labelCls, btnPrimaryCls, Notice } from "@/components/admin/ui";

export default function CategoriesManager({ categories, counts }: { categories: string[]; counts: Record<string, number> }) {
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<{ ok?: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setState(res.error ? res : null);
      if (res.ok) {
        setName("");
        setRenaming(null);
        router.refresh();
      }
    });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_1fr]">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-bold">Add New Category</h2>
        <div className="mt-4">
          <label htmlFor="cat-name" className={labelCls}>Name</label>
          <input id="cat-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Materials" />
        </div>
        <button type="button" onClick={() => run(() => addCategory(name))} disabled={pending || !name.trim()} className={`${btnPrimaryCls} mt-4`}>
          {pending ? "Working…" : "Add Category"}
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="px-5 pt-4"><Notice state={state} /></div>
        <ul className="divide-y divide-[var(--line)]">
          {categories.map((c) => {
            const count = counts[c] ?? 0;
            const isRenaming = renaming === c;
            return (
              <li key={c} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                {isRenaming ? (
                  <>
                    <input aria-label={`Rename ${c}`} className={`${inputCls} max-w-56`} value={renameTo} onChange={(e) => setRenameTo(e.target.value)} />
                    <button type="button" disabled={pending} className="text-sm text-[var(--gold-ink)] hover:underline" onClick={() => run(() => renameCategory(c, renameTo))}>Save</button>
                    <button type="button" className="text-sm text-[var(--muted)] hover:underline" onClick={() => setRenaming(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 font-medium">{c}</span>
                    <span className="font-mono text-xs text-[var(--muted)]">{count} post{count === 1 ? "" : "s"}</span>
                    <button type="button" className="text-sm text-[var(--gold-ink)] hover:underline" onClick={() => { setRenaming(c); setRenameTo(c); }}>Rename</button>
                    <button
                      type="button"
                      className="text-sm text-[#a33] hover:underline"
                      onClick={() => {
                        const warn = count > 0
                          ? `Delete "${c}"? The ${count} post${count === 1 ? "" : "s"} using it keep the label until you edit them.`
                          : `Delete "${c}"?`;
                        if (window.confirm(warn)) run(() => deleteCategory(c));
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            );
          })}
          {categories.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No categories yet.</li>}
        </ul>
      </section>
    </div>
  );
}
