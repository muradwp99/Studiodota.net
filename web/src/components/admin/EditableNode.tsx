"use client";

import { nodeCss, wrapperAttrs } from "@/lib/nodes/css";
import type { PageBlock } from "@/lib/pageBlocks";
import { blockTypeFor } from "@/lib/pageBlocks";
import { Block } from "@/components/blocks/BlockRenderer";
import { useEditor } from "@/components/admin/editorContext";

const toolbarBtn =
  "grid h-7 w-7 place-items-center rounded bg-[#17191c] text-xs text-[rgba(246,245,242,0.85)] transition-colors hover:bg-[var(--gold)] hover:text-[#17191c] disabled:opacity-30";

export default function EditableNode({
  node,
  siblingCount,
  index,
  parentId,
}: {
  node: PageBlock;
  siblingCount: number;
  index: number;
  parentId: string | null;
}) {
  const ed = useEditor();
  const on = ed.selectedId === node.id;
  const isContainer = node.type === "container";
  const css = nodeCss(node, { solidBox: true });
  const { className, id } = wrapperAttrs(node);
  const kids = node.children ?? [];

  return (
    <div
      className={`${className} relative outline-offset-[-2px] ${on ? "outline outline-2 outline-[var(--gold)]" : "hover:outline hover:outline-1 hover:outline-[var(--line-strong)]"}`}
      id={id}
      data-node={node.id}
      role="button"
      tabIndex={0}
      aria-label={`Select ${blockTypeFor(node.type)?.label ?? node.type} block`}
      onClick={(e) => { e.stopPropagation(); ed.select(node.id); }}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ed.select(node.id); } }}
      onDragOver={(e) => {
        if (!ed.dragActive) return;
        e.preventDefault();
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        const pos = e.clientY < r.top + r.height / 2 ? "before" : "after";
        ed.hover({ parentId, index: pos === "before" ? index : index + 1 });
      }}
      onDrop={(e) => { if (!ed.dragActive) return; e.preventDefault(); e.stopPropagation(); ed.drop(); }}
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}

      {/* drag handle — shown when this node is selected; drags this node for reorder/move */}
      {on && (
        <span
          draggable
          onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", node.id); ed.select(node.id); ed.startDrag(node.id); }}
          onDragEnd={() => ed.endDrag()}
          aria-label="Drag to reorder"
          className="absolute left-1 top-2 z-30 grid h-7 w-6 cursor-grab place-items-center rounded bg-[#17191c] text-[rgba(246,245,242,0.85)] active:cursor-grabbing"
        >⠿</span>
      )}

      {/* drop indicator — gold line at this node's slot boundary (before/after) */}
      {ed.dragActive && ed.dropTarget?.parentId === parentId && (ed.dropTarget.index === index || ed.dropTarget.index === index + 1) && (
        <div className={`pointer-events-none absolute inset-x-0 z-40 h-0.5 bg-[var(--gold)] ${ed.dropTarget.index === index ? "top-0" : "bottom-0"}`} aria-hidden="true" />
      )}

      {/* toolbar — shown only when this node is selected */}
      {on && (
        <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg bg-[#17191c] p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <span className="px-2 font-mono text-[0.62rem] uppercase tracking-wide text-[var(--gold-media)]">{blockTypeFor(node.type)?.label ?? node.type}</span>
          <button type="button" aria-label="Move up" disabled={index === 0} className={toolbarBtn} onClick={() => ed.move(node.id, -1)}>↑</button>
          <button type="button" aria-label="Move down" disabled={index === siblingCount - 1} className={toolbarBtn} onClick={() => ed.move(node.id, 1)}>↓</button>
          <button type="button" aria-label="Duplicate" className={toolbarBtn} onClick={() => ed.duplicate(node.id)}>⧉</button>
          <button type="button" aria-label="Remove" className={`${toolbarBtn} hover:bg-[#a33] hover:text-white`} onClick={() => ed.remove(node.id)}>✕</button>
        </div>
      )}

      {/* the node's own content (links never navigate in edit mode) */}
      <div onClickCapture={(e) => { const a = (e.target as HTMLElement).closest("a"); if (a) e.preventDefault(); }}>
        <Block block={node} ctx={{ serviceOptions: ed.serviceOptions }} edit={(path, value) => ed.edit(node.id, path, value)} />
      </div>

      {/* container children (each a real box, so flex layout treats them as items) */}
      {isContainer && (
        kids.length === 0 ? (
          <div
            className={`m-2 grid min-h-[64px] w-full place-items-center rounded-md border-2 border-dashed border-[var(--line-strong)] text-xs text-[var(--muted)] ${ed.dropTarget?.parentId === node.id ? "border-[var(--gold)] bg-[var(--surface-2)]" : ""}`}
            onDragOver={(e) => { if (!ed.dragActive) return; e.preventDefault(); e.stopPropagation(); ed.hover({ parentId: node.id, index: 0 }); }}
            onDrop={(e) => { if (!ed.dragActive) return; e.preventDefault(); e.stopPropagation(); ed.drop(); }}
          >
            Empty container — select it and add blocks from the ＋ panel
          </div>
        ) : (
          kids.map((child, i) => <EditableNode key={child.id} node={child} siblingCount={kids.length} index={i} parentId={node.id} />)
        )
      )}
    </div>
  );
}
