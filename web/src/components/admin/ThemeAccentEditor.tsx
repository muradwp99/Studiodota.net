"use client";

import { useState, useTransition } from "react";
import { saveAppearance, type SaveState } from "@/lib/actions/appearance";
import { inputCls, labelCls, btnPrimaryCls, btnGhostCls, Notice } from "@/components/admin/ui";

const DEFAULT = "#a87f3f";
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PRESETS = ["#a87f3f", "#b8894e", "#57bda8", "#6f7d8a", "#9a6a4b", "#7c6cae", "#2f6f4f", "#c05540"];

export default function ThemeAccentEditor({ initial }: { initial: string }) {
  const [accent, setAccent] = useState(HEX.test(initial) ? initial : DEFAULT);
  const [state, setState] = useState<SaveState | null>(null);
  const [pending, startTransition] = useTransition();
  const valid = HEX.test(accent);

  const save = () =>
    startTransition(async () => setState(await saveAppearance({ accent })));

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <h2 className="font-bold">Brand accent</h2>
      <p className="mt-1 max-w-[52ch] text-sm text-[var(--muted)]">
        The champagne-bronze used for buttons, links, highlights, and the loader. Lighter and hover
        shades are derived automatically for light and dark mode.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input
          type="color"
          aria-label="Accent colour"
          value={valid ? accent : DEFAULT}
          onChange={(e) => { setAccent(e.target.value); setState(null); }}
          className="h-12 w-16 shrink-0 cursor-pointer rounded-lg border border-[var(--line-strong)] bg-transparent"
        />
        <div className="w-40">
          <label htmlFor="accentHex" className={labelCls}>Hex</label>
          <input
            id="accentHex"
            className={`${inputCls} font-mono`}
            value={accent}
            onChange={(e) => { setAccent(e.target.value); setState(null); }}
            placeholder={DEFAULT}
          />
        </div>
        <button type="button" className={btnGhostCls} onClick={() => { setAccent(DEFAULT); setState(null); }}>
          Reset to default
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use ${c}`}
            onClick={() => { setAccent(c); setState(null); }}
            className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${accent.toLowerCase() === c ? "border-[var(--bone)]" : "border-transparent"}`}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* Live preview using the chosen colour directly */}
      <div className="mt-6 rounded-xl border border-[var(--line)] p-5" style={{ ["--preview" as string]: valid ? accent : DEFAULT }}>
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Preview</div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#17191c]" style={{ background: "var(--preview)" }}>Get a quote</span>
          <span className="text-sm font-semibold" style={{ color: "var(--preview)" }}>Read more →</span>
          <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-[#17191c]" style={{ background: "var(--preview)" }}>SD</span>
        </div>
      </div>

      {!valid && <p className="mt-4 text-sm text-[#a33]">Enter a valid hex colour like {DEFAULT}.</p>}
      <div className="mt-5"><Notice state={state} /></div>
      <button type="button" onClick={save} disabled={pending || !valid} className={`${btnPrimaryCls} mt-4`}>
        {pending ? "Saving…" : "Save accent"}
      </button>
    </div>
  );
}
