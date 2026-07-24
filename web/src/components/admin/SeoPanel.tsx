"use client";

import { useMemo, useState } from "react";
import MediaPicker from "@/components/admin/MediaPicker";
import { analyzeSeo, type SeoBlob } from "@/lib/seoScore";
import { inputCls, labelCls } from "@/components/admin/ui";

/**
 * RankMath-style SEO meta box: focus keyword, live content-analysis score,
 * Google preview, and General / Social / Advanced tabs. Works for any entity —
 * pages, projects, posts — bound to its `seo` blob.
 */
type Ctx = { baseTitle?: string; slug?: string; content?: string; path?: string; fallbackImage?: string };

const clamp = (n: number, max: number) => Math.min(100, Math.round((n / max) * 100));
const barColor = (len: number, lo: number, hi: number) =>
  len === 0 ? "var(--line-strong)" : len >= lo && len <= hi ? "#3a9d6e" : "#c99a3a";

export default function SeoPanel({ value, onChange, ctx = {} }: { value: SeoBlob; onChange: (v: SeoBlob) => void; ctx?: Ctx }) {
  const [tab, setTab] = useState<"general" | "social" | "advanced">("general");
  const [picker, setPicker] = useState<"ogImage" | "twitterImage" | null>(null);
  const v = value || {};
  const set = <K extends keyof SeoBlob>(k: K, val: SeoBlob[K]) => onChange({ ...v, [k]: val });

  const result = useMemo(
    () => analyzeSeo({ seoTitle: v.title || ctx.baseTitle, seoDescription: v.description, focusKeyword: v.focusKeyword, slug: ctx.slug, content: ctx.content }),
    [v.title, v.description, v.focusKeyword, ctx.baseTitle, ctx.slug, ctx.content],
  );

  const previewTitle = (v.title || ctx.baseTitle || "Page title").slice(0, 62);
  const previewDesc = (v.description || "Add a meta description to control the snippet shown in search results.").slice(0, 165);
  const previewUrl = "studiodota.net" + (ctx.path || (ctx.slug ? `/${ctx.slug}` : ""));
  const scoreColor = result.score >= 80 ? "#3a9d6e" : result.score >= 50 ? "#c99a3a" : "#c05a4d";

  const titleLen = (v.title || "").length;
  const descLen = (v.description || "").length;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1 text-sm">
          {(["general", "social", "advanced"] as const).map((tb) => (
            <button key={tb} type="button" onClick={() => setTab(tb)}
              className={`rounded-full px-3.5 py-1.5 capitalize transition-colors ${tab === tb ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:text-[var(--bone)]"}`}>
              {tb}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white" style={{ background: scoreColor }}>{result.score}</span>
          <span className="text-sm font-semibold" style={{ color: scoreColor }}>{result.label}</span>
        </div>
      </div>

      {/* Google preview — same on every tab */}
      <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--ink)] p-4">
        <div className="text-[0.7rem] text-[var(--muted)]">Search preview</div>
        <div className="mt-1.5 truncate font-mono text-xs text-[#3a7d3a]">{previewUrl}</div>
        <div className="mt-0.5 truncate text-lg text-[#1a56c4]" style={{ fontFamily: "arial, sans-serif" }}>{previewTitle}</div>
        <div className="mt-0.5 line-clamp-2 text-sm text-[var(--bone-dim)]">{previewDesc}</div>
      </div>

      {tab === "general" && (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="focusKeyword" className={labelCls}>Focus keyword <span className="font-normal normal-case text-[var(--muted)]">— what this page should rank for</span></label>
            <input id="focusKeyword" className={inputCls} value={v.focusKeyword || ""} onChange={(e) => set("focusKeyword", e.target.value)} placeholder="e.g. senior housing architect" />
          </div>
          <div>
            <label htmlFor="seoTitle" className={labelCls}>SEO title</label>
            <input id="seoTitle" className={inputCls} value={v.title || ""} onChange={(e) => set("title", e.target.value)} placeholder={ctx.baseTitle || "Defaults to the page title"} />
            <Meter len={titleLen} lo={15} hi={60} max={60} />
          </div>
          <div>
            <label htmlFor="seoDescription" className={labelCls}>Meta description</label>
            <textarea id="seoDescription" rows={2} className={inputCls} value={v.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Leave blank to use the summary/excerpt" />
            <Meter len={descLen} lo={120} hi={160} max={160} />
          </div>
          <ul className="space-y-1.5 rounded-xl border border-[var(--line)] p-4">
            {result.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 text-sm">
                <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] text-white"
                  style={{ background: c.status === "good" ? "#3a9d6e" : c.status === "ok" ? "#c99a3a" : "#c05a4d" }}>
                  {c.status === "good" ? "✓" : c.status === "ok" ? "!" : "×"}
                </span>
                <span className="text-[var(--bone-dim)]">{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "social" && (
        <div className="mt-5 space-y-4">
          <p className="text-xs text-[var(--muted)]">Override how this page looks when shared. Blank fields fall back to the SEO title/description and the share image below.</p>
          <ImgField label="Social share image (Open Graph)" value={v.ogImage || ""} onPick={() => setPicker("ogImage")} onChange={(val) => set("ogImage", val)} fallback={ctx.fallbackImage} />
          <div><label className={labelCls}>Facebook / OG title</label><input className={inputCls} value={v.ogTitle || ""} onChange={(e) => set("ogTitle", e.target.value)} /></div>
          <div><label className={labelCls}>Facebook / OG description</label><textarea rows={2} className={inputCls} value={v.ogDescription || ""} onChange={(e) => set("ogDescription", e.target.value)} /></div>
          <ImgField label="Twitter image" value={v.twitterImage || ""} onPick={() => setPicker("twitterImage")} onChange={(val) => set("twitterImage", val)} fallback={ctx.fallbackImage} />
          <div><label className={labelCls}>Twitter title</label><input className={inputCls} value={v.twitterTitle || ""} onChange={(e) => set("twitterTitle", e.target.value)} /></div>
          <div><label className={labelCls}>Twitter description</label><textarea rows={2} className={inputCls} value={v.twitterDescription || ""} onChange={(e) => set("twitterDescription", e.target.value)} /></div>
        </div>
      )}

      {tab === "advanced" && (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="canonical" className={labelCls}>Canonical URL <span className="font-normal normal-case text-[var(--muted)]">— override only to point elsewhere</span></label>
            <input id="canonical" className={`${inputCls} font-mono text-xs`} value={v.canonical || ""} onChange={(e) => set("canonical", e.target.value)} placeholder={ctx.path || "auto"} />
          </div>
          <fieldset className="space-y-2.5">
            <legend className={labelCls}>Robots meta</legend>
            {([["noindex", "No index — keep this page out of search results"], ["nofollow", "No follow — don't pass link authority from this page"], ["noarchive", "No archive — no cached copy in search engines"]] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={Boolean(v[key])} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
      )}

      <MediaPicker open={picker !== null} onClose={() => setPicker(null)} onSelect={(p) => { if (picker) set(picker, p); }} />
    </div>
  );
}

function Meter({ len, lo, hi, max }: { len: number; lo: number; hi: number; max: number }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
        <div className="h-1 rounded-full transition-all" style={{ width: `${clamp(len, max)}%`, background: barColor(len, lo, hi) }} />
      </div>
      <span className="font-mono text-[0.65rem] text-[var(--muted)]">{len}/{max}</span>
    </div>
  );
}

function ImgField({ label, value, onPick, onChange, fallback }: { label: string; value: string; onPick: () => void; onChange: (v: string) => void; fallback?: string }) {
  const shown = value || fallback || "";
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-3">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-12 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" style={{ opacity: value ? 1 : 0.5 }} />
        ) : (
          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-dashed border-[var(--line-strong)] text-[0.55rem] text-[var(--muted)]">none</span>
        )}
        <input className={`${inputCls} font-mono text-xs`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={fallback ? "Using the page image" : "/media/… or /uploads/…"} />
        <button type="button" onClick={onPick} className="shrink-0 rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm hover:border-[var(--gold)]">Browse</button>
      </div>
    </div>
  );
}
