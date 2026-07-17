"use client";

import { useState } from "react";
import type { FieldSpec } from "@/lib/pageRegistry";
import MediaPicker from "@/components/admin/MediaPicker";
import { inputCls, labelCls, btnGhostCls } from "@/components/admin/ui";

export type Path = (string | number)[];
export type Json = Record<string, unknown>;

export function getAt(obj: unknown, path: Path): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[k as never];
  }
  return cur;
}

export function setAt(obj: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(obj) ? [...obj] : [];
    arr[head] = setAt(arr[head], rest, value);
    return arr;
  }
  const rec = obj && typeof obj === "object" && !Array.isArray(obj) ? { ...(obj as Json) } : {};
  rec[head] = setAt(rec[head], rest, value);
  return rec;
}

/** Blank value for a newly-added list item, derived from its field spec. */
export function emptyFor(fields: FieldSpec[]): Json {
  const out: Json = {};
  for (const f of fields) {
    switch (f.kind) {
      case "text":
      case "textarea":
      case "image":
        out[f.key] = "";
        break;
      case "number":
        out[f.key] = 0;
        break;
      case "toggle":
        out[f.key] = false;
        break;
      case "stringList":
        out[f.key] = [];
        break;
      case "group":
        out[f.key] = emptyFor(f.fields);
        break;
      case "list":
        out[f.key] = [];
        break;
    }
  }
  return out;
}

/**
 * Generic spec-driven form renderer (text/textarea/number/toggle/image with
 * media picker/stringList/group/list). Controlled: reads from `data`, reports
 * every change as (path, value).
 */
export default function FieldsRenderer({
  fields,
  data,
  onChange,
  idPrefix,
}: {
  fields: FieldSpec[];
  data: Json;
  onChange: (path: Path, value: unknown) => void;
  idPrefix: string;
}) {
  const [picker, setPicker] = useState<Path | null>(null);

  const renderField = (f: FieldSpec, base: Path): React.ReactNode => {
    const path = [...base, f.key];
    const val = getAt(data, path);
    const id = `${idPrefix}.${path.join(".")}`;

    switch (f.kind) {
      case "text":
        return (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{f.label}</label>
            <input id={id} className={inputCls} value={String(val ?? "")} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        );
      case "textarea":
        return (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{f.label}</label>
            <textarea id={id} rows={f.rows ?? 3} className={inputCls} value={String(val ?? "")} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        );
      case "number":
        return (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{f.label}</label>
            <input id={id} type="number" className={inputCls} value={Number(val ?? 0)} onChange={(e) => onChange(path, e.target.value === "" ? 0 : Number(e.target.value))} />
          </div>
        );
      case "toggle":
        return (
          <label key={id} htmlFor={id} className="flex items-center gap-2.5 text-sm text-[var(--bone)]">
            <input id={id} type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={Boolean(val)} onChange={(e) => onChange(path, e.target.checked)} />
            {f.label}
          </label>
        );
      case "image": {
        const v = String(val ?? "");
        return (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{f.label}</label>
            <div className="flex items-center gap-3">
              {v ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v} alt="" className="h-12 w-16 shrink-0 rounded-md border border-[var(--line)] object-cover" />
              ) : (
                <span className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-dashed border-[var(--line-strong)] text-[0.6rem] text-[var(--muted)]">none</span>
              )}
              <input id={id} className={inputCls} value={v} placeholder="/media/… or /uploads/…" onChange={(e) => onChange(path, e.target.value)} />
              <button type="button" className={btnGhostCls} onClick={() => setPicker(path)}>Browse</button>
            </div>
          </div>
        );
      }
      case "stringList": {
        const arr = Array.isArray(val) ? (val as unknown[]).map(String) : [];
        return (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{f.label} <span className="normal-case text-[var(--muted)]">(one per line)</span></label>
            <textarea id={id} rows={Math.min(8, Math.max(3, arr.length + 1))} className={`${inputCls} font-mono text-xs`} value={arr.join("\n")} onChange={(e) => onChange(path, e.target.value.split("\n"))} />
          </div>
        );
      }
      case "group":
        return (
          <fieldset key={id} className="rounded-xl border border-[var(--line)] p-4">
            <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--bone-dim)]">{f.label}</legend>
            <div className="space-y-4">{f.fields.map((sub) => renderField(sub, path))}</div>
          </fieldset>
        );
      case "list": {
        const arr = Array.isArray(val) ? (val as Json[]) : [];
        return (
          <fieldset key={id} className="rounded-xl border border-[var(--line)] p-4">
            <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--bone-dim)]">{f.label}</legend>
            <div className="space-y-4">
              {arr.map((_, i) => (
                <div key={i} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)]/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--muted)]">#{i + 1}</span>
                    <span className="flex gap-1.5">
                      <button type="button" aria-label="Move up" disabled={i === 0} className="rounded px-2 py-0.5 text-xs text-[var(--bone-dim)] hover:bg-[var(--surface-2)] disabled:opacity-30" onClick={() => { const next = [...arr]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange(path, next); }}>↑</button>
                      <button type="button" aria-label="Move down" disabled={i === arr.length - 1} className="rounded px-2 py-0.5 text-xs text-[var(--bone-dim)] hover:bg-[var(--surface-2)] disabled:opacity-30" onClick={() => { const next = [...arr]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; onChange(path, next); }}>↓</button>
                      <button type="button" className="rounded px-2 py-0.5 text-xs text-[#a33] hover:bg-[#a33]/10" onClick={() => onChange(path, arr.filter((_, j) => j !== i))}>Remove</button>
                    </span>
                  </div>
                  <div className="space-y-4">{f.item.map((sub) => renderField(sub, [...path, i]))}</div>
                </div>
              ))}
              {(f.addable || arr.length === 0) && (
                <button type="button" className={btnGhostCls} onClick={() => onChange(path, [...arr, emptyFor(f.item)])}>
                  + Add item
                </button>
              )}
            </div>
          </fieldset>
        );
      }
    }
  };

  return (
    <>
      <div className="space-y-5">{fields.map((f) => renderField(f, []))}</div>
      <MediaPicker open={picker !== null} onClose={() => setPicker(null)} onSelect={(p) => picker && onChange(picker, p)} />
    </>
  );
}
