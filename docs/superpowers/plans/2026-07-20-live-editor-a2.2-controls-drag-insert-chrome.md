# Live Editor — A2.2 controls + drag-to-insert + full-screen chrome fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the full-screen editor's z-index so it covers the admin bar, add palette drag-to-insert alongside the existing reorder DnD, and ship the A2.2 control batch (typography / border / shadow / hover / position / visibility / hardened custom-CSS).

**Architecture:** Additive changes to the existing Live Editor. DnD stays native HTML5, with the drop-index math extracted to a pure, unit-tested `lib/nodes/dnd.ts`. New style controls follow the standing contract — every control key has matching emission in `lib/nodes/css.ts` and is covered by the two guard tests. Box-generating keys go in `needsBox`; inherited text keys pass through the `display:contents` wrapper.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Vitest.

**Spec:** [`docs/superpowers/specs/2026-07-20-live-editor-a2.2-controls-drag-insert-chrome-design.md`](../specs/2026-07-20-live-editor-a2.2-controls-drag-insert-chrome-design.md)

## Global Constraints

- **Branch:** `feature/admin-v1-client-ready`. Do not create a new branch.
- **Working dir for `npm`/`npx`:** `web/` (the Next app). Git runs from repo root `D:/Studiodota.net`.
- **Next.js 16 is not the Next.js you know** (`web/AGENTS.md`): before writing any Next-specific code, read the relevant guide in `web/node_modules/next/dist/docs/`. *All tasks here are client React/DOM + pure TS and touch no Next APIs — no doc read needed unless that changes.*
- **Control-key lockstep:** a key in `STYLE_CONTROLS`/`ADVANCED_CONTROLS` MUST be emitted by `css.ts` (`styleToCss`/`hoverToCss`/`hideCss`/`wrapperAttrs`) AND listed in the matching `styleControls.test.ts` set. `css.test.ts` keeps `needsBox` in sync with box-generating engine keys. Update all together.
- **Byte-identical public render** for un-styled nodes must be preserved — never default the wrapper to a real box; `needsBox` stays the gate for `display:contents`.
- **Custom CSS must ship hardened** (whole-word `selector` replace + `</style>` neutralization). Never expose the textarea control without the `css.ts` hardening (Task 6) already merged.
- **Verification:** the admin is `requireAdmin`-gated and logging in is a prohibited action — the agent CANNOT drive the editor UI. Correctness rests on `npx tsc --noEmit`, `npm run lint`, and `npm test` (Vitest); the UI is verified by the client's spot-check (recipe at the end).
- **Commit messages** end with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## Task 1: Full-screen editor covers the admin bar (chrome fix)

**Files:**
- Modify: `web/src/components/admin/PageBuilder.tsx:172`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (pure CSS class change).

**Why:** `AdminBar` is `sticky top-0 z-[90]` with dropdowns at `z-[95]`; the editor root is `fixed inset-0 z-50`, so the admin bar paints over the editor header. The editor is already `fixed inset-0` (built to cover everything) — only the z-index is wrong.

- [ ] **Step 1: Raise the editor's stacking context**

In `web/src/components/admin/PageBuilder.tsx`, change the root wrapper (line 172) from:

```tsx
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--ink)] text-[var(--bone)]">
```

to:

```tsx
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--ink)] text-[var(--bone)]">
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/PageBuilder.tsx
git commit -m "fix(editor): full-screen editor sits above the admin bar (z-100)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Pure drop-index helpers (`dnd.ts`)

**Files:**
- Create: `web/src/lib/nodes/dnd.ts`
- Test: `web/src/lib/nodes/dnd.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type DropPos = "before" | "after"`
  - `insertIndexFor(over: number, pos: DropPos): number` — index to splice a NEW item in at (nothing removed first).
  - `reorderIndexFor(from: number, over: number, pos: DropPos): number` — final index for a REORDER (source removed first, so indices after `from` shift left by one).

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/nodes/dnd.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { insertIndexFor, reorderIndexFor } from "./dnd";

describe("insertIndexFor", () => {
  it("inserts before the hovered index", () => {
    expect(insertIndexFor(2, "before")).toBe(2);
    expect(insertIndexFor(0, "before")).toBe(0);
  });
  it("inserts after the hovered index", () => {
    expect(insertIndexFor(2, "after")).toBe(3);
    expect(insertIndexFor(0, "after")).toBe(1);
  });
});

describe("reorderIndexFor", () => {
  it("moving down: target shifts left by one after removal", () => {
    // drag item 0 to after item 3 -> lands at index 3
    expect(reorderIndexFor(0, 3, "after")).toBe(3);
    // drag item 1 to before item 4 -> insert idx 4, from<4 -> 3
    expect(reorderIndexFor(1, 4, "before")).toBe(3);
  });
  it("moving up: target unaffected by removal", () => {
    // drag item 5 to before item 2 -> 2
    expect(reorderIndexFor(5, 2, "before")).toBe(2);
    // drag item 4 to after item 1 -> insert idx 2, from(4)>=2 -> 2
    expect(reorderIndexFor(4, 1, "after")).toBe(2);
  });
  it("dropping onto itself is a no-op index", () => {
    expect(reorderIndexFor(2, 2, "before")).toBe(2);
    expect(reorderIndexFor(2, 2, "after")).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/nodes/dnd.test.ts`
Expected: FAIL — `Failed to resolve import "./dnd"` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `web/src/lib/nodes/dnd.ts`:

```ts
/** Drag-and-drop index math for the page-builder canvas (pure, framework-free). */

export type DropPos = "before" | "after";

/** Index to splice a NEW item in at, given the hovered index and half. */
export function insertIndexFor(over: number, pos: DropPos): number {
  return pos === "before" ? over : over + 1;
}

/**
 * Final index for a REORDER: the source at `from` is removed first, so any
 * target index greater than `from` shifts left by one.
 */
export function reorderIndexFor(from: number, over: number, pos: DropPos): number {
  const to = insertIndexFor(over, pos);
  return from < to ? to - 1 : to;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/nodes/dnd.test.ts`
Expected: PASS (2 files? no — 1 file, 3 test blocks, all green).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/nodes/dnd.ts web/src/lib/nodes/dnd.test.ts
git commit -m "feat(editor): pure drop-index helpers for canvas DnD

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Reorder uses the tested helper + robust dataTransfer

**Files:**
- Modify: `web/src/components/admin/PageBuilder.tsx` (import; `handleDrop` lines 129-145; drag handle `onDragStart` line 301)

**Interfaces:**
- Consumes: `reorderIndexFor` from `@/lib/nodes/dnd` (Task 2).
- Produces: unchanged public API.

**Note:** This is UI glue backed by the Task 2 helper; there is no React component-test harness in the repo (Vitest is node-env only — see handoff), so this task is verified by `tsc` + the existing Vitest suite + the manual recipe, not a new failing test.

- [ ] **Step 1: Import the reorder helper**

At the top of `web/src/components/admin/PageBuilder.tsx`, after the existing imports (near line 12), add:

```tsx
import { reorderIndexFor } from "@/lib/nodes/dnd";
```

- [ ] **Step 2: Replace `handleDrop` with the helper-backed version**

Replace the current `handleDrop` (lines 129-145):

```tsx
  const handleDrop = () => {
    if (dragIndex === null || overIndex === null) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    let to = overPos === "before" ? overIndex : overIndex + 1;
    if (dragIndex < to) to -= 1;
    if (dragIndex !== to) {
      const blocks = [...page.blocks];
      const [moved] = blocks.splice(dragIndex, 1);
      blocks.splice(to, 0, moved);
      set("blocks", blocks);
    }
    setDragIndex(null);
    setOverIndex(null);
  };
```

with:

```tsx
  const handleDrop = () => {
    if (dragIndex !== null && overIndex !== null) {
      const to = reorderIndexFor(dragIndex, overIndex, overPos);
      if (dragIndex !== to) {
        const blocks = [...page.blocks];
        const [moved] = blocks.splice(dragIndex, 1);
        blocks.splice(to, 0, moved);
        set("blocks", blocks);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
  };
```

- [ ] **Step 3: Set dataTransfer on the drag handle so the drag reliably initiates**

Replace the drag-handle `onDragStart`/`onDragEnd` (currently line 300-302):

```tsx
                      draggable
                      onDragStart={() => { selectBlock(b.id); setDragIndex(i); }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
```

with:

```tsx
                      draggable
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", b.id); selectBlock(b.id); setDragIndex(i); }}
                      onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
```

- [ ] **Step 4: Typecheck + full test suite**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: `tsc` silent (exit 0); Vitest all green (dnd + existing suites, no regressions).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/admin/PageBuilder.tsx
git commit -m "refactor(editor): reorder via tested helper + dataTransfer for reliable drag

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Palette drag-to-insert

**Files:**
- Modify: `web/src/components/admin/ElementsPanel.tsx` (props + draggable buttons + doc comment)
- Modify: `web/src/components/admin/PageBuilder.tsx` (`dragType` state; import `insertIndexFor`; pass `onDragType`; block `onDragOver`/`onDrop`/indicator; blocks-container drop target; empty-state dropzone; `handleDrop` insert branch)

**Interfaces:**
- Consumes: `insertIndexFor` from `@/lib/nodes/dnd`; existing `insertAt(index, type)` in PageBuilder.
- Produces (ElementsPanel prop): `onDragType?: (type: string | null) => void`.

- [ ] **Step 1: Make ElementsPanel items draggable**

In `web/src/components/admin/ElementsPanel.tsx`:

(a) Update the doc comment (lines 6-11) — remove the stale "drag-to-insert comes in a later pass":

```tsx
/**
 * Persistent left elements panel — the block library. Groups every block type
 * into WordPress-style categories, filters by a search box, and inserts a block
 * on click OR by dragging it onto the canvas. Mirrors the reference editor's
 * left panel.
 */
```

(b) Update the component signature (line 21):

```tsx
export default function ElementsPanel({ onInsert, onDragType }: { onInsert: (type: string) => void; onDragType?: (type: string | null) => void }) {
```

(c) Make each block button draggable (the `<button>` at lines 51-60). Replace it with:

```tsx
                <button
                  key={bt.type}
                  type="button"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", bt.type); onDragType?.(bt.type); }}
                  onDragEnd={() => onDragType?.(null)}
                  onClick={() => onInsert(bt.type)}
                  title={bt.description}
                  className="flex cursor-grab flex-col items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-3 text-center transition-colors hover:border-[var(--gold)] hover:bg-[var(--surface-2)] active:cursor-grabbing"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--surface-2)] text-sm text-[var(--gold-ink)]" aria-hidden="true">{bt.icon}</span>
                  <span className="text-[0.72rem] font-semibold leading-tight text-[var(--bone)]">{bt.label}</span>
                </button>
```

- [ ] **Step 2: Add `dragType` state + import in PageBuilder**

In `web/src/components/admin/PageBuilder.tsx`:

(a) Change the Task 3 import to also bring in `insertIndexFor`:

```tsx
import { insertIndexFor, reorderIndexFor } from "@/lib/nodes/dnd";
```

(b) After the `overPos` state (line 49), add:

```tsx
  const [dragType, setDragType] = useState<string | null>(null);
```

- [ ] **Step 3: Extend `handleDrop` with the insert branch**

Replace the Task 3 `handleDrop` with:

```tsx
  const handleDrop = () => {
    if (dragType !== null) {
      const at = overIndex === null ? page.blocks.length : insertIndexFor(overIndex, overPos);
      insertAt(at, dragType);
    } else if (dragIndex !== null && overIndex !== null) {
      const to = reorderIndexFor(dragIndex, overIndex, overPos);
      if (dragIndex !== to) {
        const blocks = [...page.blocks];
        const [moved] = blocks.splice(dragIndex, 1);
        blocks.splice(to, 0, moved);
        set("blocks", blocks);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
    setDragType(null);
  };
```

- [ ] **Step 4: Pass `onDragType` to ElementsPanel**

Replace the ElementsPanel usage (line 235):

```tsx
            <ElementsPanel onInsert={(type) => insertAt(insertIndex(), type)} />
```

with:

```tsx
            <ElementsPanel onInsert={(type) => insertAt(insertIndex(), type)} onDragType={setDragType} />
```

- [ ] **Step 5: Make the blocks container a drop target (append / empty page)**

Replace the blocks-container opening `<div>` (line 258):

```tsx
            <div className="mt-6 bg-[var(--ink)]">
```

with:

```tsx
            <div
              className="mt-6 bg-[var(--ink)]"
              onDragOver={(e) => {
                if (dragIndex === null && dragType === null) return;
                e.preventDefault();
                setOverIndex(page.blocks.length ? page.blocks.length - 1 : null);
                setOverPos("after");
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(); }}
            >
```

- [ ] **Step 6: Show a dropzone hint on an empty page**

Replace the empty-state block (lines 259-270):

```tsx
              {page.blocks.length === 0 && (
                <div className="px-8 py-16 text-center">
                  <p className="text-sm text-[var(--muted)]">Empty page.</p>
                  <button
                    type="button"
                    onClick={() => setInserterOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]"
                  >
                    + Add your first block
                  </button>
                </div>
              )}
```

with:

```tsx
              {page.blocks.length === 0 && (
                <div className={`m-4 px-8 py-16 text-center ${dragType ? "rounded-lg border-2 border-dashed border-[var(--gold)] bg-[var(--surface-2)]" : ""}`}>
                  {dragType ? (
                    <p className="text-sm font-semibold text-[var(--gold-ink)]">Drop block here</p>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--muted)]">Empty page.</p>
                      <button
                        type="button"
                        onClick={() => setInserterOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]"
                      >
                        + Add your first block
                      </button>
                    </>
                  )}
                </div>
              )}
```

- [ ] **Step 7: Widen the per-block drag handlers to cover palette drags**

In the block wrapper, replace the `onDragOver` (lines 286-292) and `onDrop` (line 293):

```tsx
                    onDragOver={(e) => {
                      if (dragIndex === null) return;
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      setOverIndex(i);
                      setOverPos(e.clientY < r.top + r.height / 2 ? "before" : "after");
                    }}
                    onDrop={(e) => { e.preventDefault(); handleDrop(); }}
```

with (guard widened for `dragType`, and `stopPropagation` so the container handler doesn't also fire):

```tsx
                    onDragOver={(e) => {
                      if (dragIndex === null && dragType === null) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      setOverIndex(i);
                      setOverPos(e.clientY < r.top + r.height / 2 ? "before" : "after");
                    }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(); }}
```

- [ ] **Step 8: Render the drop indicator for either drag kind**

Replace the indicator guard (line 296):

```tsx
                    {dragIndex !== null && overIndex === i && (
```

with:

```tsx
                    {(dragIndex !== null || dragType !== null) && overIndex === i && (
```

- [ ] **Step 9: Typecheck + full test suite**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: `tsc` silent; Vitest all green (no regressions).

- [ ] **Step 10: Commit**

```bash
git add web/src/components/admin/ElementsPanel.tsx web/src/components/admin/PageBuilder.tsx
git commit -m "feat(editor): drag blocks from the palette onto the canvas

Palette items are draggable; canvas reuses the drop-indicator machinery to
insert a new block before/after the hovered block, or append when released in
the gutter / on an empty page. Reorder unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: CSS engine emits the new box + typography properties

**Files:**
- Modify: `web/src/lib/nodes/css.ts` (`styleToCss`; add `SHADOW_PRESETS`/`shadowOf`; `STYLE_BOX_KEYS`)
- Test: `web/src/lib/nodes/css.test.ts` (new emission assertions + extended `needsBox`-sync arrays)

**Interfaces:**
- Consumes: existing `decl`, `lenOf`, `resolveResponsive` in `css.ts`.
- Produces: `styleToCss` now emits `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `width`, `border-*`, `box-shadow`, `position`. `needsBox` treats `borderWidth`/`borderStyle`/`borderColor`/`width`/`boxShadow` (style) and `position` (advanced) as box-generating.

- [ ] **Step 1: Write the failing tests**

In `web/src/lib/nodes/css.test.ts`, add these blocks inside the existing `describe("styleToCss", …)` (after line 35):

```ts
  it("emits typography (inherited) declarations", () => {
    const css = styleToCss(
      { fontSize: 20, fontWeight: 600, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase" },
      {},
      "base",
    );
    expect(css).toContain("font-size:20px;");
    expect(css).toContain("font-weight:600;");
    expect(css).toContain("line-height:1.5;");
    expect(css).toContain("letter-spacing:1px;");
    expect(css).toContain("text-transform:uppercase;");
  });
  it("resolves typography per breakpoint", () => {
    expect(styleToCss({ fontSize: { base: 20, mobile: 14 } }, {}, "mobile")).toBe("font-size:14px;");
  });
  it("emits width", () => {
    expect(styleToCss({ width: 300 }, {}, "base")).toContain("width:300px;");
  });
  it("emits a border, defaulting style to solid", () => {
    const css = styleToCss({ borderWidth: 2, borderColor: "#a87f3f" }, {}, "base");
    expect(css).toContain("border-width:2px;");
    expect(css).toContain("border-style:solid;");
    expect(css).toContain("border-color:#a87f3f;");
  });
  it("honors an explicit border style", () => {
    expect(styleToCss({ borderWidth: 1, borderStyle: "dashed" }, {}, "base")).toContain("border-style:dashed;");
  });
  it("maps a box-shadow preset to a shadow string", () => {
    expect(styleToCss({ boxShadow: "medium" }, {}, "base")).toContain("box-shadow:0 4px 12px");
  });
  it("emits no shadow for the 'none' preset", () => {
    expect(styleToCss({ boxShadow: "none" }, {}, "base")).not.toContain("box-shadow");
  });
  it("emits position from advanced", () => {
    expect(styleToCss({}, { position: "relative" }, "base")).toContain("position:relative;");
  });
```

Add this to the `describe("needsBox", …)` block (after line 111):

```ts
  it("false for inheritable typography (font-size)", () => {
    expect(needsBox(n({ style: { fontSize: 20 } }))).toBe(false);
  });
  it("true for border / width / shadow", () => {
    expect(needsBox(n({ style: { borderWidth: 2 } }))).toBe(true);
    expect(needsBox(n({ style: { width: 300 } }))).toBe(true);
    expect(needsBox(n({ style: { boxShadow: "soft" } }))).toBe(true);
  });
```

And extend the sync-coverage arrays (lines 123-124) to:

```ts
    const styleBoxKeys = ["backgroundColor", "minHeight", "maxWidth", "borderRadius", "width", "borderWidth", "borderStyle", "borderColor", "boxShadow"];
    const advBoxKeys = ["padding", "margin", "zIndex", "position"];
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/lib/nodes/css.test.ts`
Expected: FAIL — the new `styleToCss` assertions fail (properties not emitted), and the `needsBox` "border / width / shadow" + sync-array cases fail (`borderWidth`/`borderStyle`/`borderColor` not yet in `STYLE_BOX_KEYS`, `position` not yet exercised).

- [ ] **Step 3: Add the shadow presets + emission to `styleToCss`**

In `web/src/lib/nodes/css.ts`, add above `styleToCss` (after `boxCss`, ~line 34):

```ts
const SHADOW_PRESETS: Record<string, string> = {
  soft: "0 1px 3px rgba(17,19,21,0.08), 0 1px 2px rgba(17,19,21,0.06)",
  medium: "0 4px 12px rgba(17,19,21,0.10), 0 2px 4px rgba(17,19,21,0.06)",
  strong: "0 10px 30px rgba(17,19,21,0.16), 0 4px 8px rgba(17,19,21,0.08)",
};

function shadowOf(v: unknown): string | undefined {
  return typeof v === "string" && SHADOW_PRESETS[v] ? SHADOW_PRESETS[v] : undefined;
}
```

Then replace the body of `styleToCss` (lines 36-54) with:

```ts
export function styleToCss(
  style: Record<string, unknown>,
  advanced: Record<string, unknown>,
  bp: Breakpoint,
): string {
  const r = <T,>(v: unknown) => resolveResponsive<T>(v as Responsive<T>, bp);
  let css = "";
  css += boxCss("padding", r(advanced.padding));
  css += boxCss("margin", r(advanced.margin));
  css += decl("background-color", r<string>(style.backgroundColor));
  css += decl("color", r<string>(style.color));
  css += decl("text-align", r<string>(style.textAlign));
  // Typography (inherited — passes through a display:contents wrapper)
  css += decl("font-size", lenOf(r(style.fontSize)));
  css += decl("font-weight", r<string | number>(style.fontWeight));
  css += decl("line-height", r<string | number>(style.lineHeight));
  css += decl("letter-spacing", lenOf(r(style.letterSpacing)));
  css += decl("text-transform", r<string>(style.textTransform));
  // Sizing
  css += decl("width", lenOf(r(style.width)));
  css += decl("min-height", lenOf(r(style.minHeight)));
  css += decl("max-width", lenOf(r(style.maxWidth)));
  css += decl("border-radius", lenOf(r(style.borderRadius)));
  // Border (default style to solid when a width/color is set but style isn't)
  const bw = lenOf(r(style.borderWidth));
  const bc = r<string>(style.borderColor);
  const bs = r<string>(style.borderStyle);
  if (bw || (typeof bc === "string" && bc) || (typeof bs === "string" && bs)) {
    css += decl("border-width", bw);
    css += decl("border-style", typeof bs === "string" && bs ? bs : "solid");
    css += decl("border-color", typeof bc === "string" ? bc : undefined);
  }
  // Shadow
  css += decl("box-shadow", shadowOf(r(style.boxShadow)));
  // Position + z-index
  css += decl("position", r<string>(advanced.position));
  const z = r<number>(advanced.zIndex);
  css += decl("z-index", typeof z === "number" ? z : undefined);
  return css;
}
```

- [ ] **Step 4: Mark the new style props box-generating in `needsBox`**

Replace `STYLE_BOX_KEYS` (line 112):

```ts
const STYLE_BOX_KEYS = ["backgroundColor", "background", "backgroundImage", "minHeight", "maxWidth", "width", "borderRadius", "border", "boxShadow"];
```

with:

```ts
const STYLE_BOX_KEYS = ["backgroundColor", "background", "backgroundImage", "minHeight", "maxWidth", "width", "borderRadius", "borderWidth", "borderStyle", "borderColor", "boxShadow"];
```

(`ADV_BOX_KEYS` already includes `position` — no change.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npx vitest run src/lib/nodes/css.test.ts`
Expected: PASS (all css.ts cases green).

- [ ] **Step 6: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: silent (exit 0).

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/nodes/css.ts web/src/lib/nodes/css.test.ts
git commit -m "feat(engine): emit typography, width, border, shadow, position styles

Extends styleToCss with inherited typography (display:contents-safe) and
box-generating border/width/shadow/position; needsBox updated in lockstep.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Harden custom-CSS injection

**Files:**
- Modify: `web/src/lib/nodes/css.ts` (`nodeCss` custom-CSS branch line 98-99; add `sanitizeCustomCss`)
- Test: `web/src/lib/nodes/css.test.ts` (word-boundary + `</style>` cases)

**Interfaces:**
- Consumes: nothing new.
- Produces: internal `sanitizeCustomCss(css, sel)` (not exported; exercised through `nodeCss`).

**Why:** `nodeCss` currently does `custom.replace(/selector/g, sel)` and `BlockRenderer` injects the result via `dangerouslySetInnerHTML`. A substring `selector` inside another word is wrongly rewritten, and a literal `</style` can break out of the injected `<style>` tag. Admin-only authoring keeps risk low, but this is the handoff-flagged trap and must land before the Custom CSS control (Task 8) is exposed.

- [ ] **Step 1: Write the failing tests**

In `web/src/lib/nodes/css.test.ts`, inside `describe("nodeCss", …)`, add after the existing "substitutes `selector`" test (line 74):

```ts
  it("only substitutes the whole-word `selector` token", () => {
    const css = nodeCss(base({ advanced: { customCss: ".selectorish { color: red; }" } }));
    expect(css).toContain(".selectorish { color: red; }");
    expect(css).not.toContain(".n-abcish");
  });
  it("neutralizes a `</style>` breakout in custom CSS", () => {
    const css = nodeCss(base({ advanced: { customCss: "selector { x: 1 } </style><script>alert(1)</script>" } }));
    expect(css).not.toContain("</style>");
    expect(css).toContain(".n-abc { x: 1 }");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/lib/nodes/css.test.ts`
Expected: FAIL — the `</style>` case fails (raw `</style>` is currently passed through unchanged). (The whole-word case may already pass by luck of the input, but keep it as a regression guard.)

- [ ] **Step 3: Add `sanitizeCustomCss` and use it**

In `web/src/lib/nodes/css.ts`, add above `nodeCss` (after `hideCss`, ~line 76):

```ts
/**
 * Admin-authored custom CSS: replace the whole-word `selector` token with the
 * node's scoped class, and neutralize any `</style` so authored CSS cannot
 * break out of the <style> tag it is injected into.
 */
function sanitizeCustomCss(css: string, sel: string): string {
  return css.replace(/\bselector\b/g, sel).replace(/<\/style/gi, "<\\/style");
}
```

Then replace the custom-CSS branch (lines 98-99):

```ts
  const custom = typeof advanced.customCss === "string" ? advanced.customCss.trim() : "";
  if (custom) parts.push(custom.replace(/selector/g, sel));
```

with:

```ts
  const custom = typeof advanced.customCss === "string" ? advanced.customCss.trim() : "";
  if (custom) parts.push(sanitizeCustomCss(custom, sel));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/lib/nodes/css.test.ts`
Expected: PASS (including the original "substitutes `selector`" test, which still holds).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/nodes/css.ts web/src/lib/nodes/css.test.ts
git commit -m "fix(engine): harden custom-CSS (whole-word selector + </style> escape)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Renderer support — toggle, textarea, and dotted keys

**Files:**
- Create: `web/src/components/admin/controls/ToggleControl.tsx`
- Modify: `web/src/lib/nodes/styleControls.ts` (`StyleControl` union: add `textarea` + `toggle`)
- Modify: `web/src/components/admin/StyleRenderer.tsx` (dotted-key path resolution; `textarea` + `toggle` cases)

**Interfaces:**
- Consumes: `getAt`/`setAt`-style `Path` from `@/components/admin/FieldsRenderer`; `inputCls`/`labelCls` from `@/components/admin/ui`.
- Produces:
  - `StyleControl` union gains `{ kind: "textarea"; key; label; placeholder? }` and `{ kind: "toggle"; key; label }`.
  - `ToggleControl` component: `{ value: boolean; onChange: (v: boolean) => void; label: string }`.
  - `StyleRenderer` resolves a control's `key` as a dotted path (`"hover.color"` → `["hover","color"]`) for both read and write.

- [ ] **Step 1: Create the ToggleControl component**

Create `web/src/components/admin/controls/ToggleControl.tsx`:

```tsx
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
```

- [ ] **Step 2: Extend the StyleControl union**

In `web/src/lib/nodes/styleControls.ts`, add two members to the `StyleControl` union (after the `text` member, line 8):

```ts
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; placeholder?: string }
  | { kind: "toggle"; key: string; label: string }
  | { kind: "group"; label: string; controls: StyleControl[] };
```

- [ ] **Step 3: Add dotted-key resolution + the new cases to StyleRenderer**

In `web/src/components/admin/StyleRenderer.tsx`:

(a) Import ToggleControl (after line 9):

```tsx
import ToggleControl from "@/components/admin/controls/ToggleControl";
```

(b) Replace the value lookup + switch (lines 21-40) with a version that resolves `c.key` as a dotted path and adds the `textarea`/`toggle` cases:

```tsx
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
    }
```

- [ ] **Step 4: Typecheck + full test suite**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: `tsc` silent (the `switch` is exhaustive over the union incl. the two new kinds); Vitest all green (`styleControls.test.ts` still passes — no control uses the new kinds yet).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/admin/controls/ToggleControl.tsx web/src/lib/nodes/styleControls.ts web/src/components/admin/StyleRenderer.tsx
git commit -m "feat(editor): style-renderer supports toggle, textarea, and dotted keys

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Wire the A2.2 control batch into the inspector

**Files:**
- Modify: `web/src/lib/nodes/styleControls.ts` (`STYLE_CONTROLS` + `ADVANCED_CONTROLS`)
- Test: `web/src/lib/nodes/styleControls.test.ts` (`STYLE_KEYS` + `ADV_KEYS` sets)

**Interfaces:**
- Consumes: `StyleControl` kinds incl. `textarea`/`toggle` (Task 7); engine emission for every key (Tasks 5-6); dotted-key rendering (Task 7).
- Produces: the full Style/Advanced control trees the inspector renders.

- [ ] **Step 1: Replace STYLE_CONTROLS + ADVANCED_CONTROLS**

In `web/src/lib/nodes/styleControls.ts`, replace `STYLE_CONTROLS` (lines 12-40) and `ADVANCED_CONTROLS` (lines 43-61) with:

```ts
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
    label: "Typography",
    controls: [
      { kind: "slider", key: "fontSize", label: "Font size", min: 10, max: 96, step: 1, unit: "px" },
      {
        kind: "buttongroup",
        key: "fontWeight",
        label: "Weight",
        options: [
          { value: "400", label: "Normal" },
          { value: "500", label: "Medium" },
          { value: "600", label: "Semibold" },
          { value: "700", label: "Bold" },
        ],
      },
      { kind: "slider", key: "lineHeight", label: "Line height", min: 0.8, max: 2.4, step: 0.05 },
      { kind: "slider", key: "letterSpacing", label: "Letter spacing", min: -2, max: 12, step: 0.5, unit: "px" },
      {
        kind: "buttongroup",
        key: "textTransform",
        label: "Transform",
        options: [
          { value: "none", label: "None" },
          { value: "uppercase", label: "Upper" },
          { value: "capitalize", label: "Caps" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Sizing",
    controls: [
      { kind: "slider", key: "width", label: "Width", min: 0, max: 1600, step: 10, unit: "px" },
      { kind: "slider", key: "maxWidth", label: "Max width", min: 0, max: 1600, step: 10, unit: "px" },
      { kind: "slider", key: "minHeight", label: "Min height", min: 0, max: 1000, step: 10, unit: "px" },
      { kind: "slider", key: "borderRadius", label: "Corner radius", min: 0, max: 80, step: 1, unit: "px" },
    ],
  },
  {
    kind: "group",
    label: "Border",
    controls: [
      { kind: "slider", key: "borderWidth", label: "Border width", min: 0, max: 20, step: 1, unit: "px" },
      {
        kind: "buttongroup",
        key: "borderStyle",
        label: "Border style",
        options: [
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
        ],
      },
      { kind: "color", key: "borderColor", label: "Border color" },
    ],
  },
  {
    kind: "group",
    label: "Shadow",
    controls: [
      {
        kind: "buttongroup",
        key: "boxShadow",
        label: "Box shadow",
        options: [
          { value: "none", label: "None" },
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Hover",
    controls: [
      { kind: "color", key: "hover.backgroundColor", label: "Hover background" },
      { kind: "color", key: "hover.color", label: "Hover text" },
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
    label: "Position",
    controls: [
      {
        kind: "buttongroup",
        key: "position",
        label: "Position",
        options: [
          { value: "static", label: "Static" },
          { value: "relative", label: "Relative" },
          { value: "absolute", label: "Absolute" },
          { value: "sticky", label: "Sticky" },
        ],
      },
      { kind: "slider", key: "zIndex", label: "Z-index", min: 0, max: 100, step: 1 },
    ],
  },
  {
    kind: "group",
    label: "Visibility",
    controls: [
      { kind: "toggle", key: "hideDesktop", label: "Hide on desktop" },
      { kind: "toggle", key: "hideTablet", label: "Hide on tablet" },
      { kind: "toggle", key: "hideMobile", label: "Hide on mobile" },
    ],
  },
  {
    kind: "group",
    label: "Attributes",
    controls: [
      { kind: "text", key: "cssClasses", label: "CSS classes", placeholder: "my-class another" },
      { kind: "text", key: "cssId", label: "CSS ID", placeholder: "unique-id" },
    ],
  },
  {
    kind: "group",
    label: "Custom CSS",
    controls: [
      { kind: "textarea", key: "customCss", label: "Custom CSS", placeholder: "selector { opacity: 0.9; }" },
    ],
  },
];
```

- [ ] **Step 2: Run the guard test to verify it fails**

Run: `cd web && npx vitest run src/lib/nodes/styleControls.test.ts`
Expected: FAIL — "every Style control key is handled by the CSS engine" and the Advanced equivalent fail, because the new keys (`fontSize`, `borderWidth`, `hover.backgroundColor`, `hideDesktop`, `customCss`, …) are not yet in `STYLE_KEYS`/`ADV_KEYS`.

- [ ] **Step 3: Update the guard-test key sets**

In `web/src/lib/nodes/styleControls.test.ts`, replace the two sets (lines 5-6):

```ts
const STYLE_KEYS = new Set(["backgroundColor", "color", "textAlign", "minHeight", "maxWidth", "borderRadius"]);
const ADV_KEYS = new Set(["padding", "margin", "zIndex", "cssClasses", "cssId"]);
```

with:

```ts
// Keys the CSS engine (css.ts) renders. Keep in sync with styleToCss/hoverToCss/hideCss/wrapperAttrs.
const STYLE_KEYS = new Set([
  "backgroundColor", "color", "textAlign",
  "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform",
  "width", "minHeight", "maxWidth", "borderRadius",
  "borderWidth", "borderStyle", "borderColor",
  "boxShadow",
  "hover.backgroundColor", "hover.color",
]);
const ADV_KEYS = new Set([
  "padding", "margin",
  "position", "zIndex",
  "hideDesktop", "hideTablet", "hideMobile",
  "cssClasses", "cssId",
  "customCss",
]);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/lib/nodes/styleControls.test.ts`
Expected: PASS — every control key is now handled, and the "no duplicate keys within a tab" test still holds.

- [ ] **Step 5: Full suite + typecheck + lint**

Run: `cd web && npx tsc --noEmit && npx vitest run && npm run lint`
Expected: `tsc` silent; Vitest all green (count up from 54); `lint` clean.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/nodes/styleControls.ts web/src/lib/nodes/styleControls.test.ts
git commit -m "feat(editor): A2.2 inspector controls (typography/border/shadow/hover/position/visibility/custom-CSS)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (whole branch)

- [ ] **Run the full gate**

Run: `cd web && npx tsc --noEmit && npm run lint && npx vitest run`
Expected: all clean; Vitest test count is 54 + new (dnd + css + styleControls additions).

- [ ] **Client spot-check recipe** (agent cannot log in — hand this to the client):
  1. **Clean restart** (the known Turbopack wedge masquerades as "editor broken"): stop the dev server on `:3000`; delete the dev cache — Bash: `rm -rf web/.next`, or PowerShell: `Remove-Item -Recurse -Force web/.next`; then `cd web && npm run dev`.
  2. **Chrome:** open a page in the editor → the black "Howdy, …" admin bar is gone; the editor's Save / ⚙ / ← are fully clickable.
  3. **Drag-to-insert:** open the left "＋" panel; drag "Heading" between two blocks → it drops there with a gold indicator; drag onto an empty page → the dashed "Drop block here" zone accepts it; drag to the gutter below the last block → it appends.
  4. **Reorder:** hover a block, drag the `⠿` handle up/down → order changes.
  5. **Controls:** select a block → Style tab → set a Border + a Shadow + a Hover color, and Typography; Advanced tab → toggle "Hide on mobile" and try Position/Custom CSS. Save, then View the published page → styles render; the block hides below 767px.

## Notes / known limitations

- **Typography cascade caveat:** inherited type props apply through the `display:contents` wrapper, but a block's own type classes (e.g. `display-l` on a Heading) can override `font-size`. Per-element typography targeting is a later refinement.
- **DnD is pointer-only** (native HTML5). Click-to-insert and the ↑/↓ toolbar remain the keyboard paths.
- **No React component-test harness** exists (Vitest is node-env) — the DnD/inspector wiring (Tasks 1, 3, 4, 7) is covered by `tsc`/`lint` + the client spot-check; pure logic (Tasks 2, 5, 6, 8) is unit-tested.
- **Deferred** (per spec): nested-container drops (A3.2), gradient/background-image, motion, per-breakpoint controls + device toggle (A2.3).
