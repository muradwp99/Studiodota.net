"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePost, deletePost, type ActionState } from "@/lib/actions/collections";
import MediaPicker from "@/components/admin/MediaPicker";
import { inputCls, labelCls, btnPrimaryCls, btnGhostCls, btnDangerCls, Notice } from "@/components/admin/ui";

export type PostSectionInput = { id: string; heading: string; body: string[] };
export type PostInput = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: number;
  image: string;
  inlineImage: string;
  authorName: string;
  authorRole: string;
  intro: string;
  sections: PostSectionInput[];
  published: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export default function PostForm({ id, initial, categories = [] }: { id: string | null; initial: PostInput; categories?: string[] }) {
  const [data, setData] = useState(initial);
  const [state, setState] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const [picker, setPicker] = useState<"image" | "inlineImage" | null>(null);
  const [newCategory, setNewCategory] = useState(!categories.includes(initial.category) && initial.category !== "");
  const router = useRouter();

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setState(null);
  };
  const setSection = (i: number, patch: Partial<PostSectionInput>) =>
    set("sections", data.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const save = () =>
    startTransition(async () => {
      const clean = {
        ...data,
        sections: data.sections.map((s) => ({
          ...s,
          id: s.id || slugify(s.heading),
          body: s.body.map((b) => b.trim()).filter(Boolean),
        })),
      };
      const res = await savePost(id, clean);
      setState(res);
      if (res.ok && !id) router.push("/admin/posts");
    });

  const remove = () => {
    if (!id) return;
    if (!window.confirm(`Delete "${data.title}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deletePost(id);
    });
  };

  const imageField = (key: "image" | "inlineImage", label: string) => (
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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={labelCls}>Title</label>
          <input
            id="title"
            className={inputCls}
            value={data.title}
            onChange={(e) => {
              const title = e.target.value;
              setData((d) => ({ ...d, title, slug: id ? d.slug : slugify(title) }));
              setState(null);
            }}
          />
        </div>
        <div>
          <label htmlFor="slug" className={labelCls}>Slug (URL)</label>
          <input id="slug" className={`${inputCls} font-mono text-xs`} value={data.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="excerpt" className={labelCls}>Excerpt</label>
        <textarea id="excerpt" rows={2} className={inputCls} value={data.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="category" className={labelCls}>
            Category{" "}
            <button
              type="button"
              className="normal-case text-[var(--gold-ink)] underline"
              onClick={() => setNewCategory((v) => !v)}
            >
              {newCategory ? "pick existing" : "new"}
            </button>
          </label>
          {newCategory || categories.length === 0 ? (
            <input id="category" className={inputCls} value={data.category} placeholder="New category name" onChange={(e) => set("category", e.target.value)} />
          ) : (
            <select id="category" className={inputCls} value={data.category} onChange={(e) => set("category", e.target.value)}>
              {!categories.includes(data.category) && <option value={data.category}>{data.category}</option>}
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="date" className={labelCls}>Date</label>
          <input id="date" type="date" className={inputCls} value={data.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <label htmlFor="readingTime" className={labelCls}>Reading time (min)</label>
          <input id="readingTime" type="number" min={1} className={inputCls} value={data.readingTime} onChange={(e) => set("readingTime", Number(e.target.value) || 1)} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={data.published} onChange={(e) => set("published", e.target.checked)} />
            Published
          </label>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="authorName" className={labelCls}>Author name</label>
          <input id="authorName" className={inputCls} value={data.authorName} onChange={(e) => set("authorName", e.target.value)} />
        </div>
        <div>
          <label htmlFor="authorRole" className={labelCls}>Author role</label>
          <input id="authorRole" className={inputCls} value={data.authorRole} onChange={(e) => set("authorRole", e.target.value)} />
        </div>
      </div>
      {imageField("image", "Cover image")}
      {imageField("inlineImage", "Inline image (appears after section 2)")}
      <div>
        <label htmlFor="intro" className={labelCls}>Intro paragraph</label>
        <textarea id="intro" rows={3} className={inputCls} value={data.intro} onChange={(e) => set("intro", e.target.value)} />
      </div>

      <fieldset className="rounded-xl border border-[var(--line)] p-4">
        <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--bone-dim)]">Article sections</legend>
        <div className="space-y-4">
          {data.sections.map((s, i) => (
            <div key={i} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--muted)]">Section {i + 1}</span>
                <span className="flex gap-1.5">
                  <button type="button" aria-label="Move up" disabled={i === 0} className="rounded px-2 py-0.5 text-xs text-[var(--bone-dim)] hover:bg-[var(--surface-2)] disabled:opacity-30" onClick={() => { const next = [...data.sections]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set("sections", next); }}>↑</button>
                  <button type="button" aria-label="Move down" disabled={i === data.sections.length - 1} className="rounded px-2 py-0.5 text-xs text-[var(--bone-dim)] hover:bg-[var(--surface-2)] disabled:opacity-30" onClick={() => { const next = [...data.sections]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; set("sections", next); }}>↓</button>
                  <button type="button" className="rounded px-2 py-0.5 text-xs text-[#a33] hover:bg-[#a33]/10" onClick={() => set("sections", data.sections.filter((_, j) => j !== i))}>Remove</button>
                </span>
              </div>
              <div className="space-y-3">
                <input aria-label={`Section ${i + 1} heading`} className={inputCls} value={s.heading} placeholder="Section heading" onChange={(e) => setSection(i, { heading: e.target.value, id: slugify(e.target.value) })} />
                <textarea aria-label={`Section ${i + 1} body`} rows={5} className={inputCls} value={s.body.join("\n\n")} placeholder="Body — separate paragraphs with a blank line" onChange={(e) => setSection(i, { body: e.target.value.split(/\n\s*\n/) })} />
              </div>
            </div>
          ))}
          <button type="button" className={btnGhostCls} onClick={() => set("sections", [...data.sections, { id: "", heading: "", body: [""] }])}>
            + Add section
          </button>
        </div>
      </fieldset>

      <Notice state={state} />
      <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
        <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : id ? "Save article" : "Create article"}
        </button>
        {id && (
          <button type="button" onClick={remove} disabled={pending} className={btnDangerCls}>
            Delete article
          </button>
        )}
      </div>
      <MediaPicker open={picker !== null} onClose={() => setPicker(null)} onSelect={(p) => picker && set(picker, p)} />
    </div>
  );
}
