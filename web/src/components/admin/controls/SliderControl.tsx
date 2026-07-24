"use client";

import { labelCls } from "@/components/admin/ui";

export default function SliderControl({ value, onChange, label, min, max, step = 1, unit }: { value: number | undefined; onChange: (v: number | undefined) => void; label: string; min: number; max: number; step?: number; unit?: string }) {
  const has = typeof value === "number";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`${labelCls} mb-0`}>{label}</span>
        <div className="flex items-center gap-1.5">
          <input type="number" aria-label={label} value={has ? String(value) : ""} min={min} max={max} step={step} placeholder="—" onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className="w-16 rounded border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-1 text-right text-xs text-[var(--bone)] outline-none focus:border-[var(--gold)]" />
          {unit && <span className="text-xs text-[var(--muted)]">{unit}</span>}
        </div>
      </div>
      <input type="range" aria-label={`${label} slider`} min={min} max={max} step={step} value={has ? (value as number) : min} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--gold)]" />
    </div>
  );
}
