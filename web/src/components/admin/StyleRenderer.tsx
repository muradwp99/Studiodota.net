"use client";

import type { StyleControl, BoxValue } from "@/lib/nodes/styleControls";
import { getAt, type Path, type Json } from "@/components/admin/FieldsRenderer";
import { inputCls, labelCls } from "@/components/admin/ui";
import ColorControl from "@/components/admin/controls/ColorControl";
import DimensionControl from "@/components/admin/controls/DimensionControl";
import SliderControl from "@/components/admin/controls/SliderControl";
import ButtonGroupControl from "@/components/admin/controls/ButtonGroupControl";
import ToggleControl from "@/components/admin/controls/ToggleControl";

export default function StyleRenderer({ controls, data, onChange }: { controls: StyleControl[]; data: Json; onChange: (path: Path, value: unknown) => void }) {
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
    const val = getAt(data, path);
    switch (c.kind) {
      case "color":
        return <ColorControl key={key} label={c.label} value={String(val ?? "")} onChange={(v) => onChange(path, v)} />;
      case "dimension":
        return <DimensionControl key={key} label={c.label} value={(val as BoxValue) ?? undefined} onChange={(v) => onChange(path, v)} />;
      case "slider":
        return <SliderControl key={key} label={c.label} min={c.min} max={c.max} step={c.step} unit={c.unit} value={typeof val === "number" ? val : undefined} onChange={(v) => onChange(path, v)} />;
      case "buttongroup":
        return <ButtonGroupControl key={key} label={c.label} options={c.options} value={String(val ?? "")} onChange={(v) => onChange(path, v)} />;
      case "text": {
        const id = `sc-${c.key}`;
        return (
          <div key={key}>
            <label htmlFor={id} className={labelCls}>{c.label}</label>
            <input id={id} className={inputCls} value={String(val ?? "")} placeholder={c.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        );
      }
      case "textarea": {
        const id = `sc-${c.key}`;
        return (
          <div key={key}>
            <label htmlFor={id} className={labelCls}>{c.label}</label>
            <textarea id={id} rows={5} className={`${inputCls} font-mono text-xs`} value={String(val ?? "")} placeholder={c.placeholder} onChange={(e) => onChange(path, e.target.value)} />
          </div>
        );
      }
      case "toggle":
        return <ToggleControl key={key} label={c.label} value={val === true} onChange={(v) => onChange(path, v)} />;
      default: {
        const _exhaustive: never = c;
        return _exhaustive;
      }
    }
  };
  return <div className="space-y-4">{controls.map((c, i) => render(c, String(i)))}</div>;
}
