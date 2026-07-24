"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProject, deleteProject, type ActionState } from "@/lib/actions/collections";
import MediaPicker from "@/components/admin/MediaPicker";
import { SeoFields } from "@/components/admin/SeoFields";
import { inputCls, labelCls, btnPrimaryCls, btnGhostCls, btnDangerCls, Notice } from "@/components/admin/ui";

export type ProjectInput = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  sector: string;
  location: string;
  year: string;
  services: string[];
  heroImage: string;
  interiorImage: string;
  gallery: string[];
  published: boolean;
  sort: number;
  seoTitle: string;
  seoDescription: string;
  noindex: boolean;
};

const CATEGORIES = [
  "single-family", "multifamily", "affordable-housing", "mixed-use",
  "commercial", "office", "senior-living",
];

export default function ProjectForm({ id, initial }: { id: string | null; initial: ProjectInput }) {
  const [data, setData] = useState(initial);
  const [state, setState] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const [picker, setPicker] = useState<"heroImage" | "interiorImage" | "gallery" | null>(null);
  const router = useRouter();

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setState(null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveProject(id, data);
      setState(res);
      if (res.ok && !id) router.push("/admin/projects");
    });

  const remove = () => {
    if (!id) return;
    if (!window.confirm(`Delete "${data.title}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteProject(id);
    });
  };

  const imageField = (key: "heroImage" | "interiorImage", label: string) => (
    <div>
      <label htmlFor={key} className={labelCls}>{label}</label>
      <div className="flex items-center gap-3">
        {data[key] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data[key]} alt="" className="h-12 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
        ) : (
          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-dashed border-[var(--line-strong)] text-[0.6rem] text-[var(--muted)]">none</span>
        )}
        <input id={key} className={inputCls} value={data[key]} onChange={(e) => set(key, e.target.value)} placeholder="/media/… or /uploads/…" />
        <button type="button" className={btnGhostCls} onClick={() => setPicker(key)}>Browse</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={labelCls}>Title</label>
          <input id="title" className={inputCls} value={data.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label htmlFor="slug" className={labelCls}>Slug (URL)</label>
          <input id="slug" className={`${inputCls} font-mono text-xs`} value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-project" />
        </div>
      </div>
      <div>
        <label htmlFor="summary" className={labelCls}>Summary</label>
        <textarea id="summary" rows={3} className={inputCls} value={data.summary} onChange={(e) => set("summary", e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="category" className={labelCls}>Category</label>
          <select id="category" className={inputCls} value={data.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sector" className={labelCls}>Sector label</label>
          <input id="sector" className={inputCls} value={data.sector} onChange={(e) => set("sector", e.target.value)} />
        </div>
        <div>
          <label htmlFor="location" className={labelCls}>Location</label>
          <input id="location" className={inputCls} value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="London, UK" />
        </div>
        <div>
          <label htmlFor="year" className={labelCls}>Year</label>
          <input id="year" className={inputCls} value={data.year} onChange={(e) => set("year", e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="services" className={labelCls}>Services <span className="normal-case text-[var(--muted)]">(one per line)</span></label>
        <textarea id="services" rows={3} className={`${inputCls} font-mono text-xs`} value={data.services.join("\n")} onChange={(e) => set("services", e.target.value.split("\n"))} />
      </div>
      {imageField("heroImage", "Hero image")}
      {imageField("interiorImage", "Interior / detail image (optional)")}
      <div>
        <span className={labelCls}>Gallery <span className="normal-case text-[var(--muted)]">(shown on the project page, in order)</span></span>
        <div className="space-y-2">
          {data.gallery.map((path, i) => (
            <div key={`${path}-${i}`} className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={path} alt="" className="h-12 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
              <input
                aria-label={`Gallery image ${i + 1}`}
                className={`${inputCls} order-last w-full min-w-0 font-mono text-xs sm:order-none sm:w-auto sm:flex-1`}
                value={path}
                onChange={(e) => set("gallery", data.gallery.map((g, j) => (j === i ? e.target.value : g)))}
              />
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                <button type="button" className={btnGhostCls} disabled={i === 0} aria-label="Move up"
                  onClick={() => { const g = [...data.gallery]; [g[i - 1], g[i]] = [g[i], g[i - 1]]; set("gallery", g); }}>↑</button>
                <button type="button" className={btnGhostCls} disabled={i === data.gallery.length - 1} aria-label="Move down"
                  onClick={() => { const g = [...data.gallery]; [g[i + 1], g[i]] = [g[i], g[i + 1]]; set("gallery", g); }}>↓</button>
                <button type="button" className={btnDangerCls} aria-label="Remove"
                  onClick={() => set("gallery", data.gallery.filter((_, j) => j !== i))}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" className={btnGhostCls} onClick={() => setPicker("gallery")}>+ Add image</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={data.published} onChange={(e) => set("published", e.target.checked)} />
          Published
        </label>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-[var(--bone-dim)]">Order</label>
          <input id="sort" type="number" className={`${inputCls} w-24`} value={data.sort} onChange={(e) => set("sort", Number(e.target.value) || 0)} />
        </div>
      </div>
      <SeoFields
        seoTitle={data.seoTitle}
        seoDescription={data.seoDescription}
        noindex={data.noindex}
        fallbackTitle={data.title}
        onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
      />
      <Notice state={state} />
      <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
        <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : id ? "Save project" : "Create project"}
        </button>
        {id && (
          <button type="button" onClick={remove} disabled={pending} className={btnDangerCls}>
            Delete project
          </button>
        )}
      </div>
      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(p) => {
          if (picker === "gallery") set("gallery", [...data.gallery, p]);
          else if (picker) set(picker, p);
        }}
      />
    </div>
  );
}
