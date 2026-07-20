"use client";

import { labelCls } from "@/components/admin/ui";

export default function ToggleControl({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className={`${labelCls} mb-0`}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${value ? "bg-[var(--gold)]" : "bg-[var(--line-strong)]"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
