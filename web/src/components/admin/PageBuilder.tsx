"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { savePage, deletePage, type PageActionState } from "@/lib/actions/pages";
import { blockTypeFor, type PageBlock } from "@/lib/pageBlocks";
import type { Breakpoint } from "@/lib/nodes/types";
import ElementsPanel from "@/components/admin/ElementsPanel";
import FieldsRenderer, { setAt, type Json, type Path } from "@/components/admin/FieldsRenderer";
import StyleRenderer from "@/components/admin/StyleRenderer";
import { STYLE_CONTROLS, ADVANCED_CONTROLS } from "@/lib/nodes/styleControls";
import { inputCls, labelCls, Notice } from "@/components/admin/ui";
import { findNode, findParent, updateNode, updateSiblings, removeNode, duplicateNode, insertNode, moveNode } from "@/lib/nodes/tree";
import { treeDepth } from "@/lib/nodes/walk";
import EditableNode from "@/components/admin/EditableNode";
import { EditorContext } from "@/components/admin/editorContext";

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
const MAX_DEPTH = 6;

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
  const [device, setDevice] = useState<Breakpoint>("base");
  const [tab, setTab] = useState<"content" | "style" | "advanced">("content");
  const [inserterOpen, setInserterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [settingsTab, setSettingsTab] = useState<"page" | "block">("page");
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [state, setState] = useState<PageActionState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);       // reorder source node id
  const [dragType, setDragType] = useState<string | null>(null);   // palette insert type
  const [dropTarget, setDropTarget] = useState<{ parentId: string | null; index: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = <K extends keyof PageInput>(k: K, v: PageInput[K]) => {
    setPage((p) => ({ ...p, [k]: v }));
    setState(null);
  };

  const selectedBlock = selected ? findNode(page.blocks, selected) : null;
  const selectedType = selectedBlock ? blockTypeFor(selectedBlock.type) : null;

  // Select a block and reveal its settings.
  const selectBlock = (bid: string) => {
    setSelected(bid);
    setSettingsTab("block");
    setSettingsOpen(true);
  };

  // Where a palette insert lands: inside the selected container (append), else after the
  // selected node in its parent, else at the top level end.
  const insertTarget = (): { parentId: string | null; index: number } => {
    if (!selected) return { parentId: null, index: page.blocks.length };
    const node = findNode(page.blocks, selected);
    if (node?.type === "container") return { parentId: node.id, index: node.children?.length ?? 0 };
    const loc = findParent(page.blocks, selected);
    if (!loc) return { parentId: null, index: page.blocks.length };
    return { parentId: loc.parent?.id ?? null, index: loc.index + 1 };
  };

  const insertAt = (target: { parentId: string | null; index: number }, type: string) => {
    const bt = blockTypeFor(type);
    if (!bt) return;
    const block: PageBlock = { id: crypto.randomUUID(), type, props: structuredClone(bt.defaults) };
    const next = insertNode(page.blocks, target, block);
    if (treeDepth(next) > MAX_DEPTH) {
      setState({ error: `Blocks can nest at most ${MAX_DEPTH} levels deep.` });
      return;
    }
    set("blocks", next);
    selectBlock(block.id);
  };

  const move = (id: string, dir: -1 | 1) => {
    const loc = findParent(page.blocks, id);
    if (!loc) return;
    set("blocks", updateSiblings(page.blocks, loc.parent?.id ?? null, (sibs) => {
      const i = sibs.findIndex((b) => b.id === id);
      const j = i + dir;
      if (j < 0 || j >= sibs.length) return sibs;
      const next = [...sibs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    }));
  };

  const duplicate = (id: string) => {
    const { tree, newId } = duplicateNode(page.blocks, id);
    set("blocks", tree);
    selectBlock(newId);
  };

  const remove = (id: string) => {
    set("blocks", removeNode(page.blocks, id));
    setSelected(null);
    setSettingsTab("page");
  };

  const handleDrop = () => {
    const target = dropTarget;
    setDragId(null); setDragType(null); setDropTarget(null);
    if (!target) return;
    if (dragType !== null) {
      const bt = blockTypeFor(dragType);
      if (!bt) return;
      const block: PageBlock = { id: crypto.randomUUID(), type: dragType, props: structuredClone(bt.defaults) };
      const next = insertNode(page.blocks, target, block);
      if (treeDepth(next) > MAX_DEPTH) { setState({ error: `Blocks can nest at most ${MAX_DEPTH} levels deep.` }); return; }
      set("blocks", next);
      selectBlock(block.id);
    } else if (dragId !== null) {
      const next = moveNode(page.blocks, dragId, target);
      if (treeDepth(next) > MAX_DEPTH) { setState({ error: `Blocks can nest at most ${MAX_DEPTH} levels deep.` }); return; }
      set("blocks", next);
    }
  };

  const updateSelectedProps = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", updateNode(page.blocks, selectedBlock.id, (b) => ({ ...b, props: setAt(b.props, path, value) as Json })));
  };
  const updateSelectedStyle = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", updateNode(page.blocks, selectedBlock.id, (b) => ({ ...b, style: setAt(b.style ?? {}, path, value) as Json })));
  };
  const updateSelectedAdvanced = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", updateNode(page.blocks, selectedBlock.id, (b) => ({ ...b, advanced: setAt(b.advanced ?? {}, path, value) as Json })));
  };

  // Inline (on-canvas) text edits commit here, keyed by the block's own id.
  const updateBlockProp = (blockId: string, path: (string | number)[], value: string) => {
    set("blocks", updateNode(page.blocks, blockId, (b) => ({ ...b, props: setAt(b.props, path, value) as Json })));
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
    if (!window.confirm(`Delete "${page.title || page.slug}"? It moves to Trash - you can restore it any time.`)) return;
    startTransition(async () => {
      await deletePage(pageId);
    });
  };

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

        <div className="mr-1 hidden items-center gap-0.5 rounded-lg border border-[var(--line-strong)] p-0.5 md:flex" role="group" aria-label="Preview device">
          {([["base", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]] as const).map(([bp, label]) => (
            <button
              key={bp}
              type="button"
              aria-pressed={device === bp}
              onClick={() => setDevice(bp)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${device === bp ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)]"}`}
            >
              {label}
            </button>
          ))}
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
            <ElementsPanel
              onInsert={(type) => insertAt(insertTarget(), type)}
              onDragType={(t) => { setDragType(t); if (t === null) setDropTarget(null); }}
            />
          </div>
        )}

        {/* Center: canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className={`mx-auto my-6 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_4px_rgba(17,19,21,0.06)] transition-[width] ${device === "mobile" ? "w-[min(100%-2rem,390px)]" : device === "tablet" ? "w-[min(100%-2rem,1024px)]" : "w-[min(100%-2rem,1100px)]"}`}>
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
                if (dragId === null && dragType === null) return;
                e.preventDefault();
                setDropTarget({ parentId: null, index: page.blocks.length });
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(); }}
            >
              {page.blocks.length === 0 && (
                <div className={`m-4 px-8 py-16 text-center ${dragId !== null || dragType !== null ? "rounded-lg border-2 border-dashed border-[var(--gold)] bg-[var(--surface-2)]" : ""}`}>
                  {dragId !== null || dragType !== null ? (
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
              <EditorContext.Provider
                value={{
                  serviceOptions, selectedId: selected, device, select: selectBlock, edit: updateBlockProp, move, duplicate, remove,
                  dragActive: dragId !== null || dragType !== null,
                  dropTarget,
                  startDrag: setDragId,
                  endDrag: () => { setDragId(null); setDropTarget(null); },
                  hover: setDropTarget,
                  drop: handleDrop,
                }}
              >
                {page.blocks.map((b, i) => (
                  <EditableNode key={b.id} node={b} siblingCount={page.blocks.length} index={i} parentId={null} />
                ))}
              </EditorContext.Provider>
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
                      <StyleRenderer controls={STYLE_CONTROLS} data={(selectedBlock.style ?? {}) as Json} onChange={updateSelectedStyle} device={device} />
                    )}
                    {tab === "advanced" && (
                      <StyleRenderer controls={ADVANCED_CONTROLS} data={(selectedBlock.advanced ?? {}) as Json} onChange={updateSelectedAdvanced} device={device} />
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
