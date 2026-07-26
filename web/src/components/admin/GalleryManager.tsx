"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGalleryItem, deleteGalleryItem, reorderGalleryItems, revertGalleryItem, type ActionState } from "@/lib/actions/collections";
import MediaPicker from "@/components/admin/MediaPicker";
import { inputCls, labelCls, btnPrimaryCls, btnGhostCls, btnDangerCls, Notice, timeAgo } from "@/components/admin/ui";

export type GalleryInput = {
  id: string | null;
  title: string;
  sector: string;
  image: string;
  category: string;
  type: string;
  youtubeId: string;
  tall: boolean;
  published: boolean;
  sort: number;
  snapshotAt: Date | null;
};

function ItemForm({ item, categories, onDone }: { item: GalleryInput; categories: string[]; onDone?: () => void }) {
  const [data, setData] = useState(item);
  const [state, setState] = useState<ActionState | null>(null);
  const [snapAt, setSnapAt] = useState(item.snapshotAt);
  const [pending, startTransition] = useTransition();
  const [picker, setPicker] = useState(false);
  const router = useRouter();

  const set = <K extends keyof GalleryInput>(k: K, v: GalleryInput[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setState(null);
  };

  const save = () =>
    startTransition(async () => {
      const { id, ...payload } = data;
      const res = await saveGalleryItem(id, payload);
      setState(res);
      if (res.ok) {
        router.refresh();
        onDone?.();
      }
    });

  const remove = () => {
    if (!data.id) return;
    if (!window.confirm(`Delete "${data.title}" from the gallery?`)) return;
    startTransition(async () => {
      const res = await deleteGalleryItem(data.id!);
      if (res.error) setState(res);
      else router.refresh();
    });
  };

  const revert = () => {
    if (!data.id) return;
    if (!window.confirm("Revert to the last saved version? Any unsaved changes here will be lost.")) return;
    startTransition(async () => {
      const res = await revertGalleryItem(data.id!);
      if (res.error) { setState(res); return; }
      if (res.data) setData((d) => ({ ...d, ...(res.data as unknown as GalleryInput), id: d.id }));
      setSnapAt(null);
      setState({ ok: true, savedAt: Date.now() });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Title</label>
          <input className={inputCls} value={data.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Sector label</label>
          <input className={inputCls} value={data.sector} onChange={(e) => set("sector", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Image</label>
        <div className="flex items-center gap-3">
          {data.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt="" className="h-12 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
          ) : (
            <span className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-dashed border-[var(--line-strong)] text-[0.6rem] text-[var(--muted)]">none</span>
          )}
          <input className={inputCls} value={data.image} onChange={(e) => set("image", e.target.value)} placeholder="/media/… or /uploads/…" />
          <button type="button" className={btnGhostCls} onClick={() => setPicker(true)}>Browse</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelCls}>Category</label>
          <select className={inputCls} value={data.category} onChange={(e) => set("category", e.target.value)}>
            {!categories.includes(data.category) && <option value={data.category}>{data.category}</option>}
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={data.type} onChange={(e) => set("type", e.target.value)}>
            <option value="photo">photo</option>
            <option value="video">video</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>YouTube ID <span className="normal-case text-[var(--muted)]">(video only)</span></label>
          <input className={`${inputCls} font-mono text-xs`} value={data.youtubeId} onChange={(e) => set("youtubeId", e.target.value)} placeholder="dQw4w9WgXcQ" />
        </div>
        <div>
          <label className={labelCls}>Order</label>
          <input type="number" className={inputCls} value={data.sort} onChange={(e) => set("sort", Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={data.tall} onChange={(e) => set("tall", e.target.checked)} />
          Tall tile (spans two rows)
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={data.published} onChange={(e) => set("published", e.target.checked)} />
          Published
        </label>
      </div>
      {data.id && snapAt && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/40 px-4 py-2.5 text-sm">
          <button type="button" onClick={revert} disabled={pending} className={btnGhostCls}>Revert to last saved version</button>
          <span className="text-[var(--muted)]">Saved {timeAgo(snapAt)}</span>
        </div>
      )}
      <Notice state={state} />
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : data.id ? "Save item" : "Add item"}
        </button>
        {data.id && (
          <button type="button" onClick={remove} disabled={pending} className={btnDangerCls}>Delete</button>
        )}
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={(p) => set("image", p)} />
    </div>
  );
}

export default function GalleryManager({ items, categories }: { items: GalleryInput[]; categories: string[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Resync local order when the server gives us a fresh `items` array (e.g.
  // after an add/delete) without clobbering an in-progress drag reorder.
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
      const fi = cur.findIndex((it) => it.id === from);
      const ti = cur.findIndex((it) => it.id === to);
      if (fi < 0 || ti < 0) return cur;
      const next = [...cur];
      const [moved] = next.splice(fi, 1);
      next.splice(ti, 0, moved);
      reorderGalleryItems(next.map((it) => it.id!)).then((res) => { if (res.error) setList(items); });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <button type="button" className={btnPrimaryCls} onClick={() => setAdding((a) => !a)}>
        {adding ? "Close" : "+ Add gallery item"}
      </button>
      {adding && (
        <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--surface)] p-5">
          <ItemForm
            item={{ id: null, title: "", sector: "", image: "", category: categories[0] ?? "", type: "photo", youtubeId: "", tall: false, published: true, sort: list.length, snapshotAt: null }}
            categories={categories}
            onDone={() => setAdding(false)}
          />
        </div>
      )}
      <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {list.map((it) => (
          <li
            key={it.id}
            onDragOver={(e) => { if (dragId && dragId !== it.id) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, it.id!); setDragId(null); }}
            className={`px-5 py-3.5 ${dragId === it.id ? "opacity-40" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span
                draggable
                aria-label="Drag to reorder"
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", it.id!); setDragId(it.id); }}
                onDragEnd={() => setDragId(null)}
                className="shrink-0 cursor-grab select-none text-[var(--muted)] active:cursor-grabbing"
              >
                ⠿
              </span>
              <button type="button" className="flex min-w-0 flex-1 items-center gap-4 text-left" onClick={() => setOpenId(openId === it.id ? null : it.id)} aria-expanded={openId === it.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image} alt="" className="h-11 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{it.title}</span>
                  <span className="font-mono text-[0.65rem] text-[var(--muted)]">
                    {it.category} · {it.type}{it.type === "video" && it.youtubeId ? ` · ${it.youtubeId}` : ""}{it.tall ? " · tall" : ""}{!it.published ? " · hidden" : ""}
                  </span>
                </span>
                <span className="text-[var(--muted)]" aria-hidden="true">{openId === it.id ? "▴" : "▾"}</span>
              </button>
            </div>
            {openId === it.id && (
              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <ItemForm item={it} categories={categories} onDone={() => setOpenId(null)} />
              </div>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">The gallery is empty.</li>}
      </ul>
    </div>
  );
}
