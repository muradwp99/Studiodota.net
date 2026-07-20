"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { savePage, deletePage, type PageActionState } from "@/lib/actions/pages";
import { blockTypeFor, type PageBlock } from "@/lib/pageBlocks";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import ElementsPanel from "@/components/admin/ElementsPanel";
import FieldsRenderer, { setAt, type Json, type Path } from "@/components/admin/FieldsRenderer";
import StyleRenderer from "@/components/admin/StyleRenderer";
import { STYLE_CONTROLS, ADVANCED_CONTROLS } from "@/lib/nodes/styleControls";
import { inputCls, labelCls, Notice } from "@/components/admin/ui";
import { insertIndexFor, reorderIndexFor } from "@/lib/nodes/dnd";

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

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-md text-lg text-[var(--bone)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-30";
const iconBtnActive = "bg-[var(--gold)] text-[#17191c] hover:bg-[var(--gold-hi)]";

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
  const [tab, setTab] = useState<"content" | "style" | "advanced">("content");
  const [inserterOpen, setInserterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [settingsTab, setSettingsTab] = useState<"page" | "block">("page");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");
  const [dragType, setDragType] = useState<string | null>(null);
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

  // Select a block and reveal its settings.
  const selectBlock = (bid: string) => {
    setSelected(bid);
    setSettingsTab("block");
    setSettingsOpen(true);
  };

  const insertAt = (index: number, type: string) => {
    const bt = blockTypeFor(type);
    if (!bt) return;
    const block: PageBlock = { id: crypto.randomUUID(), type, props: structuredClone(bt.defaults) };
    const blocks = [...page.blocks];
    blocks.splice(index, 0, block);
    set("blocks", blocks);
    selectBlock(block.id);
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
    const copy: PageBlock = {
      id: crypto.randomUUID(),
      type: src.type,
      props: structuredClone(src.props),
      ...(src.style ? { style: structuredClone(src.style) } : {}),
      ...(src.advanced ? { advanced: structuredClone(src.advanced) } : {}),
    };
    const blocks = [...page.blocks];
    blocks.splice(i + 1, 0, copy);
    set("blocks", blocks);
    selectBlock(copy.id);
  };

  const remove = (i: number) => {
    const blocks = page.blocks.filter((_, j) => j !== i);
    set("blocks", blocks);
    setSelected(null);
    setSettingsTab("page");
  };

  const updateSelectedProps = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, props: setAt(b.props, path, value) as Json } : b)));
  };
  const updateSelectedStyle = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, style: setAt(b.style ?? {}, path, value) as Json } : b)));
  };
  const updateSelectedAdvanced = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, advanced: setAt(b.advanced ?? {}, path, value) as Json } : b)));
  };

  // Inline (on-canvas) text edits commit here, keyed by the block's own id.
  const updateBlockProp = (blockId: string, path: (string | number)[], value: string) => {
    set("blocks", page.blocks.map((b) => (b.id === blockId ? { ...b, props: setAt(b.props, path, value) as Json } : b)));
    setState(null);
  };

  const handleDrop = () => {
    if (dragType !== null) {
      const at = overIndex === null ? page.blocks.length : insertIndexFor(overIndex, overPos);
      insertAt(at, dragType);
    } else if (dragIndex !== null && overIndex !== null) {
      const to = reorderIndexFor(dragIndex, overIndex, overPos);
      if (dragIndex !== to) {
        const blocks = [...page.blocks];
        const [moved] = blocks.splice(dragIndex, 1);
        blocks.splice(to, 0, moved);
        set("blocks", blocks);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
    setDragType(null);
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

  const blockToolbarBtn =
    "grid h-7 w-7 place-items-center rounded bg-[#17191c] text-xs text-[rgba(246,245,242,0.85)] transition-colors hover:bg-[var(--gold)] hover:text-[#17191c] disabled:opacity-30";

  const insertIndex = () => (selected ? page.blocks.findIndex((b) => b.id === selected) + 1 : page.blocks.length);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--ink)] text-[var(--bone)]">
      {/* ---- Header bar ---- */}
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-[var(--line)] bg-[var(--surface)] px-2">
        <Link href="/admin/pages" title="Back to Pages" aria-label="Back to Pages" className={iconBtn}>←</Link>
        <button
          type="button"
          title="Add block"
          aria-label="Add block"
          aria-pressed={inserterOpen}
          onClick={() => setInserterOpen((v) => !v)}
          className={`${iconBtn} ${inserterOpen ? iconBtnActive : ""}`}
        >
          {inserterOpen ? "×" : "+"}
        </button>
        <span className="ml-2 hidden text-xs text-[var(--muted)] sm:inline">
          {page.status === "published" ? "Published" : "Draft"}
          {pending && " · saving…"}
        </span>

        <div className="min-w-0 flex-1 truncate px-3 text-center text-sm font-semibold text-[var(--bone-dim)]">
          {page.title || "Untitled page"}
        </div>

        {pageId && page.status === "published" && page.slug && (
          <Link href={`/${page.slug}`} target="_blank" className="rounded-md px-3 py-2 text-sm text-[var(--bone)] transition-colors hover:bg-[var(--surface-2)]">
            View
          </Link>
        )}
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#17191c] transition-colors hover:bg-[var(--gold-hi)] disabled:opacity-50"
        >
          {pending ? "Saving…" : page.status === "published" ? "Update" : "Save draft"}
        </button>
        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          aria-pressed={settingsOpen}
          onClick={() => setSettingsOpen((v) => !v)}
          className={`${iconBtn} ${settingsOpen ? iconBtnActive : ""}`}
        >
          ⚙
        </button>
      </header>

      {state && (
        <div className="shrink-0 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2">
          <Notice state={state} />
        </div>
      )}

      {/* ---- Body ---- */}
      <div className="flex min-h-0 flex-1">
        {/* Left: inserter panel (slides in) */}
        {inserterOpen && (
          <div className="w-72 shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--bone-dim)]">Blocks</span>
              <button type="button" aria-label="Close inserter" onClick={() => setInserterOpen(false)} className="text-[var(--muted)] hover:text-[var(--bone)]">×</button>
            </div>
            <ElementsPanel onInsert={(type) => insertAt(insertIndex(), type)} onDragType={setDragType} />
          </div>
        )}

        {/* Center: canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto my-6 w-[min(100%-2rem,1100px)] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_4px_rgba(17,19,21,0.06)]">
            {/* Title (page metadata) */}
            <div className="px-8 pt-8 md:px-12">
              <input
                aria-label="Page title"
                className="w-full border-0 bg-transparent text-4xl font-extrabold leading-tight outline-none placeholder:text-[var(--muted)]"
                placeholder="Add title"
                value={page.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setPage((p) => ({ ...p, title, slug: slugTouched ? p.slug : slugify(title) }));
                  setState(null);
                }}
              />
            </div>

            {/* Blocks */}
            <div
              className="mt-6 bg-[var(--ink)]"
              onDragOver={(e) => {
                if (dragIndex === null && dragType === null) return;
                e.preventDefault();
                setOverIndex(page.blocks.length ? page.blocks.length - 1 : null);
                setOverPos("after");
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(); }}
            >
              {page.blocks.length === 0 && (
                <div className={`m-4 px-8 py-16 text-center ${dragType ? "rounded-lg border-2 border-dashed border-[var(--gold)] bg-[var(--surface-2)]" : ""}`}>
                  {dragType ? (
                    <p className="text-sm font-semibold text-[var(--gold-ink)]">Drop block here</p>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--muted)]">Empty page.</p>
                      <button
                        type="button"
                        onClick={() => setInserterOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]"
                      >
                        + Add your first block
                      </button>
                    </>
                  )}
                </div>
              )}
              {page.blocks.map((b, i) => {
                const on = selected === b.id;
                return (
                  <div
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${blockTypeFor(b.type)?.label ?? b.type} block`}
                    onClick={() => selectBlock(b.id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        selectBlock(b.id);
                      }
                    }}
                    onDragOver={(e) => {
                      if (dragIndex === null && dragType === null) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      setOverIndex(i);
                      setOverPos(e.clientY < r.top + r.height / 2 ? "before" : "after");
                    }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(); }}
                    className={`group relative transition-shadow ${on ? "ring-2 ring-inset ring-[var(--gold)]" : "hover:ring-1 hover:ring-inset hover:ring-[var(--line-strong)]"} ${dragIndex === i ? "opacity-40" : ""}`}
                  >
                    {(dragIndex !== null || dragType !== null) && overIndex === i && (
                      <div className={`pointer-events-none absolute inset-x-0 z-40 h-0.5 bg-[var(--gold)] ${overPos === "before" ? "top-0" : "bottom-0"}`} aria-hidden="true" />
                    )}
                    <span
                      draggable
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", b.id); selectBlock(b.id); setDragIndex(i); }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                      aria-label="Drag to reorder"
                      className="absolute left-1 top-1/2 z-30 grid h-7 w-6 -translate-y-1/2 cursor-grab place-items-center rounded bg-[#17191c] text-[rgba(246,245,242,0.85)] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                    >
                      ⠿
                    </span>
                    {/* Block toolbar (on select or hover) */}
                    <div className={`absolute right-3 top-3 z-30 flex items-center gap-1 rounded-lg bg-[#17191c] p-1 shadow-lg transition-opacity ${on ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} onClick={(e) => e.stopPropagation()}>
                      <span className="px-2 font-mono text-[0.62rem] uppercase tracking-wide text-[var(--gold-media)]">{blockTypeFor(b.type)?.label ?? b.type}</span>
                      <button type="button" aria-label="Move up" disabled={i === 0} className={blockToolbarBtn} onClick={() => move(i, -1)}>↑</button>
                      <button type="button" aria-label="Move down" disabled={i === page.blocks.length - 1} className={blockToolbarBtn} onClick={() => move(i, 1)}>↓</button>
                      <button type="button" aria-label="Duplicate" className={blockToolbarBtn} onClick={() => duplicate(i)}>⧉</button>
                      <button type="button" aria-label="Remove" className={`${blockToolbarBtn} hover:bg-[#a33] hover:text-white`} onClick={() => remove(i)}>✕</button>
                    </div>
                    {/* Live block — text is click-to-edit; links never navigate here. */}
                    <div onClickCapture={(e) => { const a = (e.target as HTMLElement).closest("a"); if (a) e.preventDefault(); }}>
                      <BlockRenderer blocks={[b]} ctx={{ serviceOptions }} edit={updateBlockProp} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: settings sidebar */}
        {settingsOpen && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)]">
            <div className="flex border-b border-[var(--line)]">
              {(["page", "block"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSettingsTab(t)}
                  className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] capitalize transition-colors ${settingsTab === t ? "border-b-2 border-[var(--gold)] text-[var(--bone)]" : "text-[var(--muted)] hover:text-[var(--bone)]"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-4">
              {settingsTab === "block" ? (
                selectedBlock && selectedType ? (
                  <>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.08em]">{selectedType.label}</h2>
                    <div className="mb-4 flex rounded-lg border border-[var(--line-strong)] p-0.5">
                      {(["content", "style", "advanced"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={tab === t}
                          onClick={() => setTab(t)}
                          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)]"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {tab === "content" && (
                      selectedType.fields.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">This block has no content settings.</p>
                      ) : (
                        <FieldsRenderer fields={selectedType.fields} data={selectedBlock.props as Json} onChange={updateSelectedProps} idPrefix={`blk.${selectedBlock.id}`} />
                      )
                    )}
                    {tab === "style" && (
                      <StyleRenderer controls={STYLE_CONTROLS} data={(selectedBlock.style ?? {}) as Json} onChange={updateSelectedStyle} />
                    )}
                    {tab === "advanced" && (
                      <StyleRenderer controls={ADVANCED_CONTROLS} data={(selectedBlock.advanced ?? {}) as Json} onChange={updateSelectedAdvanced} />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted)]">Select a block on the canvas to edit its settings.</p>
                )
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Status</label>
                    <select aria-label="Status" className={inputCls} value={page.status} onChange={(e) => set("status", e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pb-slug" className={labelCls}>Slug (address)</label>
                    <input
                      id="pb-slug"
                      className={`${inputCls} font-mono text-xs`}
                      value={page.slug}
                      placeholder="my-new-page"
                      onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
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
                  {pageId && (
                    <button type="button" onClick={destroy} disabled={pending} className="mt-2 text-sm text-[#a33] hover:underline disabled:opacity-50">
                      Move to Trash
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
