"use client";

import { labelCls } from "@/components/admin/ui";

const SWATCHES = [
  { name: "Gold", v: "#a87f3f" },
  { name: "Gold ink", v: "#856428" },
  { name: "Champagne", v: "#e6cb92" },
  { name: "Ink", v: "#17191c" },
  { name: "Bone", v: "#f4f3ef" },
  { name: "White", v: "#ffffff" },
  { name: "Muted", v: "#6b7178" },
];

export default function ColorControl({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const v = value || "";
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={isHex ? v.slice(0, 7) : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-[var(--line-strong)] bg-transparent p-0.5"
        />
        <input
          className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          value={v}
          placeholder="#a87f3f or var(--gold)"
          onChange={(e) => onChange(e.target.value)}
        />
        {v && (
          <button type="button" aria-label="Clear" onClick={() => onChange("")} className="shrink-0 rounded px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--bone)]">✕</button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SWATCHES.map((s) => (
          <button key={s.v} type="button" aria-label={s.name} title={s.name} onClick={() => onChange(s.v)} className="h-5 w-5 rounded-full border border-[var(--line-strong)]" style={{ background: s.v }} />
        ))}
      </div>
    </div>
  );
}
