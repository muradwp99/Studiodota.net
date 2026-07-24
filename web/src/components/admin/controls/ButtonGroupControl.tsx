"use client";

import { labelCls } from "@/components/admin/ui";

export default function ButtonGroupControl({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex overflow-hidden rounded-lg border border-[var(--line-strong)]">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? "" : o.value)} className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${on ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)]"}`}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
