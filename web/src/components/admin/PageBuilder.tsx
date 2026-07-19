"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { savePage, deletePage, type PageActionState } from "@/lib/actions/pages";
import { BLOCK_TYPES, blockTypeFor, type PageBlock } from "@/lib/pageBlocks";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import FieldsRenderer, { setAt, type Json, type Path } from "@/components/admin/FieldsRenderer";
import { inputCls, labelCls, btnPrimaryCls, btnGhostCls, btnDangerCls, Notice } from "@/components/admin/ui";

export type PageInput = {
  title: string;
  slug: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  blocks: PageBlock[];
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function Inserter({ onInsert, compact }: { onInsert: (type: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative flex justify-center ${compact ? "py-1" : "py-3"}`}>
      <button
        type="button"
        aria-label="Add block"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`grid place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--gold-ink)] transition-all hover:border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[#17191c] ${compact ? "h-7 w-7 text-sm" : "h-9 w-9 text-lg"}`}
      >
        +
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute top-full z-40 mt-2 grid w-[min(560px,90vw)] grid-cols-2 gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_30px_70px_-30px_rgba(17,19,21,0.4)] sm:grid-cols-3">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                type="button"
                onClick={() => {
                  onInsert(bt.type);
                  setOpen(false);
                }}
                className="rounded-xl border border-transparent p-3 text-left transition-colors hover:border-[var(--gold)] hover:bg-[var(--surface-2)]"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded bg-[var(--surface-2)] text-xs text-[var(--gold-ink)]" aria-hidden="true">{bt.icon}</span>
                  <span className="text-sm font-semibold">{bt.label}</span>
                </div>
                <p className="mt-1 text-[0.7rem] leading-snug text-[var(--muted)]">{bt.description}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PageBuilder({
  id,
  initial,
  serviceOptions,
}: {
  id: string | null;
  initial: PageInput;
  serviceOptions: string[];
}) {
  const [page, setPage] = useState<PageInput>(initial);
  const [pageId, setPageId] = useState<string | null>(id);
  const [selected, setSelected] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [state, setState] = useState<PageActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = <K extends keyof PageInput>(k: K, v: PageInput[K]) => {
    setPage((p) => ({ ...p, [k]: v }));
    setState(null);
  };

  const selectedBlock = page.blocks.find((b) => b.id === selected) ?? null;
  const selectedType = selectedBlock ? blockTypeFor(selectedBlock.type) : null;

  const insertAt = (index: number, type: string) => {
    const bt = blockTypeFor(type);
    if (!bt) return;
    const block: PageBlock = { id: crypto.randomUUID(), type, props: structuredClone(bt.defaults) };
    const blocks = [...page.blocks];
    blocks.splice(index, 0, block);
    set("blocks", blocks);
    setSelected(block.id);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= page.blocks.length) return;
    const blocks = [...page.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    set("blocks", blocks);
  };

  const duplicate = (i: number) => {
    const src = page.blocks[i];
    const copy: PageBlock = { id: crypto.randomUUID(), type: src.type, props: structuredClone(src.props) };
    const blocks = [...page.blocks];
    blocks.splice(i + 1, 0, copy);
    set("blocks", blocks);
    setSelected(copy.id);
  };

  const remove = (i: number) => {
    const blocks = page.blocks.filter((_, j) => j !== i);
    set("blocks", blocks);
    setSelected(null);
  };

  const updateSelectedProps = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set(
      "blocks",
      page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, props: setAt(b.props, path, value) as Json } : b)),
    );
  };

  // Inline (on-canvas) text edits commit here, keyed by the block's own id.
  const updateBlockProp = (blockId: string, path: (string | number)[], value: string) => {
    set(
      "blocks",
      page.blocks.map((b) => (b.id === blockId ? { ...b, props: setAt(b.props, path, value) as Json } : b)),
    );
    setState(null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await savePage(pageId, page);
      setState(res);
      if (res.ok && res.id && !pageId) {
        setPageId(res.id);
        router.replace(`/admin/pages/block/${res.id}`);
      }
      if (res.ok) router.refresh();
    });

  const destroy = () => {
    if (!pageId) return;
    if (!window.confirm(`Delete "${page.title || page.slug}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deletePage(pageId);
    });
  };

  const toolbarBtn = "grid h-7 w-7 place-items-center rounded bg-[#17191c] text-xs text-[rgba(246,245,242,0.85)] transition-colors hover:bg-[var(--gold)] hover:text-[#17191c] disabled:opacity-30";

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/pages" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]">← All Pages</Link>
        <div className="min-w-0 flex-1" />
        <select
          aria-label="Status"
          className={`${inputCls} w-auto`}
          value={page.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        {pageId && page.status === "published" && page.slug && (
          <Link href={`/${page.slug}`} target="_blank" className={btnGhostCls}>View ↗</Link>
        )}
        {pageId && (
          <button type="button" onClick={destroy} disabled={pending} className={btnDangerCls}>Delete</button>
        )}
        <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : page.status === "published" ? "Publish" : "Save draft"}
        </button>
      </div>

      <input
        aria-label="Page title"
        className="w-full border-0 border-b border-[var(--line)] bg-transparent pb-3 text-3xl font-extrabold outline-none placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
        placeholder="Add title"
        value={page.title}
        onChange={(e) => {
          const title = e.target.value;
          setPage((p) => ({ ...p, title, slug: slugTouched ? p.slug : slugify(title) }));
          setState(null);
        }}
      />

      <Notice state={state} />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_330px]">
        {/* Canvas */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)]">
          {page.blocks.length === 0 && (
            <p className="px-8 pt-10 text-center text-sm text-[var(--muted)]">Empty page — add your first block below.</p>
          )}
          {page.blocks.map((b, i) => {
            const on = selected === b.id;
            return (
              <div key={b.id}>
                <Inserter compact onInsert={(type) => insertAt(i, type)} />
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${blockTypeFor(b.type)?.label ?? b.type} block`}
                  onClick={() => setSelected(b.id)}
                  onKeyDown={(e) => {
                    // Only act when the wrapper itself is focused — never while
                    // typing inside an inline-editable text node.
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setSelected(b.id);
                    }
                  }}
                  className={`relative transition-shadow ${on ? "ring-2 ring-inset ring-[var(--gold)]" : "hover:ring-1 hover:ring-inset hover:ring-[var(--line-strong)]"}`}
                >
                  {on && (
                    <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-lg bg-[#17191c] p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                      <span className="px-2 font-mono text-[0.62rem] uppercase tracking-wide text-[var(--gold-media)]">{blockTypeFor(b.type)?.label ?? b.type}</span>
                      <button type="button" aria-label="Move up" disabled={i === 0} className={toolbarBtn} onClick={() => move(i, -1)}>↑</button>
                      <button type="button" aria-label="Move down" disabled={i === page.blocks.length - 1} className={toolbarBtn} onClick={() => move(i, 1)}>↓</button>
                      <button type="button" aria-label="Duplicate" className={toolbarBtn} onClick={() => duplicate(i)}>⧉</button>
                      <button type="button" aria-label="Remove" className={`${toolbarBtn} hover:bg-[#a33] hover:text-white`} onClick={() => remove(i)}>✕</button>
                    </div>
                  )}
                  {/* Live canvas — text is click-to-edit; links never navigate here. */}
                  <div onClickCapture={(e) => { const a = (e.target as HTMLElement).closest("a"); if (a) e.preventDefault(); }}>
                    <BlockRenderer blocks={[b]} ctx={{ serviceOptions }} edit={updateBlockProp} />
                  </div>
                </div>
              </div>
            );
          })}
          <Inserter onInsert={(type) => insertAt(page.blocks.length, type)} />
        </div>

        {/* Sidebar */}
        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 lg:sticky lg:top-14">
          {selectedBlock && selectedType ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em]">{selectedType.label}</h2>
                <button type="button" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]" onClick={() => setSelected(null)}>
                  Page settings
                </button>
              </div>
              {selectedType.fields.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">This block has no settings.</p>
              ) : (
                <FieldsRenderer
                  fields={selectedType.fields}
                  data={selectedBlock.props as Json}
                  onChange={updateSelectedProps}
                  idPrefix={`blk.${selectedBlock.id}`}
                />
              )}
            </>
          ) : (
            <>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.08em]">Page settings</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="pb-slug" className={labelCls}>Slug (address)</label>
                  <input
                    id="pb-slug"
                    className={`${inputCls} font-mono text-xs`}
                    value={page.slug}
                    placeholder="my-new-page"
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value);
                    }}
                  />
                  <p className="mt-1.5 font-mono text-[0.65rem] text-[var(--muted)]">studiodota.net/{page.slug || "…"}</p>
                </div>
                <div>
                  <label htmlFor="pb-seo-title" className={labelCls}>SEO title</label>
                  <input id="pb-seo-title" className={inputCls} value={page.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={page.title || "Page title"} />
                </div>
                <div>
                  <label htmlFor="pb-seo-desc" className={labelCls}>SEO description</label>
                  <textarea id="pb-seo-desc" rows={3} className={inputCls} value={page.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
                </div>
                <p className="text-xs leading-relaxed text-[var(--muted)]">Click any block in the canvas to edit its content here.</p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
