# Live Editor A2.1 — Inspector Foundation + First Live Controls (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the block-settings sidebar into a **Content / Style / Advanced** tabbed inspector with a working control library (color, spacing, sizing, alignment, CSS class/id) that writes to each node's `style`/`advanced` and renders live — and fix the universal-wrapper layout trap so styling an existing block never shifts the page.

**Architecture:** The A1 CSS engine (`lib/nodes/css.ts`) already maps every property this first control slice sets, so A2.1 is UI wiring on top of it plus one engine change: a `needsBox()` helper so the wrapper is `display:contents` (layout-transparent) until a box-model property or children require a real box. A `StyleControl` spec + `StyleRenderer` (parallel to the existing `FieldSpec`/`FieldsRenderer`) render universal control definitions; small control-primitive components (Color/Dimension/Slider/ButtonGroup) edit the values. `PageBuilder` gains tab state and writes to `node.style`/`node.advanced`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, zod v4, Prisma 6 + MySQL. Tests: Vitest.

## Global Constraints

- **Next 16 is not the Next you know** — per `web/AGENTS.md`, check `web/node_modules/next/dist/docs/` before any unfamiliar Next API. (A2.1 touches only client components + pure logic — no novel Next APIs.)
- **Prisma stays at 6.** `Page.blocks` is JSON — no DB migration.
- **Backward compatibility is mandatory:** a node with no `style`/`advanced`/`children` still renders with NO wrapper (byte-identical). A node that HAS `style`/`advanced` but no box-model property renders a `display:contents` wrapper (layout-transparent) — styling an existing block must NOT shift the page until a box property (padding/margin/background/border/min-height/max-width/radius/shadow/position/z-index/hover) is actually set. **This is the A2 pre-work trap #1.**
- **The A1 CSS engine already maps these keys** (do NOT re-implement): `style.backgroundColor`, `style.color`, `style.textAlign`, `style.minHeight`, `style.maxWidth`, `style.borderRadius`; `advanced.padding`, `advanced.margin`, `advanced.zIndex`; `advanced.cssClasses`, `advanced.cssId` (via `wrapperAttrs`). Controls must write values in the shapes the engine expects: colors/align as strings; maxWidth/minHeight/borderRadius/zIndex as **numbers**; padding/margin as `{top,right,bottom,left,unit}` boxes.
- **Values are never `null`.** Controls write strings, numbers, or box objects; "clear" writes `""` or removes — never `null` (the server `nodeSchema` accepts optional-absent but rejects explicit `null`). **A2 pre-work trap #4.**
- **One renderer** serves public + admin. `@/*` → `web/src/*`. All commands run from `web/`.
- **Verification reality:** the inspector lives in the admin (`requireAdmin`, session-gated) — the implementing agent cannot log in, so inspector *click-through* is verified by the human. The engine + `display:contents` + live render ARE verified on the **public** side by temporarily injecting a styled node into a published page's blocks in the DB (Task 1 / Task 5 verification).

---

## File Structure

**Create:**
- `web/src/lib/nodes/styleControls.ts` — `StyleControl` spec type + `STYLE_CONTROLS` / `ADVANCED_CONTROLS` universal definitions.
- `web/src/lib/nodes/styleControls.test.ts` — consistency test (control keys ⊆ engine-handled keys).
- `web/src/components/admin/controls/ColorControl.tsx`
- `web/src/components/admin/controls/DimensionControl.tsx`
- `web/src/components/admin/controls/SliderControl.tsx`
- `web/src/components/admin/controls/ButtonGroupControl.tsx`
- `web/src/components/admin/StyleRenderer.tsx` — renders `StyleControl[]` against a data bag.

**Modify:**
- `web/src/lib/nodes/css.ts` — add `needsBox(node)`.
- `web/src/lib/nodes/css.test.ts` — tests for `needsBox`.
- `web/src/components/blocks/BlockRenderer.tsx` — wrapper uses `display:contents` when `!needsBox(node)`.
- `web/src/components/admin/PageBuilder.tsx` — tab state, `updateSelectedStyle`/`updateSelectedAdvanced`, `duplicate` clones style/advanced, tabbed inspector UI.

---

### Task 1: `needsBox()` + `display:contents` wrapper (the layout-shift fix)

**Files:**
- Modify: `web/src/lib/nodes/css.ts`
- Modify: `web/src/lib/nodes/css.test.ts`
- Modify: `web/src/components/blocks/BlockRenderer.tsx`

**Interfaces:**
- Consumes: `Node` from `./types`.
- Produces: `needsBox(node: Node): boolean` — true when the node has children or any box-generating style/advanced property; false when it has only inheritable text styling (or nothing). `renderNode` applies `style={{display:"contents"}}` to the wrapper when `!needsBox(node)`.

- [ ] **Step 1: Write the failing tests**

Append to `web/src/lib/nodes/css.test.ts`:
```ts
import { needsBox } from "./css";

describe("needsBox", () => {
  const n = (over: Partial<Node>): Node => ({ id: "x", type: "text", props: {}, ...over });
  it("false for a bare node", () => { expect(needsBox(n({}))).toBe(false); });
  it("false for inheritable-only style (color / textAlign)", () => {
    expect(needsBox(n({ style: { color: "#111", textAlign: "center" } }))).toBe(false);
  });
  it("false for cssClasses/cssId only", () => {
    expect(needsBox(n({ advanced: { cssClasses: "fancy", cssId: "hero" } }))).toBe(false);
  });
  it("true when it has children", () => {
    expect(needsBox(n({ children: [{ id: "c", type: "text", props: {} }] }))).toBe(true);
  });
  it("true for box style props", () => {
    expect(needsBox(n({ style: { backgroundColor: "#000" } }))).toBe(true);
    expect(needsBox(n({ style: { maxWidth: 800 } }))).toBe(true);
    expect(needsBox(n({ style: { borderRadius: 12 } }))).toBe(true);
  });
  it("true for padding/margin/zIndex", () => {
    expect(needsBox(n({ advanced: { padding: { top: 10 } } }))).toBe(true);
    expect(needsBox(n({ advanced: { zIndex: 3 } }))).toBe(true);
  });
  it("true when a hover state is set", () => {
    expect(needsBox(n({ style: { hover: { backgroundColor: "#111" } } }))).toBe(true);
  });
  it("ignores empty responsive/box shells", () => {
    expect(needsBox(n({ advanced: { padding: { unit: "px" } } }))).toBe(false);
    expect(needsBox(n({ style: { maxWidth: {} } }))).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- css`
Expected: FAIL — `needsBox` is not exported yet.

- [ ] **Step 3: Implement `needsBox` in `css.ts`**

Append to `web/src/lib/nodes/css.ts`:
```ts
const STYLE_BOX_KEYS = ["backgroundColor", "background", "backgroundImage", "minHeight", "maxWidth", "width", "borderRadius", "border", "boxShadow"];
const ADV_BOX_KEYS = ["padding", "margin", "position", "zIndex"];

/** A value counts as "set" if it (or any of its non-`unit` sub-values) is non-empty. */
function hasVal(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>).some(
      ([k, x]) => k !== "unit" && x !== undefined && x !== null && x !== "",
    );
  }
  return true;
}

/**
 * Does this node need a real box, or can its wrapper be `display:contents`
 * (layout-transparent)? True when it has children or any box-generating style/
 * advanced property; false when only inheritable text styling (color/align) or
 * bare attributes (cssClasses/cssId) are set.
 */
export function needsBox(node: Node): boolean {
  if (node.children?.length) return true;
  const s = (node.style ?? {}) as Record<string, unknown>;
  const a = (node.advanced ?? {}) as Record<string, unknown>;
  if (STYLE_BOX_KEYS.some((k) => hasVal(s[k]))) return true;
  if (ADV_BOX_KEYS.some((k) => hasVal(a[k]))) return true;
  if (s.hover && typeof s.hover === "object") return true;
  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- css`
Expected: PASS — all `needsBox` cases green (plus existing css tests).

- [ ] **Step 5: Apply `display:contents` in the renderer**

In `web/src/components/blocks/BlockRenderer.tsx`, update the `css` import to include `needsBox`:
```ts
import { nodeCss, wrapperAttrs, needsBox } from "@/lib/nodes/css";
```
Then in `renderNode`, replace the wrapper `return` (the `<div key={node.id} className={className} id={id} data-node={node.id}>…</div>` branch) with a version that adds the layout-transparent style when no box is needed:
```tsx
  const { className, id } = wrapperAttrs(node);
  const boxed = needsBox(node);
  return (
    <div
      key={node.id}
      className={className}
      id={id}
      data-node={node.id}
      style={boxed ? undefined : { display: "contents" }}
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {inner}
      {kids}
    </div>
  );
```

- [ ] **Step 6: Typecheck + verify byte-identical on the public side**

Run: `npx tsc --noEmit` — expected clean.
Ensure MySQL is up (`npm run db:start`) and the dev server runs. Load the published page `/our-studio-story` (it has plain, unstyled nodes) — it must render exactly as before (all nodes take the no-wrapper Fragment path; nothing changed).

- [ ] **Step 7: Verify a styled node renders WITHOUT shifting layout (public side, DB-injected)**

This proves the `display:contents` fix. From `web/`, temporarily give the first block of `our-studio-story` an inheritable-only style, load the page, confirm it applied via inheritance with **no wrapper box** (`display:contents`), then revert:
```bash
node -e "0" # (use a .mjs file — see the pattern below)
```
Create `web/_verify-a2.mjs`, run `node _verify-a2.mjs`, then delete it:
```js
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const p = await db.page.findFirst({ where: { slug: "our-studio-story" } });
const blocks = p.blocks;
blocks[0].style = { color: "#c0392b" }; // inheritable-only → wrapper must be display:contents
await db.page.update({ where: { id: p.id }, data: { blocks } });
console.log("injected color on", blocks[0].type, blocks[0].id);
await db.$disconnect();
```
Load `/our-studio-story`, then in the browser console/JS check the first node's wrapper:
```js
// getComputedStyle(document.querySelector('[data-node]')).display === 'contents'
```
Expected: the wrapper's computed `display` is `contents`, the heading text is now red (inherited), and the layout is unchanged. Then revert (`blocks[0].style` deleted, update back) and delete `_verify-a2.mjs`. (The controller performs this check.)

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/nodes/css.ts web/src/lib/nodes/css.test.ts web/src/components/blocks/BlockRenderer.tsx
git commit -m "feat: display:contents wrapper until a box property is set (needsBox)"
```

---

### Task 2: `StyleControl` spec + universal control definitions

**Files:**
- Create: `web/src/lib/nodes/styleControls.ts`
- Create: `web/src/lib/nodes/styleControls.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type BoxValue = { top?: number; right?: number; bottom?: number; left?: number; unit?: string }`
  - `type StyleControl = { kind:"color"|"dimension"|"slider"|"buttongroup"|"text"; key: string; label: string; … } | { kind:"group"; label: string; controls: StyleControl[] }`
  - `STYLE_CONTROLS: StyleControl[]` (writes to `node.style`)
  - `ADVANCED_CONTROLS: StyleControl[]` (writes to `node.advanced`)

- [ ] **Step 1: Write the spec + definitions**

Create `web/src/lib/nodes/styleControls.ts`:
```ts
export type BoxValue = { top?: number; right?: number; bottom?: number; left?: number; unit?: string };

export type StyleControl =
  | { kind: "color"; key: string; label: string }
  | { kind: "dimension"; key: string; label: string }
  | { kind: "slider"; key: string; label: string; min: number; max: number; step?: number; unit?: string }
  | { kind: "buttongroup"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "group"; label: string; controls: StyleControl[] };

/** Style tab — writes to node.style. Every key here is mapped by lib/nodes/css.ts. */
export const STYLE_CONTROLS: StyleControl[] = [
  {
    kind: "group",
    label: "Background & text",
    controls: [
      { kind: "color", key: "backgroundColor", label: "Background" },
      { kind: "color", key: "color", label: "Text color" },
      {
        kind: "buttongroup",
        key: "textAlign",
        label: "Text align",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Sizing",
    controls: [
      { kind: "slider", key: "maxWidth", label: "Max width", min: 0, max: 1600, step: 10, unit: "px" },
      { kind: "slider", key: "minHeight", label: "Min height", min: 0, max: 1000, step: 10, unit: "px" },
      { kind: "slider", key: "borderRadius", label: "Corner radius", min: 0, max: 80, step: 1, unit: "px" },
    ],
  },
];

/** Advanced tab — writes to node.advanced. Every key here is mapped by lib/nodes/css.ts or wrapperAttrs. */
export const ADVANCED_CONTROLS: StyleControl[] = [
  {
    kind: "group",
    label: "Spacing",
    controls: [
      { kind: "dimension", key: "padding", label: "Padding" },
      { kind: "dimension", key: "margin", label: "Margin" },
    ],
  },
  {
    kind: "group",
    label: "Layout & attributes",
    controls: [
      { kind: "slider", key: "zIndex", label: "Z-index", min: 0, max: 100, step: 1 },
      { kind: "text", key: "cssClasses", label: "CSS classes", placeholder: "my-class another" },
      { kind: "text", key: "cssId", label: "CSS ID", placeholder: "unique-id" },
    ],
  },
];
```

- [ ] **Step 2: Write the consistency test**

Create `web/src/lib/nodes/styleControls.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { STYLE_CONTROLS, ADVANCED_CONTROLS, type StyleControl } from "./styleControls";

// Keys the A1 CSS engine (css.ts) actually renders. Keep in sync with styleToCss/wrapperAttrs.
const STYLE_KEYS = new Set(["backgroundColor", "color", "textAlign", "minHeight", "maxWidth", "borderRadius"]);
const ADV_KEYS = new Set(["padding", "margin", "zIndex", "cssClasses", "cssId"]);

const flatKeys = (cs: StyleControl[]): string[] =>
  cs.flatMap((c) => (c.kind === "group" ? flatKeys(c.controls) : [c.key]));

describe("style control definitions", () => {
  it("every Style control key is handled by the CSS engine", () => {
    for (const k of flatKeys(STYLE_CONTROLS)) expect(STYLE_KEYS.has(k)).toBe(true);
  });
  it("every Advanced control key is handled by the engine or wrapperAttrs", () => {
    for (const k of flatKeys(ADVANCED_CONTROLS)) expect(ADV_KEYS.has(k)).toBe(true);
  });
  it("no duplicate keys within a tab", () => {
    const s = flatKeys(STYLE_CONTROLS); expect(new Set(s).size).toBe(s.length);
    const a = flatKeys(ADVANCED_CONTROLS); expect(new Set(a).size).toBe(a.length);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm test -- styleControls`
Expected: PASS. (If a key fails, either the control is wrong or the CSS engine doesn't map it — fix the control, do not add an unmapped key.)

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/nodes/styleControls.ts web/src/lib/nodes/styleControls.test.ts
git commit -m "feat: StyleControl spec + universal Style/Advanced control definitions"
```

---

### Task 3: Control primitive components

**Files:**
- Create: `web/src/components/admin/controls/ColorControl.tsx`
- Create: `web/src/components/admin/controls/DimensionControl.tsx`
- Create: `web/src/components/admin/controls/SliderControl.tsx`
- Create: `web/src/components/admin/controls/ButtonGroupControl.tsx`

**Interfaces:**
- Consumes: `labelCls` from `@/components/admin/ui`; `BoxValue` from `@/lib/nodes/styleControls`.
- Produces (each a default export):
  - `ColorControl({ value: string; onChange: (v: string) => void; label: string })`
  - `DimensionControl({ value: BoxValue | undefined; onChange: (v: BoxValue) => void; label: string })`
  - `SliderControl({ value: number | undefined; onChange: (v: number | undefined) => void; label: string; min: number; max: number; step?: number; unit?: string })`
  - `ButtonGroupControl({ value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] })`

- [ ] **Step 1: ColorControl**

Create `web/src/components/admin/controls/ColorControl.tsx`:
```tsx
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
```

- [ ] **Step 2: DimensionControl**

Create `web/src/components/admin/controls/DimensionControl.tsx`:
```tsx
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
```

- [ ] **Step 3: SliderControl**

Create `web/src/components/admin/controls/SliderControl.tsx`:
```tsx
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
```

- [ ] **Step 4: ButtonGroupControl**

Create `web/src/components/admin/controls/ButtonGroupControl.tsx`:
```tsx
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
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/admin/controls/
git commit -m "feat: style control primitives (Color, Dimension, Slider, ButtonGroup)"
```

---

### Task 4: `StyleRenderer`

**Files:**
- Create: `web/src/components/admin/StyleRenderer.tsx`

**Interfaces:**
- Consumes: `StyleControl` from `@/lib/nodes/styleControls`; `getAt`, `type Path`, `type Json` from `@/components/admin/FieldsRenderer`; `inputCls`, `labelCls` from `@/components/admin/ui`; the four control primitives from `@/components/admin/controls/*`.
- Produces: `StyleRenderer({ controls: StyleControl[]; data: Json; onChange: (path: Path, value: unknown) => void })` — renders each control, reads `getAt(data, [key])`, reports edits as `onChange([key], value)`; `group` renders a labelled section.

- [ ] **Step 1: Implement StyleRenderer**

Create `web/src/components/admin/StyleRenderer.tsx`:
```tsx
"use client";

import type { StyleControl, BoxValue } from "@/lib/nodes/styleControls";
import { getAt, type Path, type Json } from "@/components/admin/FieldsRenderer";
import { inputCls, labelCls } from "@/components/admin/ui";
import ColorControl from "@/components/admin/controls/ColorControl";
import DimensionControl from "@/components/admin/controls/DimensionControl";
import SliderControl from "@/components/admin/controls/SliderControl";
import ButtonGroupControl from "@/components/admin/controls/ButtonGroupControl";

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
    const val = getAt(data, [c.key]);
    switch (c.kind) {
      case "color":
        return <ColorControl key={key} label={c.label} value={String(val ?? "")} onChange={(v) => onChange([c.key], v)} />;
      case "dimension":
        return <DimensionControl key={key} label={c.label} value={(val as BoxValue) ?? undefined} onChange={(v) => onChange([c.key], v)} />;
      case "slider":
        return <SliderControl key={key} label={c.label} min={c.min} max={c.max} step={c.step} unit={c.unit} value={typeof val === "number" ? val : undefined} onChange={(v) => onChange([c.key], v)} />;
      case "buttongroup":
        return <ButtonGroupControl key={key} label={c.label} options={c.options} value={String(val ?? "")} onChange={(v) => onChange([c.key], v)} />;
      case "text":
        return (
          <div key={key}>
            <label className={labelCls}>{c.label}</label>
            <input className={inputCls} value={String(val ?? "")} placeholder={c.placeholder} onChange={(e) => onChange([c.key], e.target.value)} />
          </div>
        );
    }
  };
  return <div className="space-y-4">{controls.map((c, i) => render(c, String(i)))}</div>;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/StyleRenderer.tsx
git commit -m "feat: StyleRenderer (renders StyleControl specs to a data bag)"
```

---

### Task 5: Tabbed inspector in PageBuilder

**Files:**
- Modify: `web/src/components/admin/PageBuilder.tsx`

**Interfaces:**
- Consumes: `StyleRenderer`, `STYLE_CONTROLS`, `ADVANCED_CONTROLS`, existing `FieldsRenderer`/`setAt`/`Path`/`Json`.
- Produces: the selected-block panel shows **Content / Style / Advanced** tabs. Content = `FieldsRenderer` (unchanged). Style writes to `node.style` via `updateSelectedStyle`. Advanced writes to `node.advanced` via `updateSelectedAdvanced`. `duplicate` now clones `style`/`advanced`.

- [ ] **Step 1: Add imports**

In `web/src/components/admin/PageBuilder.tsx`, after the existing `FieldsRenderer` import, add:
```ts
import StyleRenderer from "@/components/admin/StyleRenderer";
import { STYLE_CONTROLS, ADVANCED_CONTROLS } from "@/lib/nodes/styleControls";
```

- [ ] **Step 2: Add tab state**

Next to the other `useState` hooks near the top of the component (e.g. after `const [selected, setSelected] = useState<string | null>(null);`), add:
```ts
  const [tab, setTab] = useState<"content" | "style" | "advanced">("content");
```

- [ ] **Step 3: Add style/advanced update helpers**

After the existing `updateSelectedProps` function, add:
```ts
  const updateSelectedStyle = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set(
      "blocks",
      page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, style: setAt(b.style ?? {}, path, value) as Json } : b)),
    );
  };

  const updateSelectedAdvanced = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set(
      "blocks",
      page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, advanced: setAt(b.advanced ?? {}, path, value) as Json } : b)),
    );
  };
```

- [ ] **Step 4: Clone style/advanced on duplicate (pre-work trap #3)**

Replace the `duplicate` body's `copy` construction:
```ts
    const copy: PageBlock = { id: crypto.randomUUID(), type: src.type, props: structuredClone(src.props) };
```
with:
```ts
    const copy: PageBlock = {
      id: crypto.randomUUID(),
      type: src.type,
      props: structuredClone(src.props),
      ...(src.style ? { style: structuredClone(src.style) } : {}),
      ...(src.advanced ? { advanced: structuredClone(src.advanced) } : {}),
    };
```
(Children/nested duplication is deferred to A3; A2 has no nested nodes yet.)

- [ ] **Step 5: Replace the selected-block panel with tabs**

In the sidebar, replace the selected-block branch — the block from the `<div className="mb-4 flex items-center justify-between gap-3">` header through the `FieldsRenderer` block (the content shown when `selectedBlock && selectedType`) — with:
```tsx
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em]">{selectedType.label}</h2>
                <button type="button" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]" onClick={() => setSelected(null)}>
                  Page settings
                </button>
              </div>
              <div className="mb-4 flex rounded-lg border border-[var(--line-strong)] p-0.5">
                {(["content", "style", "advanced"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tab === t}
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tab === "content" && (
                selectedType.fields.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">This block has no content settings.</p>
                ) : (
                  <FieldsRenderer
                    fields={selectedType.fields}
                    data={selectedBlock.props as Json}
                    onChange={updateSelectedProps}
                    idPrefix={`blk.${selectedBlock.id}`}
                  />
                )
              )}
              {tab === "style" && (
                <StyleRenderer controls={STYLE_CONTROLS} data={(selectedBlock.style ?? {}) as Json} onChange={updateSelectedStyle} />
              )}
              {tab === "advanced" && (
                <StyleRenderer controls={ADVANCED_CONTROLS} data={(selectedBlock.advanced ?? {}) as Json} onChange={updateSelectedAdvanced} />
              )}
```

- [ ] **Step 6: Typecheck + build-time check**

Run: `npx tsc --noEmit` — expected clean.
Run: `npm test` — expected all suites still pass (35 + needsBox + styleControls).

- [ ] **Step 7: Verify the live style round-trip (controller, public side)**

The inspector itself is admin-gated (needs login — human spot-checks the click-through). To verify the *data + engine* path end-to-end without the admin UI, inject a **box** style into a published node and confirm it renders with a real box (not display:contents) and the correct CSS. Create `web/_verify-a2-box.mjs`, run it, load `/our-studio-story`, check, then revert + delete:
```js
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const p = await db.page.findFirst({ where: { slug: "our-studio-story" } });
const blocks = p.blocks;
blocks[0].style = { backgroundColor: "#123456", maxWidth: 500 };
blocks[0].advanced = { padding: { top: 40, right: 40, bottom: 40, left: 40, unit: "px" } };
await db.page.update({ where: { id: p.id }, data: { blocks } });
console.log("injected box style on", blocks[0].id);
await db.$disconnect();
```
Expected on `/our-studio-story`: the first node now has a wrapper whose computed `display` is NOT `contents` (it's a real box), background `rgb(18,52,86)`, `max-width:500px`, `padding:40px`. Then revert (delete `.style`/`.advanced`, update back) and delete the script.
**Then ask the human** to log into `/admin`, open a page, select a block, and confirm the Content/Style/Advanced tabs work and edits apply live on the canvas.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/admin/PageBuilder.tsx
git commit -m "feat: Content/Style/Advanced tabbed inspector wired to node style/advanced"
```

---

## Self-Review

**1. Spec coverage (A2.1 slice of spec §6):**
- Content/Style/Advanced tabs → Task 5. ✅
- StyleControl spec + StyleRenderer (parallel to FieldSpec/FieldsRenderer) → Tasks 2, 4. ✅
- Control library (Color, Dimension, Slider, ButtonGroup; Select/Typography/Background/Border/BoxShadow/Animation/Code) → Tasks 3 ships the first four; **the rest are A2.2+** (documented deferral, not a gap). ✅
- Writes to node.style/node.advanced, rendered by the A1 engine → Tasks 5 + existing css.ts. ✅
- Pre-work trap #1 (display:contents wrapper) → Task 1. ✅
- Pre-work trap #3 (duplicate clones style/advanced) → Task 5 Step 4. ✅
- Pre-work trap #4 (no null writes) → controls write strings/numbers/boxes/"" only; verified by design. ✅
- *Deferred by design:* ResponsiveField + device toggle (A2.3), Typography/Border/Shadow/Background-image/gradient/Hover/Motion/Custom-CSS/Position controls (A2.2/A2.4), per-block style extensions. Not in this plan — correct.

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". The A2.2+ deferral is a concrete, listed boundary.

**3. Type consistency:** `StyleControl`/`BoxValue` defined in Task 2 are consumed with identical shapes in Tasks 3 (`BoxValue` in DimensionControl), 4 (StyleRenderer switch), 5 (STYLE/ADVANCED_CONTROLS). Control value types match the CSS engine: color/align→string, maxWidth/minHeight/borderRadius/zIndex→number, padding/margin→BoxValue, cssClasses/cssId→string. `needsBox` (Task 1) checks the same keys the engine maps. `updateSelectedStyle/Advanced` use `setAt` (never writes null).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-20-live-editor-a2-inspector.md`.
