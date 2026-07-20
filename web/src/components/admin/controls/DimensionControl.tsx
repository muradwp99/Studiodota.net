"use client";

import { useState } from "react";
import { labelCls } from "@/components/admin/ui";
import type { BoxValue } from "@/lib/nodes/styleControls";

const UNITS = ["px", "em", "rem", "%"];
const SIDES: Array<"top" | "right" | "bottom" | "left"> = ["top", "right", "bottom", "left"];

export default function DimensionControl({ value, onChange, label }: { value: BoxValue | undefined; onChange: (v: BoxValue) => void; label: string }) {
  const box: BoxValue = value ?? {};
  const [linked, setLinked] = useState(true);
  const unit = box.unit ?? "px";
  const numVal = (s: "top" | "right" | "bottom" | "left") => (typeof box[s] === "number" ? String(box[s]) : "");
  const setSide = (side: "top" | "right" | "bottom" | "left", raw: string) => {
    const n = raw === "" ? undefined : Number(raw);
    if (linked) onChange({ top: n, right: n, bottom: n, left: n, unit });
    else onChange({ ...box, [side]: n, unit });
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`${labelCls} mb-0`}>{label}</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-pressed={linked} onClick={() => setLinked((l) => !l)} title={linked ? "Sides linked" : "Sides independent"} className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase ${linked ? "text-[var(--gold-ink)]" : "text-[var(--muted)]"}`}>
            {linked ? "Linked" : "Sides"}
          </button>
          <select aria-label={`${label} unit`} value={unit} onChange={(e) => onChange({ ...box, unit: e.target.value })} className="rounded border border-[var(--line-strong)] bg-[var(--surface)] px-1 py-0.5 text-xs text-[var(--bone)]">
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDES.map((s) => (
          <input key={s} type="number" aria-label={`${label} ${s}`} placeholder={s[0].toUpperCase()} value={numVal(s)} onChange={(e) => setSide(s, e.target.value)} className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-2 text-center text-xs text-[var(--bone)] outline-none focus:border-[var(--gold)]" />
        ))}
      </div>
    </div>
  );
}
