# Live Editor Core — A1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat block array with a recursive node tree, a universal `style`/`advanced` → CSS engine, a recursive renderer, and recursive server validation — the foundation the tabbed inspector (A2), left panel + nesting (A3), and chrome (A4) build on.

**Architecture:** `Page.blocks` (a JSON column) becomes a recursive `Node[]`. Each node keeps its existing `props` (Content) and gains optional `style`, `advanced`, and `children`. A pure function turns a node's `style`/`advanced` into CSS scoped to `.n-{id}`, emitted as a per-node `<style>` inside a wrapper the renderer adds **only when the node actually has styling or children** — so untouched pages render byte-identically. The single `BlockRenderer` (used by both the public route and the admin canvas) becomes recursive. `savePage` validation becomes a recursive walk with depth/count/size caps.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, zod v4, Prisma 6 + MySQL. Tests: Vitest (added in Task 0).

## Global Constraints

- **Next 16 is not the Next you know** — per `web/AGENTS.md`, read the relevant guide in `web/node_modules/next/dist/docs/` before using any unfamiliar Next API. (A1 touches only server components reading the DB and one client component — no novel Next APIs.)
- **Prisma stays at 6** — do not bump to 7. `Page.blocks` is a `Json` column: **no DB migration** in A1.
- **MySQL must be running** for dev and build: `cd web && npm run db:start` (project-local instance on `127.0.0.1:3307`).
- **Backward compatibility is mandatory:** a node with no `style`/`advanced`/`children` MUST render with no wrapper element and no `<style>` — byte-identical to today's output.
- **Breakpoints:** `base` (desktop, no media query), `tablet` (`max-width:1024px`), `mobile` (`max-width:767px`).
- **One renderer** serves public + admin — never fork it.
- **Path alias:** `@/*` → `web/src/*`. All commands run from `web/`.
- **New global CSS element rules go in `@layer base`** (an unlayered `a{}` rule previously beat Tailwind utilities). Not expected in A1, but honor it if adding any global CSS.

---

## File Structure

**Create:**
- `web/vitest.config.ts` — Vitest config (node env, `@` alias).
- `web/src/lib/nodes/types.ts` — `Node`, `PageTree`, `Responsive<T>`, `Breakpoint`.
- `web/src/lib/nodes/walk.ts` — `walkNodes`, `countNodes`, `treeDepth`.
- `web/src/lib/nodes/normalize.ts` — `normalizeNode`, `normalizeTree` (read-path migration).
- `web/src/lib/nodes/css.ts` — `resolveResponsive`, `styleToCss`, `nodeCss`, `wrapperAttrs`.
- `web/src/lib/nodes/validate.ts` — `validateTree` (recursive server validation).
- Test files colocated: `normalize.test.ts`, `walk.test.ts`, `css.test.ts`, `validate.test.ts`.

**Modify:**
- `web/package.json` — add `test` scripts + `vitest` dev dependency.
- `web/src/lib/pageBlocks.ts` — re-export `PageBlock` as an alias of `Node`.
- `web/src/components/blocks/BlockRenderer.tsx` — recursive `renderNode` + wrapper + per-node `<style>`.
- `web/src/lib/actions/pages.ts` — recursive zod schema + `validateTree`.
- `web/src/app/(site)/[slug]/page.tsx` — normalize blocks on read.
- `web/src/app/admin/(panel)/pages/block/[id]/page.tsx` — normalize blocks on read.

---

### Task 0: Vitest test infrastructure

**Files:**
- Modify: `web/package.json`
- Create: `web/vitest.config.ts`
- Create (temporary): `web/src/lib/nodes/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` command that runs `*.test.ts` under `web/src/` in a node environment with the `@` alias resolved. Later tasks rely on this.

- [ ] **Step 1: Install Vitest**

Run (from `web/`):
```bash
npm i -D vitest
```
Expected: `vitest` added to `devDependencies`; `node_modules/.bin/vitest` exists.

- [ ] **Step 2: Add the Vitest config**

Create `web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test scripts**

In `web/package.json`, add to `"scripts"` (alongside the existing entries):
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test**

Create `web/src/lib/nodes/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest wiring", () => {
  it("runs and resolves basic assertions", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it green**

Run: `npm test`
Expected: PASS — 1 test file, 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add web/package.json web/package-lock.json web/vitest.config.ts web/src/lib/nodes/smoke.test.ts
git commit -m "test: add Vitest (node env, @ alias) for live-editor foundation"
```

---

### Task 1: Node model, tree walkers, and read-path migration

**Files:**
- Create: `web/src/lib/nodes/types.ts`
- Create: `web/src/lib/nodes/walk.ts`
- Create: `web/src/lib/nodes/normalize.ts`
- Create: `web/src/lib/nodes/walk.test.ts`
- Create: `web/src/lib/nodes/normalize.test.ts`
- Delete: `web/src/lib/nodes/smoke.test.ts`
- Modify: `web/src/lib/pageBlocks.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Node = { id: string; type: string; props: Record<string, unknown>; style?: Record<string, unknown>; advanced?: Record<string, unknown>; children?: Node[] }`
  - `type PageTree = Node[]`
  - `type Responsive<T> = T | { base?: T; tablet?: T; mobile?: T }`
  - `type Breakpoint = "base" | "tablet" | "mobile"`
  - `walkNodes(tree: Node[], visit: (node: Node, depth: number) => void): void`
  - `countNodes(tree: Node[]): number`
  - `treeDepth(tree: Node[]): number`
  - `normalizeNode(raw: unknown): Node | null`
  - `normalizeTree(raw: unknown): Node[]`
  - `PageBlock` (from `@/lib/pageBlocks`) is now an alias of `Node`.

- [ ] **Step 1: Write the node types**

Create `web/src/lib/nodes/types.ts`:
```ts
/** Per-breakpoint value. A bare scalar applies at every width (via the base rule). */
export type Responsive<T> = T | { base?: T; tablet?: T; mobile?: T };

export type Breakpoint = "base" | "tablet" | "mobile";

/** A page is a recursive tree of these. `children` is present only on containers. */
export type Node = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  children?: Node[];
};

export type PageTree = Node[];
```

- [ ] **Step 2: Write the tree walkers**

Create `web/src/lib/nodes/walk.ts`:
```ts
import type { Node } from "./types";

export function walkNodes(
  tree: Node[],
  visit: (node: Node, depth: number) => void,
  depth = 1,
): void {
  for (const node of tree) {
    visit(node, depth);
    if (node.children?.length) walkNodes(node.children, visit, depth + 1);
  }
}

export function countNodes(tree: Node[]): number {
  let count = 0;
  walkNodes(tree, () => {
    count += 1;
  });
  return count;
}

export function treeDepth(tree: Node[]): number {
  const depthOf = (nodes: Node[]): number =>
    nodes.reduce(
      (max, n) => Math.max(max, 1 + (n.children?.length ? depthOf(n.children) : 0)),
      0,
    );
  return depthOf(tree);
}
```

- [ ] **Step 3: Write the normalizer**

Create `web/src/lib/nodes/normalize.ts`:
```ts
import type { Node } from "./types";

let seq = 0;
function genId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `n_${(seq++).toString(36)}_${Date.now().toString(36)}`
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Coerce one raw JSON value into a Node, or null if it isn't a usable block. */
export function normalizeNode(raw: unknown): Node | null {
  if (!isPlainObject(raw)) return null;
  const type = typeof raw.type === "string" ? raw.type : "";
  if (!type) return null;

  const id = typeof raw.id === "string" && raw.id ? raw.id : genId();
  const props = isPlainObject(raw.props) ? raw.props : {};
  const node: Node = { id, type, props };

  if (isPlainObject(raw.style)) node.style = raw.style;
  if (isPlainObject(raw.advanced)) node.advanced = raw.advanced;
  if (Array.isArray(raw.children)) {
    const kids = raw.children
      .map(normalizeNode)
      .filter((n): n is Node => n !== null);
    if (kids.length) node.children = kids;
  }
  return node;
}

/** Read-path migration: old flat blocks are already valid childless Nodes. */
export function normalizeTree(raw: unknown): Node[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeNode).filter((n): n is Node => n !== null);
}
```

- [ ] **Step 4: Write the failing tests**

Create `web/src/lib/nodes/normalize.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeNode, normalizeTree } from "./normalize";

describe("normalizeTree", () => {
  it("returns [] for non-arrays", () => {
    expect(normalizeTree(null)).toEqual([]);
    expect(normalizeTree({})).toEqual([]);
    expect(normalizeTree(undefined)).toEqual([]);
  });

  it("preserves an old flat block unchanged", () => {
    const old = [{ id: "a", type: "heading", props: { text: "Hi" } }];
    expect(normalizeTree(old)).toEqual([
      { id: "a", type: "heading", props: { text: "Hi" } },
    ]);
  });

  it("fills a missing id and defaults missing props to {}", () => {
    const [node] = normalizeTree([{ type: "text" }]);
    expect(node.type).toBe("text");
    expect(typeof node.id).toBe("string");
    expect(node.id.length).toBeGreaterThan(0);
    expect(node.props).toEqual({});
  });

  it("drops entries without a type", () => {
    expect(normalizeTree([{ id: "x", props: {} }, { type: "text", props: {} }]))
      .toHaveLength(1);
  });

  it("keeps style/advanced when objects, drops them otherwise", () => {
    const [a] = normalizeTree([{ type: "text", props: {}, style: { color: "#000" }, advanced: "nope" }]);
    expect(a.style).toEqual({ color: "#000" });
    expect(a.advanced).toBeUndefined();
  });

  it("normalizes children recursively and omits empty children arrays", () => {
    const [parent] = normalizeTree([
      { type: "container", props: {}, children: [{ type: "text", props: {} }, "junk"] },
    ]);
    expect(parent.children).toHaveLength(1);
    expect(parent.children?.[0].type).toBe("text");

    const [leaf] = normalizeTree([{ type: "text", props: {}, children: [] }]);
    expect(leaf.children).toBeUndefined();
  });

  it("normalizeNode returns null for junk", () => {
    expect(normalizeNode(42)).toBeNull();
    expect(normalizeNode({ id: "x" })).toBeNull();
  });
});
```

Create `web/src/lib/nodes/walk.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { walkNodes, countNodes, treeDepth } from "./walk";
import type { Node } from "./types";

const tree: Node[] = [
  {
    id: "1",
    type: "container",
    props: {},
    children: [
      { id: "1a", type: "text", props: {} },
      { id: "1b", type: "container", props: {}, children: [{ id: "1b1", type: "text", props: {} }] },
    ],
  },
  { id: "2", type: "text", props: {} },
];

describe("tree walkers", () => {
  it("visits every node depth-first with its depth", () => {
    const seen: Array<[string, number]> = [];
    walkNodes(tree, (n, d) => seen.push([n.id, d]));
    expect(seen).toEqual([
      ["1", 1], ["1a", 2], ["1b", 2], ["1b1", 3], ["2", 1],
    ]);
  });

  it("countNodes counts all nested nodes", () => {
    expect(countNodes(tree)).toBe(5);
  });

  it("treeDepth returns the deepest nesting level", () => {
    expect(treeDepth(tree)).toBe(3);
    expect(treeDepth([])).toBe(0);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `normalize.test.ts` and `walk.test.ts` cannot resolve their imports yet (the modules were created in Steps 1–3, so if all steps are done in order these PASS). If you are running strictly test-first, temporarily rename the `.ts` sources to force the failure, then restore. Otherwise proceed to Step 6.

- [ ] **Step 6: Delete the smoke test**

```bash
rm web/src/lib/nodes/smoke.test.ts
```

- [ ] **Step 7: Alias `PageBlock` to `Node`**

In `web/src/lib/pageBlocks.ts`, replace the existing type definition:
```ts
export type PageBlock = { id: string; type: string; props: Record<string, unknown> };
```
with a re-export of the canonical node type:
```ts
export type { Node as PageBlock, PageTree } from "@/lib/nodes/types";
```
(Leave everything else in the file unchanged — `BlockType`, `BLOCK_TYPES`, `blockTypeFor`, `RESERVED_SLUGS`.)

- [ ] **Step 8: Run tests + typecheck**

Run: `npm test`
Expected: PASS — all tests in `normalize.test.ts` and `walk.test.ts` green.

Run: `npx tsc --noEmit`
Expected: no errors (the wider `PageBlock` type is a superset; existing consumers still compile).

- [ ] **Step 9: Commit**

```bash
git add web/src/lib/nodes/types.ts web/src/lib/nodes/walk.ts web/src/lib/nodes/normalize.ts web/src/lib/nodes/walk.test.ts web/src/lib/nodes/normalize.test.ts web/src/lib/pageBlocks.ts
git rm web/src/lib/nodes/smoke.test.ts
git commit -m "feat: recursive Node model, tree walkers, and read-path migration"
```

---

### Task 2: Style/Advanced → CSS engine

**Files:**
- Create: `web/src/lib/nodes/css.ts`
- Create: `web/src/lib/nodes/css.test.ts`

**Interfaces:**
- Consumes: `Node`, `Responsive`, `Breakpoint` from `./types`.
- Produces:
  - `resolveResponsive<T>(v: Responsive<T> | undefined, bp: Breakpoint): T | undefined`
  - `styleToCss(style: Record<string, unknown>, advanced: Record<string, unknown>, bp: Breakpoint): string` — declarations for one breakpoint.
  - `nodeCss(node: Node): string` — full rules (`.n-{id}`, `:hover`, tablet/mobile media queries, responsive-hide, custom CSS with `selector` → `.n-{id}`). Empty string when the node has no styling.
  - `wrapperAttrs(node: Node): { className: string; id?: string }` — always includes `n-{id}`; appends `advanced.cssClasses`; sets `id` from `advanced.cssId`.

A1's `styleToCss` maps a representative universal core (padding, margin, background-color, color, text-align, min-height, max-width, border-radius, z-index) plus the mechanisms (responsive, hover, hide, custom CSS). **A2 extends the property coverage** (typography, borders, background image/gradient, shadow, position) by adding cases here as it adds the matching controls — the mechanism does not change.

- [ ] **Step 1: Write the CSS engine**

Create `web/src/lib/nodes/css.ts`:
```ts
import type { Node, Responsive, Breakpoint } from "./types";

/** Pick the value for a breakpoint. A scalar applies only at base (the base rule cascades down). */
export function resolveResponsive<T>(
  v: Responsive<T> | undefined,
  bp: Breakpoint,
): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object" && ("base" in v || "tablet" in v || "mobile" in v)) {
    return (v as { base?: T; tablet?: T; mobile?: T })[bp];
  }
  return bp === "base" ? (v as T) : undefined;
}

function decl(prop: string, val: string | number | undefined): string {
  return val === undefined || val === "" ? "" : `${prop}:${val};`;
}

function lenOf(v: unknown): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  return typeof v === "number" ? `${v}px` : String(v);
}

/** A 4-side box: { top, right, bottom, left, unit? }. */
function boxCss(prop: "padding" | "margin", box: unknown): string {
  if (!box || typeof box !== "object") return "";
  const b = box as Record<string, unknown>;
  if (b.top === undefined && b.right === undefined && b.bottom === undefined && b.left === undefined) {
    return "";
  }
  const u = typeof b.unit === "string" ? b.unit : "px";
  const side = (v: unknown) => (v === undefined || v === null || v === "" ? "0" : `${Number(v)}${u}`);
  return `${prop}:${side(b.top)} ${side(b.right)} ${side(b.bottom)} ${side(b.left)};`;
}

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
  css += decl("min-height", lenOf(r(style.minHeight)));
  css += decl("max-width", lenOf(r(style.maxWidth)));
  css += decl("border-radius", lenOf(r(style.borderRadius)));
  const z = r<number>(advanced.zIndex);
  css += decl("z-index", typeof z === "number" ? z : undefined);
  return css;
}

function transitionOf(style: Record<string, unknown>): string {
  return typeof style.transition === "string" && style.transition ? String(style.transition) : "0.3s ease";
}

function hoverToCss(style: Record<string, unknown>): string {
  const h = style.hover;
  if (!h || typeof h !== "object") return "";
  const hb = h as Record<string, unknown>;
  let css = "";
  css += decl("background-color", typeof hb.backgroundColor === "string" ? hb.backgroundColor : undefined);
  css += decl("color", typeof hb.color === "string" ? hb.color : undefined);
  return css;
}

function hideCss(sel: string, advanced: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (advanced.hideDesktop) out.push(`@media (min-width:1025px){${sel}{display:none!important;}}`);
  if (advanced.hideTablet) out.push(`@media (min-width:768px) and (max-width:1024px){${sel}{display:none!important;}}`);
  if (advanced.hideMobile) out.push(`@media (max-width:767px){${sel}{display:none!important;}}`);
  return out;
}

/** Full stylesheet fragment for one node, scoped to `.n-{id}`. Empty if nothing to style. */
export function nodeCss(node: Node): string {
  const sel = `.n-${node.id}`;
  const style = (node.style ?? {}) as Record<string, unknown>;
  const advanced = (node.advanced ?? {}) as Record<string, unknown>;
  const parts: string[] = [];

  const base = styleToCss(style, advanced, "base");
  const hover = hoverToCss(style);
  const baseRule = hover ? `transition:all ${transitionOf(style)};${base}` : base;
  if (baseRule) parts.push(`${sel}{${baseRule}}`);
  if (hover) parts.push(`${sel}:hover{${hover}}`);

  const tablet = styleToCss(style, advanced, "tablet");
  if (tablet) parts.push(`@media (max-width:1024px){${sel}{${tablet}}}`);
  const mobile = styleToCss(style, advanced, "mobile");
  if (mobile) parts.push(`@media (max-width:767px){${sel}{${mobile}}}`);

  parts.push(...hideCss(sel, advanced));

  const custom = typeof advanced.customCss === "string" ? advanced.customCss.trim() : "";
  if (custom) parts.push(custom.replace(/selector/g, sel));

  return parts.join("");
}

export function wrapperAttrs(node: Node): { className: string; id?: string } {
  const classes = [`n-${node.id}`];
  const adv = (node.advanced ?? {}) as Record<string, unknown>;
  if (typeof adv.cssClasses === "string" && adv.cssClasses.trim()) classes.push(adv.cssClasses.trim());
  const id = typeof adv.cssId === "string" && adv.cssId.trim() ? adv.cssId.trim() : undefined;
  return { className: classes.join(" "), id };
}
```

- [ ] **Step 2: Write the failing tests**

Create `web/src/lib/nodes/css.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { resolveResponsive, styleToCss, nodeCss, wrapperAttrs } from "./css";
import type { Node } from "./types";

describe("resolveResponsive", () => {
  it("applies a scalar only at base", () => {
    expect(resolveResponsive(10, "base")).toBe(10);
    expect(resolveResponsive(10, "tablet")).toBeUndefined();
    expect(resolveResponsive(10, "mobile")).toBeUndefined();
  });
  it("reads per-breakpoint from an object (no cascade)", () => {
    const v = { base: 10, mobile: 4 };
    expect(resolveResponsive(v, "base")).toBe(10);
    expect(resolveResponsive(v, "tablet")).toBeUndefined();
    expect(resolveResponsive(v, "mobile")).toBe(4);
  });
});

describe("styleToCss", () => {
  it("emits base declarations", () => {
    const css = styleToCss({ backgroundColor: "#a87f3f", color: "#fff" }, {}, "base");
    expect(css).toContain("background-color:#a87f3f;");
    expect(css).toContain("color:#fff;");
  });
  it("emits a 4-side padding box with units", () => {
    const css = styleToCss({}, { padding: { top: 10, right: 20, bottom: 10, left: 20, unit: "px" } }, "base");
    expect(css).toContain("padding:10px 20px 10px 20px;");
  });
  it("emits only mobile overrides at the mobile breakpoint", () => {
    const css = styleToCss({ maxWidth: { base: 1200, mobile: 320 } }, {}, "mobile");
    expect(css).toBe("max-width:320px;");
  });
});

describe("nodeCss", () => {
  const base = (over: Partial<Node>): Node => ({ id: "abc", type: "heading", props: {}, ...over });

  it("returns empty string for a bare node", () => {
    expect(nodeCss(base({}))).toBe("");
  });
  it("scopes rules to .n-{id} and wraps responsive values in media queries", () => {
    const css = nodeCss(base({ style: { maxWidth: { base: 1200, mobile: 320 } } }));
    expect(css).toContain(".n-abc{max-width:1200px;}");
    expect(css).toContain("@media (max-width:767px){.n-abc{max-width:320px;}}");
  });
  it("emits a :hover rule and a transition on the base rule", () => {
    const css = nodeCss(base({ style: { color: "#111", hover: { color: "#a87f3f" } } }));
    expect(css).toContain(".n-abc:hover{color:#a87f3f;}");
    expect(css).toContain("transition:all 0.3s ease;");
  });
  it("emits responsive-hide rules", () => {
    const css = nodeCss(base({ advanced: { hideMobile: true } }));
    expect(css).toContain("@media (max-width:767px){.n-abc{display:none!important;}}");
  });
  it("substitutes `selector` in custom CSS", () => {
    const css = nodeCss(base({ advanced: { customCss: "selector { opacity: 0.5; }" } }));
    expect(css).toContain(".n-abc { opacity: 0.5; }");
  });
});

describe("wrapperAttrs", () => {
  it("always includes the scoped class", () => {
    expect(wrapperAttrs({ id: "abc", type: "x", props: {} })).toEqual({ className: "n-abc", id: undefined });
  });
  it("appends cssClasses and sets cssId", () => {
    const attrs = wrapperAttrs({ id: "abc", type: "x", props: {}, advanced: { cssClasses: "fancy big", cssId: "hero" } });
    expect(attrs.className).toBe("n-abc fancy big");
    expect(attrs.id).toBe("hero");
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `css.test.ts` cases green (plus Task 1 tests still green).

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/nodes/css.ts web/src/lib/nodes/css.test.ts
git commit -m "feat: style/advanced -> scoped CSS engine (responsive, hover, hide, custom CSS)"
```

---

### Task 3: Recursive renderer

**Files:**
- Modify: `web/src/components/blocks/BlockRenderer.tsx` (imports at top; `renderNode` + default export replacing lines ~406–425)

**Interfaces:**
- Consumes: `nodeCss`, `wrapperAttrs` from `@/lib/nodes/css`; `PageBlock` (= `Node`) from `@/lib/pageBlocks`; existing `Block`, `BlockCtx`, `Edit` in the file.
- Produces: `BlockRenderer` renders a `Node[]` recursively; each node gets a wrapper `<div class="n-{id}">` with a per-node `<style>` **only** when it has styling or children; otherwise it renders bare (byte-identical to today).

- [ ] **Step 1: Update the React import**

In `web/src/components/blocks/BlockRenderer.tsx`, change the first React import (line 3):
```ts
import { createElement, useState } from "react";
```
to:
```ts
import { createElement, useState, Fragment, type ReactNode } from "react";
```

- [ ] **Step 2: Import the CSS engine**

Immediately after the existing `import type { PageBlock } from "@/lib/pageBlocks";` line (line 9), add:
```ts
import { nodeCss, wrapperAttrs } from "@/lib/nodes/css";
```

- [ ] **Step 3: Replace the default export with a recursive renderer**

Replace the entire current default export block (from `export default function BlockRenderer({` through its closing `}` — lines ~406–425) with:
```tsx
function renderNode(
  node: PageBlock,
  ctx: BlockCtx,
  edit: ((blockId: string, path: (string | number)[], value: string) => void) | undefined,
): ReactNode {
  const editForNode: Edit = edit ? (path, value) => edit(node.id, path, value) : undefined;
  const inner = <Block block={node} ctx={ctx} edit={editForNode} />;
  const kids = node.children?.length ? node.children.map((c) => renderNode(c, ctx, edit)) : null;
  const css = nodeCss(node);
  const hasWrap = Boolean(css || kids || node.style || node.advanced);

  if (!hasWrap) return <Fragment key={node.id}>{inner}</Fragment>;

  const { className, id } = wrapperAttrs(node);
  return (
    <div key={node.id} className={className} id={id} data-node={node.id}>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {inner}
      {kids}
    </div>
  );
}

export default function BlockRenderer({
  blocks,
  ctx,
  edit,
}: {
  blocks: PageBlock[];
  ctx: BlockCtx;
  /** Editor only: (blockId, path, value) commits an inline text edit. */
  edit?: (blockId: string, path: (string | number)[], value: string) => void;
}) {
  return (
    <>
      {blocks.map((b) => renderNode(b, ctx, edit))}
      {/* bottom rhythm so the last block breathes before the footer */}
      <div className="pb-[clamp(4rem,9vw,8rem)]" aria-hidden="true" />
    </>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify in the browser (byte-identical for untouched pages)**

Ensure MySQL is up (`npm run db:start`), then start the dev server via the preview tool (`.claude/launch.json` "web" config, or create it: `npm run dev`, port 3000).
- Load an existing published page (e.g. `/` or any page under `/admin/pages`). It must look **exactly** as before (no stray wrappers, no layout shift).
- Open that page in the admin editor (`/admin/pages` → open one). The canvas must render and inline text editing must still work.
- Check the console/logs for hydration warnings — expected: none.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/blocks/BlockRenderer.tsx
git commit -m "feat: recursive node renderer with scoped per-node style wrappers"
```

---

### Task 4: Recursive server validation

**Files:**
- Create: `web/src/lib/nodes/validate.ts`
- Create: `web/src/lib/nodes/validate.test.ts`
- Modify: `web/src/lib/actions/pages.ts`

**Interfaces:**
- Consumes: `blockTypeFor` from `@/lib/pageBlocks`; `validateFields`, `ValidationError` from `@/lib/validateFields`.
- Produces: `validateTree(nodes: RawNode[]): RawNode[]` — recursively validates each node's `props` against its block type, sanitizes `style`/`advanced` (rejecting > 20 KB), recurses `children`, and enforces `MAX_DEPTH = 6` / `MAX_NODES = 300`. `savePage` calls it instead of the old flat `.map`.

- [ ] **Step 1: Write the validator**

Create `web/src/lib/nodes/validate.ts`:
```ts
import { blockTypeFor } from "@/lib/pageBlocks";
import { validateFields, ValidationError } from "@/lib/validateFields";

export type RawNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  children?: RawNode[];
};

const MAX_DEPTH = 6;
const MAX_NODES = 300;
const MAX_BAG_BYTES = 20_000;

function sanitizeBag(bag: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!bag) return undefined;
  const json = JSON.stringify(bag);
  if (json.length > MAX_BAG_BYTES) {
    throw new ValidationError("A block's style/advanced settings are too large.");
  }
  return JSON.parse(json) as Record<string, unknown>;
}

/** Validate + sanitize a node tree for persistence. Throws ValidationError on any problem. */
export function validateTree(nodes: RawNode[]): RawNode[] {
  let count = 0;
  const visit = (list: RawNode[], depth: number): RawNode[] => {
    if (depth > MAX_DEPTH) {
      throw new ValidationError(`Blocks are nested too deep (max ${MAX_DEPTH} levels).`);
    }
    return list.map((b) => {
      count += 1;
      if (count > MAX_NODES) {
        throw new ValidationError(`Too many blocks on the page (max ${MAX_NODES}).`);
      }
      const type = blockTypeFor(b.type);
      if (!type) throw new ValidationError(`Unknown block type "${b.type}".`);

      const out: RawNode = {
        id: b.id,
        type: b.type,
        props: validateFields(type.fields, b.props, type.defaults),
      };
      const style = sanitizeBag(b.style);
      if (style) out.style = style;
      const advanced = sanitizeBag(b.advanced);
      if (advanced) out.advanced = advanced;
      if (b.children) out.children = visit(b.children, depth + 1);
      return out;
    });
  };
  return visit(nodes, 1);
}
```

- [ ] **Step 2: Write the failing tests**

Create `web/src/lib/nodes/validate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateTree, type RawNode } from "./validate";
import { ValidationError } from "@/lib/validateFields";

const heading = (over: Partial<RawNode> = {}): RawNode => ({
  id: "h1",
  type: "heading",
  props: { text: "Hello", level: 2, align: "left" },
  ...over,
});

describe("validateTree", () => {
  it("validates props and preserves style/advanced", () => {
    const [out] = validateTree([heading({ style: { color: "#111" }, advanced: { zIndex: 3 } })]);
    expect(out.type).toBe("heading");
    expect(out.props.text).toBe("Hello");
    expect(out.style).toEqual({ color: "#111" });
    expect(out.advanced).toEqual({ zIndex: 3 });
  });

  it("recurses children", () => {
    const [out] = validateTree([heading({ children: [heading({ id: "h2" })] })]);
    expect(out.children).toHaveLength(1);
    expect(out.children?.[0].id).toBe("h2");
  });

  it("throws on an unknown block type", () => {
    expect(() => validateTree([{ id: "x", type: "no-such", props: {} }])).toThrow(ValidationError);
  });

  it("throws when nested too deep (> 6)", () => {
    let node: RawNode = heading();
    for (let i = 0; i < 6; i += 1) node = heading({ children: [node] }); // depth 7
    expect(() => validateTree([node])).toThrow(/nested too deep/);
  });

  it("throws when there are too many nodes (> 300)", () => {
    const many = Array.from({ length: 301 }, (_, i) => heading({ id: `h${i}` }));
    expect(() => validateTree(many)).toThrow(/Too many blocks/);
  });

  it("throws when style/advanced is too large", () => {
    const big = { blob: "x".repeat(20_001) };
    expect(() => validateTree([heading({ style: big })])).toThrow(/too large/);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `validate.test.ts` cases green.

- [ ] **Step 4: Make the zod schema recursive**

In `web/src/lib/actions/pages.ts`, replace the `blocks` field of `pageSchema` (lines ~25–33):
```ts
  blocks: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        type: z.string().min(1).max(40),
        props: z.record(z.string(), z.unknown()),
      }),
    )
    .max(60),
```
with a recursive node schema. Add this above `const pageSchema = z.object({` :
```ts
type RawNodeShape = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  children?: RawNodeShape[];
};

const nodeSchema: z.ZodType<RawNodeShape> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(40),
    type: z.string().min(1).max(40),
    props: z.record(z.string(), z.unknown()),
    style: z.record(z.string(), z.unknown()).optional(),
    advanced: z.record(z.string(), z.unknown()).optional(),
    children: z.array(nodeSchema).optional(),
  }),
);
```
and set the field to:
```ts
  blocks: z.array(nodeSchema).max(120),
```

- [ ] **Step 5: Call `validateTree` in `savePage`**

Add the import near the other `@/lib` imports at the top of `pages.ts`:
```ts
import { validateTree } from "@/lib/nodes/validate";
```
Then replace the existing block-mapping (lines ~50–54):
```ts
    const blocks = page.blocks.map((b) => {
      const type = blockTypeFor(b.type);
      if (!type) throw new ValidationError(`Unknown block type "${b.type}".`);
      return { id: b.id, type: b.type, props: validateFields(type.fields, b.props, type.defaults) };
    });
```
with:
```ts
    const blocks = validateTree(page.blocks);
```
Remove the now-unused imports `blockTypeFor`, `validateFields` from `pages.ts` **only if** nothing else in the file uses them (`ValidationError` is still used by the `catch` block — keep it).

- [ ] **Step 6: Run tests + typecheck**

Run: `npm test`
Expected: PASS (all suites).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Verify a real save round-trips**

With the dev server + MySQL running: open a page in the admin editor, edit an inline text, click Save/Publish. Expected: saves without error; reload shows the change; the public page renders it.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/nodes/validate.ts web/src/lib/nodes/validate.test.ts web/src/lib/actions/pages.ts
git commit -m "feat: recursive server-side node validation with depth/count/size caps"
```

---

### Task 5: Normalize on the read paths

**Files:**
- Modify: `web/src/app/(site)/[slug]/page.tsx`
- Modify: `web/src/app/admin/(panel)/pages/block/[id]/page.tsx`

**Interfaces:**
- Consumes: `normalizeTree` from `@/lib/nodes/normalize`.
- Produces: both the public page route and the admin editor loader pass a normalized `Node[]` (stable ids, coerced shapes) into `BlockRenderer` / `PageBuilder`.

- [ ] **Step 1: Normalize on the public route**

In `web/src/app/(site)/[slug]/page.tsx`, add the import:
```ts
import { normalizeTree } from "@/lib/nodes/normalize";
```
Replace:
```ts
  const blocks = (Array.isArray(page.blocks) ? page.blocks : []) as PageBlock[];
```
with:
```ts
  const blocks = normalizeTree(page.blocks);
```
(You may remove the now-unused `import type { PageBlock }` if TypeScript flags it.)

- [ ] **Step 2: Normalize on the admin editor loader**

In `web/src/app/admin/(panel)/pages/block/[id]/page.tsx`, add the import:
```ts
import { normalizeTree } from "@/lib/nodes/normalize";
```
Replace the `blocks:` line inside the `initial` prop:
```ts
        blocks: (Array.isArray(page.blocks) ? page.blocks : []) as PageBlock[],
```
with:
```ts
        blocks: normalizeTree(page.blocks),
```
(Remove the now-unused `import type { PageBlock }` if TypeScript flags it.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify both paths**

With dev server + MySQL: load a public page (renders correctly) and open the same page in the admin editor (loads + edits + saves). Expected: identical behavior to before, now backed by the normalized tree.

- [ ] **Step 5: Full check + commit**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS, no type errors.

```bash
git add "web/src/app/(site)/[slug]/page.tsx" "web/src/app/admin/(panel)/pages/block/[id]/page.tsx"
git commit -m "feat: normalize page blocks into the node tree on public and admin read paths"
```

---

## Self-Review

**1. Spec coverage (A1 slice of the spec):**
- Node model (spec §4) → Task 1. ✅
- `normalizeTree` migration (spec §10) → Task 1 + Task 5. ✅
- Style/Advanced CSS engine (spec §5) → Task 2 (mechanism + core properties; A2 extends coverage — documented, not a placeholder). ✅
- Recursive renderer, single renderer preserved (spec §9) → Task 3. ✅
- Recursive server validation with caps (spec §9) → Task 4. ✅
- Backward compatibility / byte-identical untouched pages (spec §10) → Task 3 `hasWrap` guard + Task 3 Step 5 verification. ✅
- Testing of pure logic (spec §11) → Tasks 1, 2, 4 unit tests. ✅
- *Deferred by design:* inspector/tabs/controls (A2), left panel + container/column node types + navigator + recursive edit ops (A3), device/undo/redo chrome (A4). Not in this plan — correct.

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". The one scope note (A2 extends `styleToCss` property coverage) describes a concrete, tested slice with a named extension point — not a gap.

**3. Type consistency:** `Node`/`PageBlock` (alias) carry `style?`/`advanced?`/`children?` used identically in css.ts, BlockRenderer, and validate.ts. `RawNode` (validate.ts) and `RawNodeShape` (pages.ts zod) have matching field sets. `resolveResponsive`/`styleToCss`/`nodeCss`/`wrapperAttrs` signatures match their call sites. Breakpoint strings (`base`/`tablet`/`mobile`) and media widths (1024/767) are consistent across css.ts and the spec.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-19-live-editor-core-a1-foundation.md`.
