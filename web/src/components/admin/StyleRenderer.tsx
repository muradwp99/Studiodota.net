"use client";

import type { StyleControl, BoxValue } from "@/lib/nodes/styleControls";
import { getAt, type Path, type Json } from "@/components/admin/FieldsRenderer";
import { inputCls, labelCls } from "@/components/admin/ui";
import ColorControl from "@/components/admin/controls/ColorControl";
import DimensionControl from "@/components/admin/controls/DimensionControl";
import SliderControl from "@/components/admin/controls/SliderControl";
import ButtonGroupControl from "@/components/admin/controls/ButtonGroupControl";
import ToggleControl from "@/components/admin/controls/ToggleControl";
import type { Breakpoint, Responsive } from "@/lib/nodes/types";
import { resolveAt, writeSlot, clearSlot, hasSlot } from "@/lib/nodes/responsive";

export default function StyleRenderer({ controls, data, onChange, device = "base" }: { controls: StyleControl[]; data: Json; onChange: (path: Path, value: unknown) => void; device?: Breakpoint }) {
  const render = (c: StyleControl, key: string): React.ReactNode => {
    if (c.kind === "group") {
      return (
        <fieldset key={key} className="rounded-xl border border-[var(--line)] p-4">
          <legend className="px-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--bone-dim)]">{c.label}</legend>
          <div className="space-y-4">{c.controls.map((sub, i) => render(sub, `${key}.${i}`))}</div>
        </fieldset>
      );
    }
    const path: Path = c.key.split(".");
    const raw = getAt(data, path);
    const RESPONSIVE_KINDS = ["color", "slider", "dimension", "buttongroup"];
    const responsive = RESPONSIVE_KINDS.includes(c.kind) && !c.key.includes(".");
    const val = responsive ? resolveAt(raw as Responsive<unknown>, device) : raw;
    const write = (v: unknown) =>
      onChange(path, responsive ? (v === undefined || v === "" ? clearSlot(raw, device) : writeSlot(raw, device, v)) : v);
    const overridden = responsive && device !== "base" && hasSlot(raw, device);
    const wrap = (el: React.ReactNode) =>
      responsive && overridden ? (
        <div key={key} className="relative">
          {el}
          <button
            type="button"
            title={`Clear ${device} override`}
            aria-label={`Clear ${device} override for ${c.label}`}
            onClick={() => onChange(path, clearSlot(raw, device))}
            className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--gold)] text-[0.6rem] font-bold text-[#17191c]"
          >
            ×
          </button>
        </div>
      ) : el;
    switch (c.kind) {
      case "color":
        return wrap(<ColorControl key={key} label={c.label} value={String(val ?? "")} onChange={(v) => write(v)} />);
      case "dimension":
        return wrap(<DimensionControl key={key} label={c.label} value={(val as BoxValue) ?? undefined} onChange={(v) => write(v)} />);
      case "slider":
        return wrap(<SliderControl key={key} label={c.label} min={c.min} max={c.max} step={c.step} unit={c.unit} value={typeof val === "number" ? val : undefined} onChange={(v) => write(v)} />);
      case "buttongroup":
        return wrap(<ButtonGroupControl key={key} label={c.label} options={c.options} value={String(val ?? "")} onChange={(v) => write(v)} />);
      case "text": {
        const id = `sc-${c.key}`;
        return (
          <div key={key}>
            <label htmlFor={id} className={labelCls}>{c.label}</label>
            <input id={id} className={inputCls} value={String(raw ?? "")} placeholder={c.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        );
      }
      case "textarea": {
        const id = `sc-${c.key}`;
        return (
          <div key={key}>
            <label htmlFor={id} className={labelCls}>{c.label}</label>
            <textarea id={id} rows={5} className={`${inputCls} font-mono text-xs`} value={String(raw ?? "")} placeholder={c.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        );
      }
      case "toggle":
        return <ToggleControl key={key} label={c.label} value={raw === true} onChange={(v) => onChange(path, v)} />;
      default: {
        const _exhaustive: never = c;
        return _exhaustive;
      }
    }
  };
  return <div className="space-y-4">{controls.map((c, i) => render(c, String(i)))}</div>;
}
