# A2.3 Responsive Controls + Device Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any responsive-enabled inspector control hold per-device values (desktop/tablet/mobile) edited via a device toggle with live preview, move the box-vs-`display:contents` decision into per-breakpoint CSS, and give containers "Stack on mobile."

**Architecture:** Pure value-level slot helpers (`responsive.ts`) power device-aware reads/writes in `StyleRenderer`. `nodeCss` gains a `preview` mode (flat rules resolved at the toggled breakpoint — media queries can't fire in a narrowed canvas) and a `solidBox` flag (suppresses `display:contents` emission for flex items and the editor wrapper). Container flex moves from inline style into generated CSS so the `stackOnMobile` mobile override can win.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Vitest.

**Spec:** [`docs/superpowers/specs/2026-07-21-responsive-controls-device-toggle-design.md`](../specs/2026-07-21-responsive-controls-device-toggle-design.md)

## Global Constraints

- **Branch:** `feature/admin-v1-client-ready`. Do not create a new branch.
- **Working dir for `npm`/`npx`:** `web/`. Git runs from repo root `D:/Studiodota.net`.
- **Next.js 16 is not the Next.js you know** (`web/AGENTS.md`) — all tasks here are client React + pure TS; no Next APIs touched.
- **Public render:** un-styled childless nodes keep the no-wrapper Fragment path — **byte-identical**. Styled/container nodes move inline→CSS — **render-equivalent** (same computed styles), verified in-browser by the controller.
- **Monotonic box rule:** base values cascade down, so box at base ⇒ box everywhere. Emission: box at base → no display rules (today's behavior); else `.n-id{display:contents}` + `display:revert` media rule from the first breakpoint that needs a box.
- **`solidBox` is load-bearing:** without it, the emitted `display:contents` would hit the editor wrapper (same `.n-{id}` class) and break chrome anchoring, and would dissolve container children (flex items).
- **Containers are always boxes** — never emit display rules for `type === "container"` (an EMPTY container has no children, so `needsBoxAt` alone would wrongly say contents).
- **`Breakpoint` = `"base" | "tablet" | "mobile"`** (`lib/nodes/types.ts`); tablet media = `max-width:1024px`, mobile = `max-width:767px` (existing).
- **Responsive-enabled controls:** kinds `color`/`slider`/`dimension`/`buttongroup` with non-dotted keys. `hover.*`, `text`, `textarea`, `toggle` stay base-only.
- **No React component-test harness** (Vitest is node-env): UI tasks are verified by `npx tsc --noEmit` + `npm run lint` (no NEW errors; ~9 pre-existing errors in unrelated files are out of scope) + a controller-run in-browser pass. Pure logic is unit-tested.
- **Do not import `BlockRenderer.tsx` into a Vitest test** (its module graph pulls next/image etc.) — pure helpers under test live in `lib/nodes/`.
- **Commit messages** end with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

- Create `web/src/lib/nodes/responsive.ts` + `responsive.test.ts` — value-level slot helpers (Task 1).
- Modify `web/src/lib/nodes/css.ts` + `css.test.ts` — `needsBoxAt`, container CSS, display rules, preview mode (Task 2).
- Modify `web/src/components/blocks/BlockRenderer.tsx` + `web/src/components/admin/EditableNode.tsx` — drop inline wrapper styles; pass `solidBox` (Task 3).
- Modify `web/src/components/admin/{PageBuilder,editorContext,EditableNode,StyleRenderer}.tsx|ts` + `web/src/lib/pageBlocks.ts` — device toggle, preview, badge, device-aware controls, `stackOnMobile` field (Task 4).
- Task 5 is controller-run verification (no committed files).

---

## Task 1: Responsive slot helpers (`responsive.ts`)

**Files:**
- Create: `web/src/lib/nodes/responsive.ts`
- Test: `web/src/lib/nodes/responsive.test.ts`

**Interfaces — Produces (value-level; `Responsive<T>`/`Breakpoint` from `./types`):**
- `resolveAt<T>(v: Responsive<T> | undefined, bp: Breakpoint): T | undefined` — CASCADED value (mobile → mobile ?? tablet ?? base; scalar = base value at every bp).
- `writeSlot(cur: unknown, bp: Breakpoint, value: unknown): unknown` — new key value; never loses a scalar base.
- `clearSlot(cur: unknown, bp: Breakpoint): unknown` — remove a slot; collapse `{base: x}` → `x`; base-clear a scalar → `undefined`.
- `hasSlot(cur: unknown, bp: Breakpoint): boolean` — is that slot explicitly set (drives the override dot; always false for scalars at non-base).

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/nodes/responsive.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveAt, writeSlot, clearSlot, hasSlot } from "./responsive";

describe("resolveAt (cascaded)", () => {
  it("scalar applies at every breakpoint", () => {
    expect(resolveAt(10, "base")).toBe(10);
    expect(resolveAt(10, "tablet")).toBe(10);
    expect(resolveAt(10, "mobile")).toBe(10);
  });
  it("cascades base -> tablet -> mobile", () => {
    const v = { base: 10, tablet: 8 };
    expect(resolveAt(v, "base")).toBe(10);
    expect(resolveAt(v, "tablet")).toBe(8);
    expect(resolveAt(v, "mobile")).toBe(8); // inherits tablet
  });
  it("mobile-only value is invisible at base/tablet", () => {
    const v = { mobile: 4 };
    expect(resolveAt(v, "base")).toBeUndefined();
    expect(resolveAt(v, "tablet")).toBeUndefined();
    expect(resolveAt(v, "mobile")).toBe(4);
  });
  it("treats a non-slot object (e.g. a padding box) as a scalar", () => {
    const box = { top: 10, unit: "px" };
    expect(resolveAt(box, "mobile")).toEqual(box);
  });
});

describe("writeSlot", () => {
  it("base write on empty/scalar stays scalar", () => {
    expect(writeSlot(undefined, "base", 20)).toBe(20);
    expect(writeSlot(10, "base", 20)).toBe(20);
  });
  it("base write on a slot object updates .base", () => {
    expect(writeSlot({ base: 10, mobile: 4 }, "base", 20)).toEqual({ base: 20, mobile: 4 });
  });
  it("non-base write on a scalar preserves it as base", () => {
    expect(writeSlot(10, "mobile", 4)).toEqual({ base: 10, mobile: 4 });
  });
  it("non-base write on empty creates a slot-only object", () => {
    expect(writeSlot(undefined, "tablet", 8)).toEqual({ tablet: 8 });
    expect(writeSlot("", "tablet", 8)).toEqual({ tablet: 8 });
  });
  it("non-base write on a slot object sets the slot", () => {
    expect(writeSlot({ base: 10 }, "mobile", 4)).toEqual({ base: 10, mobile: 4 });
  });
});

describe("clearSlot", () => {
  it("clears a slot and keeps the rest", () => {
    expect(clearSlot({ base: 10, mobile: 4 }, "mobile")).toBe(10); // collapses {base:10}
    expect(clearSlot({ base: 10, tablet: 8, mobile: 4 }, "mobile")).toEqual({ base: 10, tablet: 8 });
  });
  it("clearing the last slot removes the value", () => {
    expect(clearSlot({ mobile: 4 }, "mobile")).toBeUndefined();
  });
  it("base-clear on a scalar clears it", () => {
    expect(clearSlot(10, "base")).toBeUndefined();
  });
  it("non-base clear on a scalar is a no-op", () => {
    expect(clearSlot(10, "mobile")).toBe(10);
  });
});

describe("hasSlot", () => {
  it("reports explicit slots only", () => {
    expect(hasSlot({ base: 10, mobile: 4 }, "mobile")).toBe(true);
    expect(hasSlot({ base: 10 }, "mobile")).toBe(false);
    expect(hasSlot(10, "mobile")).toBe(false);
    expect(hasSlot(10, "base")).toBe(true);
    expect(hasSlot(undefined, "base")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/nodes/responsive.test.ts`
Expected: FAIL — `Failed to resolve import "./responsive"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/nodes/responsive.ts`:

```ts
import type { Responsive, Breakpoint } from "./types";

/** Value-level helpers for per-breakpoint slots on style/advanced keys.
 *  Contrast resolveResponsive (css.ts), which reads ONE slot for media-query
 *  emission; resolveAt CASCADES (mobile ?? tablet ?? base) for display/edit. */

type Slots = { base?: unknown; tablet?: unknown; mobile?: unknown };

function isSlots(v: unknown): v is Slots {
  return (
    typeof v === "object" && v !== null && !Array.isArray(v) &&
    ("base" in v || "tablet" in v || "mobile" in v)
  );
}

export function resolveAt<T>(v: Responsive<T> | undefined, bp: Breakpoint): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (isSlots(v)) {
    const s = v as { base?: T; tablet?: T; mobile?: T };
    if (bp === "mobile") return s.mobile ?? s.tablet ?? s.base;
    if (bp === "tablet") return s.tablet ?? s.base;
    return s.base;
  }
  return v as T; // a scalar applies from base and cascades everywhere
}

export function writeSlot(cur: unknown, bp: Breakpoint, value: unknown): unknown {
  if (bp === "base") {
    if (isSlots(cur)) return { ...cur, base: value };
    return value;
  }
  if (isSlots(cur)) return { ...cur, [bp]: value };
  const empty = cur === undefined || cur === null || cur === "";
  return empty ? { [bp]: value } : { base: cur, [bp]: value };
}

export function clearSlot(cur: unknown, bp: Breakpoint): unknown {
  if (!isSlots(cur)) return bp === "base" ? undefined : cur;
  const next: Slots = { ...cur };
  delete next[bp];
  const set = (["base", "tablet", "mobile"] as const).filter((k) => next[k] !== undefined);
  if (set.length === 0) return undefined;
  if (set.length === 1 && set[0] === "base") return next.base;
  return next;
}

export function hasSlot(cur: unknown, bp: Breakpoint): boolean {
  if (isSlots(cur)) return (cur as Slots)[bp] !== undefined;
  return bp === "base" && cur !== undefined && cur !== null && cur !== "";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/nodes/responsive.test.ts`
Expected: PASS (all 4 groups).

- [ ] **Step 5: Full suite + commit**

Run: `cd web && npx vitest run && npx tsc --noEmit` → all green, tsc silent.

```bash
git add web/src/lib/nodes/responsive.ts web/src/lib/nodes/responsive.test.ts
git commit -m "feat(engine): responsive slot helpers (cascaded read, lossless write, collapse-on-clear)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Engine — `needsBoxAt`, container CSS, display rules, preview mode

**Files:**
- Modify: `web/src/lib/nodes/css.ts`
- Test: `web/src/lib/nodes/css.test.ts`

**Interfaces:**
- Consumes: `resolveAt` from `./responsive` (Task 1).
- Produces: `needsBoxAt(node: Node, bp: Breakpoint): boolean`; `nodeCss(node: Node, opts?: { preview?: Breakpoint; solidBox?: boolean }): string`. `needsBox(node)` is preserved (≡ box at any breakpoint). `styleToCss` unchanged.

- [ ] **Step 1: Write the failing tests**

Add to `web/src/lib/nodes/css.test.ts` — a new top-level describe (import `needsBoxAt` alongside the existing imports from `./css`):

```ts
describe("needsBoxAt / per-breakpoint display rules", () => {
  const n = (over: Partial<Node>): Node => ({ id: "abc", type: "text", props: {}, ...over });

  it("mobile-only box prop: no box at base, box at mobile", () => {
    const node = n({ style: { backgroundColor: { mobile: "#000" } } });
    expect(needsBoxAt(node, "base")).toBe(false);
    expect(needsBoxAt(node, "tablet")).toBe(false);
    expect(needsBoxAt(node, "mobile")).toBe(true);
  });
  it("base box prop cascades: box everywhere", () => {
    const node = n({ style: { backgroundColor: "#000" } });
    expect(needsBoxAt(node, "base")).toBe(true);
    expect(needsBoxAt(node, "mobile")).toBe(true);
  });
  it("boxShadow 'none' never forces a box at any bp", () => {
    expect(needsBoxAt(n({ style: { boxShadow: "none" } }), "mobile")).toBe(false);
  });
  it("emits display:contents + revert at the first boxed bp", () => {
    const css = nodeCss(n({ style: { color: "#111", backgroundColor: { mobile: "#000" } } }));
    expect(css).toContain("display:contents");
    expect(css).toContain("@media (max-width:767px){.n-abc{display:revert;}}");
  });
  it("tablet-first box uses the tablet query", () => {
    const css = nodeCss(n({ style: { color: "#111", backgroundColor: { tablet: "#000" } } }));
    expect(css).toContain("@media (max-width:1024px){.n-abc{display:revert;}}");
    expect(css).not.toContain("max-width:767px){.n-abc{display:revert");
  });
  it("box at base emits NO display rules (unchanged behavior)", () => {
    const css = nodeCss(n({ style: { backgroundColor: "#000" } }));
    expect(css).not.toContain("display:contents");
    expect(css).not.toContain("display:revert");
  });
  it("solidBox suppresses display rules", () => {
    const css = nodeCss(n({ style: { color: "#111" } }), { solidBox: true });
    expect(css).not.toContain("display:contents");
  });
  it("inheritable-only style STILL emits display:contents (replaces the old inline style)", () => {
    const css = nodeCss(n({ style: { color: "#111" } }));
    expect(css).toContain("display:contents");
  });
});

describe("container CSS + stackOnMobile", () => {
  const c = (props: Record<string, unknown>, over: Partial<Node> = {}): Node =>
    ({ id: "abc", type: "container", props, ...over });

  it("emits flex layout from props in the base rule", () => {
    const css = nodeCss(c({ direction: "row", gap: 24, align: "center", justify: "between", wrap: true }));
    expect(css).toContain("display:flex;");
    expect(css).toContain("flex-direction:row;");
    expect(css).toContain("gap:24px;");
    expect(css).toContain("align-items:center;");
    expect(css).toContain("justify-content:space-between;");
    expect(css).toContain("flex-wrap:wrap;");
  });
  it("stackOnMobile on a row emits the mobile column override", () => {
    const css = nodeCss(c({ direction: "row", stackOnMobile: true }));
    expect(css).toContain("@media (max-width:767px){.n-abc{flex-direction:column;}}");
  });
  it("stackOnMobile on a column emits no override", () => {
    const css = nodeCss(c({ direction: "column", stackOnMobile: true }));
    expect(css).not.toContain("flex-direction:column;}}"); // no media override needed
  });
  it("a container never emits display:contents (even when empty/un-styled)", () => {
    expect(nodeCss(c({ direction: "row" }))).not.toContain("display:contents");
  });
});

describe("nodeCss preview mode", () => {
  const n = (over: Partial<Node>): Node => ({ id: "abc", type: "text", props: {}, ...over });

  it("emits ONE flat rule resolved at the previewed bp (cascade order, later wins)", () => {
    const css = nodeCss(n({ style: { fontSize: { base: 20, mobile: 14 } } }), { preview: "mobile", solidBox: true });
    expect(css).toContain("font-size:20px;");           // base first…
    expect(css).toContain("font-size:14px;");           // …mobile later in the SAME block (wins)
    expect(css.indexOf("font-size:14px;")).toBeGreaterThan(css.indexOf("font-size:20px;"));
    expect(css).not.toContain("@media");
  });
  it("desktop preview shows base only", () => {
    const css = nodeCss(n({ style: { fontSize: { base: 20, mobile: 14 } } }), { preview: "base", solidBox: true });
    expect(css).toContain("font-size:20px;");
    expect(css).not.toContain("font-size:14px;");
  });
  it("preview suppresses hide-* display:none (editor shows a badge instead)", () => {
    const css = nodeCss(n({ advanced: { hideMobile: true } }), { preview: "mobile", solidBox: true });
    expect(css).not.toContain("display:none");
  });
  it("preview of a stackOnMobile row resolves to column at mobile", () => {
    const css = nodeCss({ id: "abc", type: "container", props: { direction: "row", stackOnMobile: true } }, { preview: "mobile", solidBox: true });
    expect(css).toContain("flex-direction:row;");
    expect(css.indexOf("flex-direction:column;")).toBeGreaterThan(css.indexOf("flex-direction:row;"));
    expect(css).not.toContain("@media");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web && npx vitest run src/lib/nodes/css.test.ts`
Expected: FAIL — `needsBoxAt` not exported; `nodeCss` ignores the opts argument; container/display/preview assertions all fail.

- [ ] **Step 3: Implement in `css.ts`**

(a) Import `resolveAt`: add `import { resolveAt } from "./responsive";` after the types import.

(b) Add after `shadowOf` (and DELETE the now-superseded `hasShadow` function later in the file — `needsBox` is redefined below):

```ts
const ALIGN_CSS: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
const JUSTIFY_CSS: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" };

/** Base flex declarations for a container node ("" for non-containers). */
function containerDecls(node: Node): string {
  if (node.type !== "container") return "";
  const p = node.props ?? {};
  let css = "display:flex;";
  css += decl("flex-direction", p.direction === "row" ? "row" : "column");
  if (typeof p.gap === "number") css += decl("gap", `${p.gap}px`);
  css += decl("align-items", ALIGN_CSS[String(p.align)] ?? "stretch");
  css += decl("justify-content", JUSTIFY_CSS[String(p.justify)] ?? "flex-start");
  css += decl("flex-wrap", p.wrap ? "wrap" : "nowrap");
  return css;
}

/** Does this row container stack to a column below 767px? */
function containerStacks(node: Node): boolean {
  const p = node.props ?? {};
  return node.type === "container" && p.direction === "row" && Boolean(p.stackOnMobile);
}
```

(c) Replace `needsBox` (and delete `hasShadow`) with the per-breakpoint pair — `STYLE_BOX_KEYS`/`ADV_BOX_KEYS`/`hasVal` stay exactly as they are:

```ts
/** A key counts as boxed at a breakpoint using CASCADED values (base flows down). */
function hasValAt(v: unknown, bp: Breakpoint): boolean {
  return hasVal(resolveAt(v as Responsive<unknown>, bp));
}

/** needsBox evaluated at one breakpoint. Box-ness is monotonic (base cascades),
 *  so needsBoxAt(base) ⇒ needsBoxAt(tablet) ⇒ needsBoxAt(mobile). */
export function needsBoxAt(node: Node, bp: Breakpoint): boolean {
  if (node.children?.length) return true;
  const s = (node.style ?? {}) as Record<string, unknown>;
  const a = (node.advanced ?? {}) as Record<string, unknown>;
  if (STYLE_BOX_KEYS.some((k) => hasValAt(s[k], bp))) return true;
  if (shadowOf(resolveAt(s.boxShadow as Responsive<unknown>, bp))) return true;
  if (ADV_BOX_KEYS.some((k) => hasValAt(a[k], bp))) return true;
  if (s.hover && typeof s.hover === "object") return true;
  if (typeof a.customCss === "string" && a.customCss.trim()) return true;
  return false;
}

/** Box needed at ANY breakpoint (mobile sees the full cascade — see monotonicity). */
export function needsBox(node: Node): boolean {
  return needsBoxAt(node, "mobile");
}
```

(d) Replace `nodeCss` with the opts-aware version (keep `sanitizeCustomCss` and the trailing whole-sheet `</style` escape exactly as they are):

```ts
/** Full stylesheet fragment for one node, scoped to `.n-{id}`. Empty if nothing to style.
 *  opts.preview (editor): ONE flat rule resolved at that breakpoint — no media queries,
 *  no hide-* rules (the editor badges hidden nodes instead).
 *  opts.solidBox: never emit display:contents (flex items and the editor wrapper are real boxes). */
export function nodeCss(node: Node, opts?: { preview?: Breakpoint; solidBox?: boolean }): string {
  const sel = `.n-${node.id}`;
  const style = (node.style ?? {}) as Record<string, unknown>;
  const advanced = (node.advanced ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  const cont = containerDecls(node);
  const hover = hoverToCss(style);

  if (opts?.preview) {
    const bps: Breakpoint[] =
      opts.preview === "mobile" ? ["base", "tablet", "mobile"] : opts.preview === "tablet" ? ["base", "tablet"] : ["base"];
    let flat = cont;
    if (containerStacks(node) && opts.preview === "mobile") flat += "flex-direction:column;";
    for (const b of bps) flat += styleToCss(style, advanced, b);
    const rule = hover ? `transition:all ${transitionOf(style)};${flat}` : flat;
    if (rule) parts.push(`${sel}{${rule}}`);
    if (hover) parts.push(`${sel}:hover{${hover}}`);
    const custom = typeof advanced.customCss === "string" ? advanced.customCss.trim() : "";
    if (custom) parts.push(sanitizeCustomCss(custom, sel));
    return parts.join("").replace(/<\/style/gi, "<\\/style");
  }

  // Per-breakpoint display decision (public render): contents at base unless boxed,
  // reverting to a real box at the first breakpoint that needs one. Containers are
  // always boxes; solidBox callers (flex items, the editor) opt out entirely.
  // BARE nodes (no style/advanced bags) must stay "" so BlockRenderer keeps its
  // no-wrapper Fragment path — byte-identity for untouched nodes.
  const hasBags = Boolean(node.style || node.advanced);
  let display = "";
  if (!opts?.solidBox && node.type !== "container" && hasBags && !needsBoxAt(node, "base")) {
    display = "display:contents;";
    if (needsBoxAt(node, "tablet")) parts.push(`@media (max-width:1024px){${sel}{display:revert;}}`);
    else if (needsBoxAt(node, "mobile")) parts.push(`@media (max-width:767px){${sel}{display:revert;}}`);
  }

  const base = display + cont + styleToCss(style, advanced, "base");
  const baseRule = hover ? `transition:all ${transitionOf(style)};${base}` : base;
  if (baseRule) parts.unshift(`${sel}{${baseRule}}`);
  if (hover) parts.push(`${sel}:hover{${hover}}`);

  const tablet = styleToCss(style, advanced, "tablet");
  if (tablet) parts.push(`@media (max-width:1024px){${sel}{${tablet}}}`);
  const mobileExtra = containerStacks(node) ? "flex-direction:column;" : "";
  const mobile = mobileExtra + styleToCss(style, advanced, "mobile");
  if (mobile) parts.push(`@media (max-width:767px){${sel}{${mobile}}}`);

  parts.push(...hideCss(sel, advanced));

  const custom = typeof advanced.customCss === "string" ? advanced.customCss.trim() : "";
  if (custom) parts.push(sanitizeCustomCss(custom, sel));

  return parts.join("").replace(/<\/style/gi, "<\\/style");
}
```

(Note the `unshift` keeps the base rule first while the display-revert media rule was computed earlier; ordering of media rules after the base rule is preserved.)

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run src/lib/nodes/css.test.ts`
Expected: PASS — new describes green AND every pre-existing test still green (`needsBox` redefinition satisfies the existing suite: box-at-any-bp ≡ mobile cascade; `boxShadow:"none"` still false; empty shells still false).

- [ ] **Step 5: Full suite + tsc + commit**

Run: `cd web && npx vitest run && npx tsc --noEmit` → all green (existing consumers of `nodeCss(node)` are unaffected — opts is optional).

```bash
git add web/src/lib/nodes/css.ts web/src/lib/nodes/css.test.ts
git commit -m "feat(engine): per-breakpoint box decision, container CSS + stackOnMobile, preview mode

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Renderer switch — wrapper styles move into CSS

**Files:**
- Modify: `web/src/components/blocks/BlockRenderer.tsx`
- Modify: `web/src/components/admin/EditableNode.tsx`

**Interfaces:**
- Consumes: `nodeCss(node, { solidBox })` (Task 2).
- Produces: `BlockRenderer` no longer exports `nodeWrapperStyle`/`containerFlexStyle` (both deleted); `Block` export unchanged.

- [ ] **Step 1: BlockRenderer — delete the style helpers, emit via nodeCss**

(a) Delete the `ALIGN`/`JUSTIFY` maps and both `containerFlexStyle` and `nodeWrapperStyle` functions (their logic now lives in `css.ts`). Remove `needsBox` from the css import if it becomes unused.

(b) In `renderNode`, change the css computation and wrapper:

Old:
```tsx
  const css = nodeCss(node);
```
New:
```tsx
  const css = nodeCss(node, { solidBox: flexItem });
```

Old wrapper div:
```tsx
    <div
      key={node.id}
      className={className}
      id={id}
      data-node={node.id}
      style={nodeWrapperStyle(node, flexItem)}
    >
```
New (no inline style at all — display and flex live in the emitted CSS):
```tsx
    <div
      key={node.id}
      className={className}
      id={id}
      data-node={node.id}
    >
```

(c) `hasWrap` currently reads `Boolean(css || kids || node.style || node.advanced)` — leave it; a bare container has kids and now gets its flex from the emitted `css`.

- [ ] **Step 2: EditableNode — solidBox + drop the inline flex**

(a) Remove `containerFlexStyle` from the BlockRenderer import (keep `Block`).
(b) Change `const css = nodeCss(node);` to `const css = nodeCss(node, { solidBox: true });` (the preview arg arrives in Task 4).
(c) Remove the wrapper's `style={containerFlexStyle(node)}` prop entirely — container flex now applies via the emitted `.n-{id}` rule (the wrapper carries that class).

- [ ] **Step 3: Gate**

Run: `cd web && npx tsc --noEmit && npx vitest run && npx eslint src/components/blocks/BlockRenderer.tsx src/components/admin/EditableNode.tsx`
Expected: tsc silent; suite green; eslint clean on both files.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/BlockRenderer.tsx web/src/components/admin/EditableNode.tsx
git commit -m "refactor(render): wrapper display/flex emitted as CSS (solidBox for flex items + editor)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Editor — device toggle, preview, hidden badge, device-aware controls, stackOnMobile field

**Files:**
- Modify: `web/src/components/admin/editorContext.ts` (add `device`)
- Modify: `web/src/components/admin/PageBuilder.tsx` (device state + header toggle + canvas width + provider + StyleRenderer props)
- Modify: `web/src/components/admin/EditableNode.tsx` (preview emission + hidden badge)
- Modify: `web/src/components/admin/StyleRenderer.tsx` (device-aware read/write + override dot)
- Modify: `web/src/lib/pageBlocks.ts` (`stackOnMobile` field + default)

**Interfaces:**
- Consumes: `resolveAt`/`writeSlot`/`clearSlot`/`hasSlot` (Task 1); `nodeCss(node, { solidBox, preview })` (Task 2); `Breakpoint` from `@/lib/nodes/types`.
- Produces: `EditorApi.device: Breakpoint`; `StyleRenderer` prop `device?: Breakpoint`.

- [ ] **Step 1: editorContext — add `device`**

In `web/src/components/admin/editorContext.ts`, add to the `EditorApi` type (after `selectedId`):

```ts
  device: Breakpoint;
```

and add the import `import type { Breakpoint } from "@/lib/nodes/types";` at the top.

- [ ] **Step 2: PageBuilder — device state, header toggle, canvas width, provider**

(a) Imports: add `import type { Breakpoint } from "@/lib/nodes/types";`.

(b) State (next to the other `useState` calls):
```tsx
  const [device, setDevice] = useState<Breakpoint>("base");
```

(c) Header toggle — insert into the header bar right BEFORE the `{pageId && page.status === "published" && …View…}` link:
```tsx
        <div className="mr-1 hidden items-center gap-0.5 rounded-lg border border-[var(--line-strong)] p-0.5 md:flex" role="group" aria-label="Preview device">
          {([["base", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]] as const).map(([bp, label]) => (
            <button
              key={bp}
              type="button"
              aria-pressed={device === bp}
              onClick={() => setDevice(bp)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${device === bp ? "bg-[var(--gold)] text-[#17191c]" : "text-[var(--bone-dim)] hover:bg-[var(--surface-2)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
```

(d) Canvas width — replace the canvas card's width class. Old:
```tsx
          <div className="mx-auto my-6 w-[min(100%-2rem,1100px)] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_4px_rgba(17,19,21,0.06)]">
```
New:
```tsx
          <div className={`mx-auto my-6 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] shadow-[0_1px_4px_rgba(17,19,21,0.06)] transition-[width] ${device === "mobile" ? "w-[min(100%-2rem,390px)]" : device === "tablet" ? "w-[min(100%-2rem,1024px)]" : "w-[min(100%-2rem,1100px)]"}`}>
```

(e) Provider value: add `device,` to the `EditorContext.Provider` value object.

(f) Both `StyleRenderer` usages (style + advanced tabs) get `device={device}`:
```tsx
                      <StyleRenderer controls={STYLE_CONTROLS} data={(selectedBlock.style ?? {}) as Json} onChange={updateSelectedStyle} device={device} />
```
```tsx
                      <StyleRenderer controls={ADVANCED_CONTROLS} data={(selectedBlock.advanced ?? {}) as Json} onChange={updateSelectedAdvanced} device={device} />
```

- [ ] **Step 3: EditableNode — preview emission + hidden badge**

(a) Change the css line to:
```tsx
  const css = nodeCss(node, { solidBox: true, preview: ed.device });
```

(b) Above the return, add:
```tsx
  const adv = (node.advanced ?? {}) as Record<string, unknown>;
  const hiddenHere =
    (ed.device === "base" && Boolean(adv.hideDesktop)) ||
    (ed.device === "tablet" && Boolean(adv.hideTablet)) ||
    (ed.device === "mobile" && Boolean(adv.hideMobile));
  const deviceLabel = ed.device === "base" ? "Desktop" : ed.device === "tablet" ? "Tablet" : "Mobile";
```

(c) Append to the wrapper's className template: `${hiddenHere ? " opacity-40" : ""}`.

(d) Inside the wrapper (right after the `<style>` emission), add the badge:
```tsx
      {hiddenHere && (
        <span className="pointer-events-none absolute left-2 bottom-2 z-30 rounded bg-[#17191c] px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-[var(--gold-media)]">
          Hidden on {deviceLabel}
        </span>
      )}
```

- [ ] **Step 4: StyleRenderer — device-aware controls + override dot**

(a) Imports:
```tsx
import type { Breakpoint, Responsive } from "@/lib/nodes/types";
import { resolveAt, writeSlot, clearSlot, hasSlot } from "@/lib/nodes/responsive";
```

(b) Signature:
```tsx
export default function StyleRenderer({ controls, data, onChange, device = "base" }: { controls: StyleControl[]; data: Json; onChange: (path: Path, value: unknown) => void; device?: Breakpoint }) {
```

(c) Replace the value lookup block (currently `const path: Path = c.key.split("."); const val = getAt(data, path);`) with:

```tsx
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
```

(d) Update the four responsive cases to use `val`/`write` and wrap:
```tsx
      case "color":
        return wrap(<ColorControl key={key} label={c.label} value={String(val ?? "")} onChange={(v) => write(v)} />);
      case "dimension":
        return wrap(<DimensionControl key={key} label={c.label} value={(val as BoxValue) ?? undefined} onChange={(v) => write(v)} />);
      case "slider":
        return wrap(<SliderControl key={key} label={c.label} min={c.min} max={c.max} step={c.step} unit={c.unit} value={typeof val === "number" ? val : undefined} onChange={(v) => write(v)} />);
      case "buttongroup":
        return wrap(<ButtonGroupControl key={key} label={c.label} options={c.options} value={String(val ?? "")} onChange={(v) => write(v)} />);
```
(`text`/`textarea`/`toggle` cases keep using `raw` via the old `val` semantics — rename their reads to `raw` where needed so behavior is unchanged.)

- [ ] **Step 5: pageBlocks — stackOnMobile**

In the `container` entry of `BLOCK_TYPES`: append `tog("stackOnMobile", "Stack on mobile")` to `fields`, and add `stackOnMobile: true` to `defaults`.

- [ ] **Step 6: Gate + commit**

Run: `cd web && npx tsc --noEmit && npx vitest run && npx eslint src/components/admin/PageBuilder.tsx src/components/admin/EditableNode.tsx src/components/admin/StyleRenderer.tsx src/components/admin/editorContext.ts src/lib/pageBlocks.ts`
Expected: tsc silent; suite green; eslint clean on all five files.

```bash
git add web/src/components/admin/editorContext.ts web/src/components/admin/PageBuilder.tsx web/src/components/admin/EditableNode.tsx web/src/components/admin/StyleRenderer.tsx web/src/lib/pageBlocks.ts
git commit -m "feat(editor): device toggle with resolved preview, per-device controls, stackOnMobile

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Whole-feature verification + cleanup (controller-run)

- [ ] **Step 1: Full gate** — `cd web && npx tsc --noEmit && npm run lint && npx vitest run` (no NEW lint errors; all tests green).
- [ ] **Step 2: Browser pass** (temp unauth `web/src/app/dev-editor/page.tsx` mounting PageBuilder with a row container [`stackOnMobile: true`] + heading/text children and a top-level text block; clean `.next` restart; fresh tab):
  1. Device toggle: canvas narrows at Tablet/Mobile; Desktop restores.
  2. Select the text block → Style → set font-size 20 at Desktop; switch Mobile → set 14 → override dot appears; canvas heading computed font-size = 14px at Mobile, 20px at Desktop.
  3. Clear the Mobile override (×) → value collapses back to scalar 20 (inspect the saved shape via the sidebar re-read).
  4. Container: at Mobile preview the row renders stacked (computed `flex-direction: column`); Desktop stays row.
  5. Set mobile-only padding on the text block → Desktop preview shows no padding; Mobile preview shows it. (The public `display:contents`/`display:revert` emission is locked by Task 2's unit tests; the published-page check happens in the client spot-check since save is login-gated.)
  6. Hide on mobile + Mobile preview → node dims with a "Hidden on Mobile" badge (not removed).
  7. Regression: drag-insert into the container, reorder, cross-container move all still work at Desktop.
- [ ] **Step 3: Delete the temp route**; `git status` clean (only the pre-existing untracked font dir).
- [ ] **Step 4: Ledger + handoff notes** (controller).

## Notes / limitations

- Preview is resolved-flat: author media queries inside Custom CSS won't activate in the narrow canvas (published page is the truth).
- Existing saved containers (pre-`stackOnMobile`) behave as `stackOnMobile: false` until edited — acceptable.
- `hover.*` and text/textarea/toggle controls stay base-only by design.
- Deferred: per-breakpoint container direction/gap/align beyond stacking; iframe canvas; editable breakpoints.
