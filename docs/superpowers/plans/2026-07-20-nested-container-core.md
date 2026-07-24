# Nested Container Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flexible flexbox **Container** block that holds arbitrary child blocks, and make the page editor operate recursively (select / edit / inline-edit / duplicate / remove / move / drop at any depth).

**Architecture:** A pure, unit-tested `lib/nodes/tree.ts` provides immutable tree operations; `PageBuilder`'s mutations route through them so they're depth-agnostic. A shared wrapper helper keeps the editor's WYSIWYG byte-identical to the public `BlockRenderer`. A recursive `EditableNode` component renders chrome + content + (for containers) a child drop zone. Recursive DnD resolves every drop to an explicit `{parentId, index, pos}` target.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · Vitest.

**Spec:** [`docs/superpowers/specs/2026-07-20-nested-container-core-design.md`](../specs/2026-07-20-nested-container-core-design.md)

## Global Constraints

- **Branch:** `feature/admin-v1-client-ready`. Do not create a new branch.
- **Working dir for `npm`/`npx`:** `web/`. Git runs from repo root `D:/Studiodota.net`.
- **Next.js 16 is not the Next.js you know** (`web/AGENTS.md`): read the relevant guide in `web/node_modules/next/dist/docs/` before writing Next-specific code. *All tasks here are client React + pure TS; no Next APIs touched.*
- **Public render byte-identical:** the public (`edit`-less) `BlockRenderer` output for every EXISTING node must be unchanged. The only new render branch triggers for `type === "container"`, of which no existing node exists.
- **`needsBox` already returns `true` when `children.length`** — containers get a real box with no engine change. Do not modify `css.ts`.
- **Depth cap is 6** (`validateTree` in `lib/nodes/validate.ts`); the editor also refuses drops that would exceed it.
- **No React component-test harness exists** (Vitest is node-env): UI tasks (3, 5, 6) are verified by `npx tsc --noEmit` + `npm run lint` (no NEW errors) + an in-browser pass on a **temporary unauthenticated dev route** (the agent cannot log in — password entry is prohibited). Pure-logic tasks (1, 4-validator) are unit-tested.
- **Node shape:** `Node = { id: string; type: string; props: Record<string,unknown>; style?: Record<string,unknown>; advanced?: Record<string,unknown>; children?: Node[] }`.
- **Commit messages** end with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

- Create `web/src/lib/nodes/tree.ts` — immutable tree ops (Task 1).
- Create `web/src/lib/nodes/tree.test.ts` — Vitest (Task 1).
- Modify `web/src/components/admin/PageBuilder.tsx` — route mutations through tree ops (Task 2), render via `EditableNode` (Task 5), recursive DnD state (Task 6).
- Modify `web/src/components/blocks/BlockRenderer.tsx` — extract shared wrapper style helper + export `Block`, add container flex + `case "container"` (Task 3/4).
- Modify `web/src/lib/pageRegistry.ts`, `web/src/lib/validateFields.ts`, `web/src/components/admin/FieldsRenderer.tsx` — add the `select` field kind (Task 4).
- Modify `web/src/lib/pageBlocks.ts` — register the `container` block (Task 4).
- Modify `web/src/components/admin/ElementsPanel.tsx` — container already in the "Layout" category list; ensure it appears (Task 4).
- Create `web/src/components/admin/EditableNode.tsx` + `web/src/components/admin/editorContext.ts` — recursive editable canvas (Task 5), drag wiring (Task 6).

---

## Task 1: Pure tree helpers (`tree.ts`)

**Files:**
- Create: `web/src/lib/nodes/tree.ts`
- Test: `web/src/lib/nodes/tree.test.ts`

**Interfaces — Produces:**
- `findNode(tree: Node[], id: string): Node | null`
- `findParent(tree: Node[], id: string): { parent: Node | null; index: number } | null` (parent `null` = top level)
- `updateNode(tree: Node[], id: string, fn: (n: Node) => Node): Node[]`
- `updateSiblings(tree: Node[], parentId: string | null, fn: (sibs: Node[]) => Node[]): Node[]`
- `removeNode(tree: Node[], id: string): Node[]`
- `insertNode(tree: Node[], target: { parentId: string | null; index: number }, node: Node): Node[]`
- `moveNode(tree: Node[], id: string, target: { parentId: string | null; index: number }): Node[]` (`target.index` = insert index in the target parent's CURRENT children, i.e. as-if the moved node were not yet removed)
- `duplicateNode(tree: Node[], id: string): { tree: Node[]; newId: string }`
- `isDescendant(tree: Node[], ancestorId: string, maybeId: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `web/src/lib/nodes/tree.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { findNode, findParent, updateNode, updateSiblings, removeNode, insertNode, moveNode, duplicateNode, isDescendant } from "./tree";
import type { Node } from "./types";

const n = (id: string, children?: Node[]): Node => ({ id, type: children ? "container" : "text", props: {}, ...(children ? { children } : {}) });
// Tree: A[ B, C[ D, E ] ], F
const tree = (): Node[] => [n("A", [n("B"), n("C", [n("D"), n("E")])]), n("F")];

describe("findNode / findParent", () => {
  it("finds nested nodes", () => {
    expect(findNode(tree(), "E")?.id).toBe("E");
    expect(findNode(tree(), "zzz")).toBeNull();
  });
  it("finds parent + index (null parent for top level)", () => {
    expect(findParent(tree(), "F")).toEqual({ parent: null, index: 1 });
    const p = findParent(tree(), "E");
    expect(p?.parent?.id).toBe("C");
    expect(p?.index).toBe(1);
  });
});

describe("updateNode", () => {
  it("updates a nested node immutably", () => {
    const out = updateNode(tree(), "D", (node) => ({ ...node, props: { x: 1 } }));
    expect(findNode(out, "D")?.props).toEqual({ x: 1 });
    expect(findNode(out, "E")?.props).toEqual({});
  });
});

describe("updateSiblings", () => {
  it("transforms top-level siblings when parentId is null", () => {
    const out = updateSiblings(tree(), null, (sibs) => sibs.slice().reverse());
    expect(out.map((x) => x.id)).toEqual(["F", "A"]);
  });
  it("transforms a container's children", () => {
    const out = updateSiblings(tree(), "C", (sibs) => sibs.slice().reverse());
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["E", "D"]);
  });
});

describe("removeNode", () => {
  it("removes a nested node", () => {
    const out = removeNode(tree(), "D");
    expect(findNode(out, "D")).toBeNull();
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["E"]);
  });
});

describe("insertNode", () => {
  it("inserts at top level", () => {
    const out = insertNode(tree(), { parentId: null, index: 1 }, n("X"));
    expect(out.map((x) => x.id)).toEqual(["A", "X", "F"]);
  });
  it("inserts into a container", () => {
    const out = insertNode(tree(), { parentId: "C", index: 1 }, n("X"));
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["D", "X", "E"]);
  });
  it("clamps an out-of-range index", () => {
    const out = insertNode(tree(), { parentId: "C", index: 99 }, n("X"));
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["D", "E", "X"]);
  });
});

describe("moveNode", () => {
  it("reorders down within the same parent", () => {
    // move B to after C (top-of-A children): as-if-not-removed index 2
    const out = moveNode(tree(), "B", { parentId: "A", index: 2 });
    expect(findNode(out, "A")?.children?.map((x) => x.id)).toEqual(["C", "B"]);
  });
  it("moves across parents", () => {
    const out = moveNode(tree(), "F", { parentId: "C", index: 0 });
    expect(out.map((x) => x.id)).toEqual(["A"]);
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["F", "D", "E"]);
  });
  it("no-ops moving into itself or a descendant", () => {
    expect(moveNode(tree(), "C", { parentId: "C", index: 0 })).toEqual(tree());
    expect(moveNode(tree(), "C", { parentId: "D", index: 0 })).toEqual(tree());
  });
});

describe("duplicateNode", () => {
  it("clones after the source with fresh, unique ids across the whole subtree", () => {
    const { tree: out, newId } = duplicateNode(tree(), "C");
    const kids = findNode(out, "A")?.children?.map((x) => x.id) ?? [];
    expect(kids[0]).toBe("B");
    expect(kids[1]).toBe("C");
    expect(kids[2]).toBe(newId);      // the clone, inserted after C
    // collect all ids; assert no duplicates
    const all: string[] = [];
    const walk = (list: Node[]) => list.forEach((x) => { all.push(x.id); if (x.children) walk(x.children); });
    walk(out);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("isDescendant", () => {
  it("detects descendants", () => {
    expect(isDescendant(tree(), "C", "E")).toBe(true);
    expect(isDescendant(tree(), "C", "B")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/lib/nodes/tree.test.ts`
Expected: FAIL — `Failed to resolve import "./tree"`.

- [ ] **Step 3: Write the implementation**

Create `web/src/lib/nodes/tree.ts`:

```ts
import type { Node } from "./types";

const clamp = (i: number, len: number) => Math.max(0, Math.min(i, len));

export function findNode(tree: Node[], id: string): Node | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParent(tree: Node[], id: string): { parent: Node | null; index: number } | null {
  const search = (list: Node[], parent: Node | null): { parent: Node | null; index: number } | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { parent, index: i };
      const kids = list[i].children;
      if (kids) {
        const found = search(kids, list[i]);
        if (found) return found;
      }
    }
    return null;
  };
  return search(tree, null);
}

export function updateNode(tree: Node[], id: string, fn: (n: Node) => Node): Node[] {
  return tree.map((node) => {
    if (node.id === id) return fn(node);
    if (node.children?.length) return { ...node, children: updateNode(node.children, id, fn) };
    return node;
  });
}

export function updateSiblings(tree: Node[], parentId: string | null, fn: (sibs: Node[]) => Node[]): Node[] {
  if (parentId === null) return fn(tree);
  return updateNode(tree, parentId, (parent) => ({ ...parent, children: fn(parent.children ?? []) }));
}

export function removeNode(tree: Node[], id: string): Node[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) => (node.children?.length ? { ...node, children: removeNode(node.children, id) } : node));
}

export function insertNode(tree: Node[], target: { parentId: string | null; index: number }, node: Node): Node[] {
  return updateSiblings(tree, target.parentId, (sibs) => {
    const next = [...sibs];
    next.splice(clamp(target.index, next.length), 0, node);
    return next;
  });
}

export function isDescendant(tree: Node[], ancestorId: string, maybeId: string): boolean {
  const ancestor = findNode(tree, ancestorId);
  return Boolean(ancestor?.children && findNode(ancestor.children, maybeId));
}

export function moveNode(tree: Node[], id: string, target: { parentId: string | null; index: number }): Node[] {
  if (id === target.parentId) return tree;
  if (target.parentId !== null && isDescendant(tree, id, target.parentId)) return tree;
  const node = findNode(tree, id);
  const loc = findParent(tree, id);
  if (!node || !loc) return tree;
  const sameParent = (loc.parent?.id ?? null) === target.parentId;
  let index = target.index;
  if (sameParent && loc.index < target.index) index -= 1; // removal shifts later indices left
  return insertNode(removeNode(tree, id), { parentId: target.parentId, index }, node);
}

function cloneWithFreshIds(node: Node): Node {
  return {
    ...node,
    id: crypto.randomUUID(),
    props: structuredClone(node.props),
    ...(node.style ? { style: structuredClone(node.style) } : {}),
    ...(node.advanced ? { advanced: structuredClone(node.advanced) } : {}),
    ...(node.children ? { children: node.children.map(cloneWithFreshIds) } : {}),
  };
}

export function duplicateNode(tree: Node[], id: string): { tree: Node[]; newId: string } {
  const node = findNode(tree, id);
  const loc = findParent(tree, id);
  if (!node || !loc) return { tree, newId: id };
  const copy = cloneWithFreshIds(node);
  return { tree: insertNode(tree, { parentId: loc.parent?.id ?? null, index: loc.index + 1 }, copy), newId: copy.id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/lib/nodes/tree.test.ts`
Expected: PASS (all groups green). `crypto.randomUUID`/`structuredClone` are Node-20 globals (project uses `@types/node ^20`), available in the Vitest node env.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/nodes/tree.ts web/src/lib/nodes/tree.test.ts
git commit -m "feat(engine): immutable tree ops for nested nodes (find/update/insert/move/duplicate)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Route PageBuilder id-mutations through `tree.ts` (behavior-preserving)

**Files:**
- Modify: `web/src/components/admin/PageBuilder.tsx`

**Interfaces — Consumes:** `findNode`, `updateNode` from `@/lib/nodes/tree` (Task 1).

Rewire the **id-based** mutations only (no call-signature or UI change; top-level behavior is identical because the helpers reduce to the flat case). The index-based toolbar ops (`move`/`duplicate`/`remove`) and DnD are reworked in Tasks 5–6.

- [ ] **Step 1: Import the tree helpers**

In `web/src/components/admin/PageBuilder.tsx`, add after the `dnd` import (line ~14):

```tsx
import { findNode, updateNode } from "@/lib/nodes/tree";
```

- [ ] **Step 2: `selectedBlock` via `findNode`**

Replace (line ~62):

```tsx
  const selectedBlock = page.blocks.find((b) => b.id === selected) ?? null;
```

with:

```tsx
  const selectedBlock = selected ? findNode(page.blocks, selected) : null;
```

- [ ] **Step 3: Route the three inspector updaters + inline edit through `updateNode`**

Replace the four updaters (lines ~112–129):

```tsx
  const updateSelectedProps = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, props: setAt(b.props, path, value) as Json } : b)));
  };
  const updateSelectedStyle = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, style: setAt(b.style ?? {}, path, value) as Json } : b)));
  };
  const updateSelectedAdvanced = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", page.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, advanced: setAt(b.advanced ?? {}, path, value) as Json } : b)));
  };

  // Inline (on-canvas) text edits commit here, keyed by the block's own id.
  const updateBlockProp = (blockId: string, path: (string | number)[], value: string) => {
    set("blocks", page.blocks.map((b) => (b.id === blockId ? { ...b, props: setAt(b.props, path, value) as Json } : b)));
    setState(null);
  };
```

with:

```tsx
  const updateSelectedProps = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", updateNode(page.blocks, selectedBlock.id, (b) => ({ ...b, props: setAt(b.props, path, value) as Json })));
  };
  const updateSelectedStyle = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", updateNode(page.blocks, selectedBlock.id, (b) => ({ ...b, style: setAt(b.style ?? {}, path, value) as Json })));
  };
  const updateSelectedAdvanced = (path: Path, value: unknown) => {
    if (!selectedBlock) return;
    set("blocks", updateNode(page.blocks, selectedBlock.id, (b) => ({ ...b, advanced: setAt(b.advanced ?? {}, path, value) as Json })));
  };

  // Inline (on-canvas) text edits commit here, keyed by the block's own id.
  const updateBlockProp = (blockId: string, path: (string | number)[], value: string) => {
    set("blocks", updateNode(page.blocks, blockId, (b) => ({ ...b, props: setAt(b.props, path, value) as Json })));
    setState(null);
  };
```

- [ ] **Step 4: Verify**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: `tsc` silent; Vitest all green (tree tests + existing suite, no regressions).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/admin/PageBuilder.tsx
git commit -m "refactor(editor): route id-based edits through recursive tree ops

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Shared wrapper style + export single-node `Block` (BlockRenderer)

**Files:**
- Modify: `web/src/components/blocks/BlockRenderer.tsx`

**Interfaces — Produces:**
- `export function nodeWrapperStyle(node: Node): React.CSSProperties | undefined` — the wrapper's inline style (container flex, or `display:contents` for layout-transparent non-box nodes, or `undefined` for a plain box).
- `export function Block(props: { block: PageBlock; ctx: BlockCtx; edit: Edit }): ReactNode` — renders ONE node's own inner content (no wrapper, no children).

**Consumes:** `nodeCss`, `wrapperAttrs`, `needsBox` from `@/lib/nodes/css` (unchanged).

- [ ] **Step 1: Add the container flex + wrapper-style helpers**

In `web/src/components/blocks/BlockRenderer.tsx`, add after the imports (after line ~10):

```tsx
const ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
const JUSTIFY: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" };

/** Flex layout for a container node, derived from its props. undefined for non-containers. */
export function containerFlexStyle(node: PageBlock): React.CSSProperties | undefined {
  if (node.type !== "container") return undefined;
  const p = node.props ?? {};
  return {
    display: "flex",
    flexDirection: p.direction === "row" ? "row" : "column",
    gap: typeof p.gap === "number" ? `${p.gap}px` : undefined,
    alignItems: ALIGN[String(p.align)] ?? "stretch",
    justifyContent: JUSTIFY[String(p.justify)] ?? "flex-start",
    flexWrap: p.wrap ? "wrap" : "nowrap",
  };
}

/** The wrapper's inline style: container flex; else a real box when it needs one OR is a
 *  flex item (a container's child MUST be a box so flex doesn't dissolve it); else
 *  layout-transparent `display:contents`. */
export function nodeWrapperStyle(node: PageBlock, flexItem = false): React.CSSProperties | undefined {
  const flex = containerFlexStyle(node);
  if (flex) return flex;
  return needsBox(node) || flexItem ? undefined : { display: "contents" };
}
```

- [ ] **Step 2: Export `Block` and use `nodeWrapperStyle` in `renderNode`**

Change the `Block` function declaration (line ~381) from `function Block(` to `export function Block(`.

Replace `renderNode`'s wrapper return (the `<div … style={boxed ? undefined : { display: "contents" }}>` block, lines ~420–434) — replace the `boxed` line and the div's `style`:

Old:
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
```

New:
```tsx
  const { className, id } = wrapperAttrs(node);
  return (
    <div
      key={node.id}
      className={className}
      id={id}
      data-node={node.id}
      style={nodeWrapperStyle(node, flexItem)}
    >
```

Then thread `flexItem` through the recursion so a container's children render as real boxes:
- Change the `renderNode` signature to `function renderNode(node: PageBlock, ctx: BlockCtx, edit: ... , flexItem = false): ReactNode` (keep the existing `edit` type).
- Change the kids line from `node.children.map((c) => renderNode(c, ctx, edit))` to `node.children.map((c) => renderNode(c, ctx, edit, node.type === "container"))`.
- The top-level `BlockRenderer` call `blocks.map((b) => renderNode(b, ctx, edit))` is unchanged (`flexItem` defaults to `false`).

(For every existing node, `flexItem` is `false` and `nodeWrapperStyle` returns exactly what the old code returned — `undefined` when boxed, `{display:"contents"}` otherwise — so public output is byte-identical. The container flex branch and the `flexItem` box only fire when a `container` is present, which no existing page uses.)

- [ ] **Step 3: Verify**

Run: `cd web && npx tsc --noEmit && npx vitest run`
Expected: `tsc` silent; all tests green (no behavior change; `css.test.ts` unaffected).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/blocks/BlockRenderer.tsx
git commit -m "refactor(render): shared node-wrapper style helper + export Block; container flex ready

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `container` block type + `select` field kind

**Files:**
- Modify: `web/src/lib/pageRegistry.ts` (FieldSpec union)
- Modify: `web/src/lib/validateFields.ts` (validator)
- Modify: `web/src/components/admin/FieldsRenderer.tsx` (renderer)
- Modify: `web/src/lib/pageBlocks.ts` (register `container`)
- Modify: `web/src/components/blocks/BlockRenderer.tsx` (`Block` switch: `case "container"`)
- Test: `web/src/lib/validateFields` covered indirectly; add a focused Vitest for the `select` validator.

**Interfaces — Produces:** FieldSpec kind `{ kind: "select"; key: string; label: string; options: { value: string; label: string }[]; help?: string }`; block type `container`.

- [ ] **Step 1: Write the failing test for the `select` validator**

Create `web/src/lib/validateFields.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateFields } from "./validateFields";
import type { FieldSpec } from "./pageRegistry";

const fields: FieldSpec[] = [
  { kind: "select", key: "direction", label: "Direction", options: [{ value: "column", label: "Stack" }, { value: "row", label: "Row" }] },
];

describe("validateFields select", () => {
  it("keeps an allowed value", () => {
    expect(validateFields(fields, { direction: "row" }, { direction: "column" })).toEqual({ direction: "row" });
  });
  it("falls back to the default for a disallowed value", () => {
    expect(validateFields(fields, { direction: "diagonal" }, { direction: "column" })).toEqual({ direction: "column" });
  });
  it("falls back to the first option when no default is valid", () => {
    expect(validateFields(fields, {}, {})).toEqual({ direction: "column" });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd web && npx vitest run src/lib/validateFields.test.ts`
Expected: FAIL — the `select` case is unhandled, so `direction` is absent from the output.

- [ ] **Step 3: Add the `select` kind (type + validator + renderer)**

In `web/src/lib/pageRegistry.ts`, add to the `FieldSpec` union (after the `image` member, line ~12):

```ts
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[]; help?: string }
```

In `web/src/lib/validateFields.ts`, add a case inside the `switch (f.kind)` (after the `toggle` case, line ~45):

```ts
      case "select": {
        const allowed = f.options.map((o) => o.value);
        const raw2 = typeof raw === "string" ? raw : undefined;
        const dft2 = typeof dRaw === "string" ? dRaw : undefined;
        out[f.key] = raw2 && allowed.includes(raw2) ? raw2
          : dft2 && allowed.includes(dft2) ? dft2
          : allowed[0] ?? "";
        break;
      }
```

In `web/src/components/admin/FieldsRenderer.tsx`, add a case inside `renderField`'s `switch (f.kind)` (after the `toggle` case, ~line 114):

```tsx
      case "select":
        return (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{f.label}</label>
            <select id={id} className={inputCls} value={String(val ?? "")} onChange={(e) => onChange(path, e.target.value)}>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        );
```

- [ ] **Step 4: Register the `container` block + render nothing for its own content**

In `web/src/lib/pageBlocks.ts`, add a `sel` helper next to the other field helpers (after line ~24, `const tog = …`):

```ts
const sel = (key: string, label: string, options: { value: string; label: string }[]): FieldSpec => ({ kind: "select", key, label, options });
```

Add this entry to the `BLOCK_TYPES` array, as the FIRST entry in the Layout group (before `hero`, so it sits at the top — order in the array only affects nothing functionally; place it right after the opening `[`):

```ts
  {
    type: "container",
    label: "Container",
    description: "A flexible box that holds other blocks (row = columns, column = stack).",
    icon: "▢",
    fields: [
      sel("direction", "Direction", [{ value: "column", label: "Stack (column)" }, { value: "row", label: "Row (columns)" }]),
      num("gap", "Gap (px)"),
      sel("align", "Align items", [{ value: "stretch", label: "Stretch" }, { value: "start", label: "Start" }, { value: "center", label: "Center" }, { value: "end", label: "End" }]),
      sel("justify", "Justify", [{ value: "start", label: "Start" }, { value: "center", label: "Center" }, { value: "end", label: "End" }, { value: "between", label: "Space between" }]),
      tog("wrap", "Wrap"),
    ],
    defaults: { direction: "column", gap: 24, align: "stretch", justify: "start", wrap: false },
  },
```

In `web/src/components/blocks/BlockRenderer.tsx`, add a case to the `Block` switch (near the other cases, e.g. after `case "columns":`):

```tsx
    case "container": return null;
```

(The container renders no own inner content — its children render via the wrapper.)

Then add it to the palette. In `web/src/components/admin/ElementsPanel.tsx`, replace the Layout category (line 14):

```ts
  { name: "Layout", types: ["hero", "columns", "divider", "spacer"] },
```

with:

```ts
  { name: "Layout", types: ["container", "hero", "columns", "divider", "spacer"] },
```

- [ ] **Step 5: Run tests + typecheck**

Run: `cd web && npx vitest run src/lib/validateFields.test.ts && npx tsc --noEmit && npx vitest run`
Expected: the `select` tests PASS; `tsc` silent; full suite green.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/pageRegistry.ts web/src/lib/validateFields.ts web/src/lib/validateFields.test.ts web/src/components/admin/FieldsRenderer.tsx web/src/lib/pageBlocks.ts web/src/components/blocks/BlockRenderer.tsx web/src/components/admin/ElementsPanel.tsx
git commit -m "feat(editor): container block type + select field kind

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Recursive editable canvas (`EditableNode`) + populatable containers

**Files:**
- Create: `web/src/components/admin/editorContext.ts`
- Create: `web/src/components/admin/EditableNode.tsx`
- Modify: `web/src/components/admin/PageBuilder.tsx` (id-based recursive `move`/`duplicate`/`remove`, parent-aware insert, render via `EditableNode`)

**Interfaces:**
- **Consumes:** `findParent`, `updateSiblings`, `removeNode`, `duplicateNode`, `insertNode`, `findNode` (Task 1); `Block`, `nodeWrapperStyle` (Task 3); `nodeCss`, `wrapperAttrs` (`css.ts`); `blockTypeFor` (`pageBlocks`).
- **Produces:** `EditorProvider`/`useEditor` context and the `EditableNode` component.

This task makes containers **populatable via click-insert** (select a container → click a palette block → it drops inside). Drag-into-container is Task 6.

- [ ] **Step 1: Editor context**

Create `web/src/components/admin/editorContext.ts`:

```ts
"use client";

import { createContext, useContext } from "react";

export type EditorApi = {
  serviceOptions: string[];
  selectedId: string | null;
  select: (id: string) => void;
  edit: (blockId: string, path: (string | number)[], value: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
};

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside <EditorContext.Provider>");
  return ctx;
}
```

- [ ] **Step 2: The recursive `EditableNode`**

Create `web/src/components/admin/EditableNode.tsx`.

**Rendering rule (important):** in the editor, `EditableNode` is **always a real `position:relative` box** — it cannot be `display:contents`, because the selection ring and toolbar are absolutely positioned and need a box to anchor to. It carries the node's scoped class + `<style>` (so bg/padding/border from the inspector show live) and, for a container, the shared `containerFlexStyle`. Chrome (ring + toolbar) shows only when the node is **selected** — this avoids the nested-`group-hover` problem (a deep hover would otherwise light up every ancestor's toolbar). This is a deliberate, minor divergence from the public renderer (which uses `display:contents` for un-boxed nodes); the *public* output stays byte-identical, and the editor is a faithful-enough WYSIWYG since an extra layout-neutral box around block content reads the same.

```tsx
"use client";

import { nodeCss, wrapperAttrs } from "@/lib/nodes/css";
import type { PageBlock } from "@/lib/pageBlocks";
import { blockTypeFor } from "@/lib/pageBlocks";
import { Block, containerFlexStyle } from "@/components/blocks/BlockRenderer";
import { useEditor } from "@/components/admin/editorContext";

const toolbarBtn =
  "grid h-7 w-7 place-items-center rounded bg-[#17191c] text-xs text-[rgba(246,245,242,0.85)] transition-colors hover:bg-[var(--gold)] hover:text-[#17191c] disabled:opacity-30";

export default function EditableNode({ node, siblingCount, index }: { node: PageBlock; siblingCount: number; index: number }) {
  const ed = useEditor();
  const on = ed.selectedId === node.id;
  const isContainer = node.type === "container";
  const css = nodeCss(node);
  const { className } = wrapperAttrs(node);
  const kids = node.children ?? [];

  return (
    <div
      className={`${className} relative outline-offset-[-2px] ${on ? "outline outline-2 outline-[var(--gold)]" : "hover:outline hover:outline-1 hover:outline-[var(--line-strong)]"}`}
      data-node={node.id}
      style={containerFlexStyle(node)}
      role="button"
      tabIndex={0}
      aria-label={`Select ${blockTypeFor(node.type)?.label ?? node.type} block`}
      onClick={(e) => { e.stopPropagation(); ed.select(node.id); }}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ed.select(node.id); } }}
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}

      {/* toolbar — shown only when this node is selected */}
      {on && (
        <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg bg-[#17191c] p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <span className="px-2 font-mono text-[0.62rem] uppercase tracking-wide text-[var(--gold-media)]">{blockTypeFor(node.type)?.label ?? node.type}</span>
          <button type="button" aria-label="Move up" disabled={index === 0} className={toolbarBtn} onClick={() => ed.move(node.id, -1)}>↑</button>
          <button type="button" aria-label="Move down" disabled={index === siblingCount - 1} className={toolbarBtn} onClick={() => ed.move(node.id, 1)}>↓</button>
          <button type="button" aria-label="Duplicate" className={toolbarBtn} onClick={() => ed.duplicate(node.id)}>⧉</button>
          <button type="button" aria-label="Remove" className={`${toolbarBtn} hover:bg-[#a33] hover:text-white`} onClick={() => ed.remove(node.id)}>✕</button>
        </div>
      )}

      {/* the node's own content (links never navigate in edit mode) */}
      <div onClickCapture={(e) => { const a = (e.target as HTMLElement).closest("a"); if (a) e.preventDefault(); }}>
        <Block block={node} ctx={{ serviceOptions: ed.serviceOptions }} edit={(path, value) => ed.edit(node.id, path, value)} />
      </div>

      {/* container children (each a real box, so flex layout treats them as items) */}
      {isContainer && (
        kids.length === 0 ? (
          <div className="m-2 grid min-h-[64px] w-full place-items-center rounded-md border-2 border-dashed border-[var(--line-strong)] text-xs text-[var(--muted)]">
            Empty container — select it and add blocks from the ＋ panel
          </div>
        ) : (
          kids.map((child, i) => <EditableNode key={child.id} node={child} siblingCount={kids.length} index={i} />)
        )
      )}
    </div>
  );
}
```

(`containerFlexStyle` returns `undefined` for non-containers, so the wrapper is a plain relative block box; for containers it applies the flex layout and the children become flex items. `outline` — not `ring` — is used so the selection indicator never adds layout width.)

- [ ] **Step 3: PageBuilder — recursive move/duplicate/remove + parent-aware insert, render via EditableNode**

In `web/src/components/admin/PageBuilder.tsx`:

(a) Extend the tree import:
```tsx
import { findNode, findParent, updateNode, updateSiblings, removeNode, duplicateNode, insertNode } from "@/lib/nodes/tree";
```
Add:
```tsx
import EditableNode from "@/components/admin/EditableNode";
import { EditorContext } from "@/components/admin/editorContext";
```

(b) Replace `insertAt`, `move`, `duplicate`, `remove`, and `insertIndex` with id/parent-aware versions:

```tsx
  // Where a palette insert lands: inside the selected container (append), else after the
  // selected node in its parent, else at the top level end.
  const insertTarget = (): { parentId: string | null; index: number } => {
    if (!selected) return { parentId: null, index: page.blocks.length };
    const node = findNode(page.blocks, selected);
    if (node?.type === "container") return { parentId: node.id, index: node.children?.length ?? 0 };
    const loc = findParent(page.blocks, selected);
    if (!loc) return { parentId: null, index: page.blocks.length };
    return { parentId: loc.parent?.id ?? null, index: loc.index + 1 };
  };

  const insertAt = (target: { parentId: string | null; index: number }, type: string) => {
    const bt = blockTypeFor(type);
    if (!bt) return;
    const block: PageBlock = { id: crypto.randomUUID(), type, props: structuredClone(bt.defaults) };
    set("blocks", insertNode(page.blocks, target, block));
    selectBlock(block.id);
  };

  const move = (id: string, dir: -1 | 1) => {
    const loc = findParent(page.blocks, id);
    if (!loc) return;
    set("blocks", updateSiblings(page.blocks, loc.parent?.id ?? null, (sibs) => {
      const i = sibs.findIndex((b) => b.id === id);
      const j = i + dir;
      if (j < 0 || j >= sibs.length) return sibs;
      const next = [...sibs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    }));
  };

  const duplicate = (id: string) => {
    const { tree, newId } = duplicateNode(page.blocks, id);
    set("blocks", tree);
    selectBlock(newId);
  };

  const remove = (id: string) => {
    set("blocks", removeNode(page.blocks, id));
    setSelected(null);
    setSettingsTab("page");
  };
```

(c) Update the palette insert callsites: the header/empty-state inserter and the panel call `insertAt(insertTarget(), type)`. Replace the ElementsPanel usage (line ~237):
```tsx
            <ElementsPanel onInsert={(type) => insertAt(insertTarget(), type)} onDragType={setDragType} />
```

(d) Replace the entire blocks `.map(...)` render (the `{page.blocks.map((b, i) => { … })}` block, lines ~288–340) with an `EditorContext.Provider` wrapping `EditableNode`s:

```tsx
              <EditorContext.Provider value={{ serviceOptions, selectedId: selected, select: selectBlock, edit: updateBlockProp, move, duplicate, remove }}>
                {page.blocks.map((b, i) => (
                  <EditableNode key={b.id} node={b} siblingCount={page.blocks.length} index={i} />
                ))}
              </EditorContext.Provider>
```

(e) Remove now-dead editor code from `PageBuilder.tsx`:
- the `import BlockRenderer from "@/components/blocks/BlockRenderer"` line — the canvas no longer uses it (`EditableNode` renders nodes now);
- the `blockToolbarBtn` const (its logic moved into `EditableNode`);
- **all old top-level DnD**: the `dragIndex`/`overIndex`/`overPos`/`dragType` state, `handleDrop`, and the drag/drop handlers that lived on the per-block wrapper and the blocks-container `<div>`. Revert the empty-state to the plain "Empty page." + "Add your first block" button (drop the dashed drop-zone visual). Stop passing `onDragType` to `ElementsPanel` (its buttons stay `draggable` but do nothing until Task 6).

Result: **click-insert only** (including into a selected container). Drag-and-drop is re-introduced — recursively — in Task 6.

> Implementer note: `EditableNode` now owns all per-node chrome and rendering; delete any leftover references to the old per-block `.map` locals (`on`, `i`, etc.). The `insertIndexFor`/`reorderIndexFor` imports from `@/lib/nodes/dnd` become unused here — remove them (Task 6 computes the drop index inline, so they stay out).

- [ ] **Step 4: Verify (typecheck + lint + browser)**

Run: `cd web && npx tsc --noEmit && npx vitest run && npm run lint` (no NEW lint errors beyond the known pre-existing ones).

Then browser-verify on a temporary dev route (agent can't log in):
- Create `web/src/app/dev-editor/page.tsx` (a `"use client"` page mounting `<PageBuilder id={null} initial={{title:"Dev",slug:"dev",status:"draft",seoTitle:"",seoDescription:"",blocks:[{id:"c1",type:"container",props:{direction:"row",gap:24,align:"stretch",justify:"start",wrap:false},children:[{id:"h1",type:"heading",props:{text:"One",level:2,align:"left"}},{id:"t1",type:"text",props:{body:"First column."}}]}]}} serviceOptions={[]} />`).
- Stop dev, `rm -rf web/.next`, `npm run dev` (avoid the Turbopack wedge).
- In the browser: the container renders its two children side by side (row); clicking a child selects it and shows its Content/Style/Advanced; changing the child's text updates the canvas; duplicate/remove/move within the container work; selecting the container and clicking a palette block appends it inside; selecting the container's Content tab shows the layout controls and switching direction to "column" restacks the children.
- **Delete `web/src/app/dev-editor/page.tsx` before committing.**

- [ ] **Step 5: Commit**

```bash
git add web/src/components/admin/EditableNode.tsx web/src/components/admin/editorContext.ts web/src/components/admin/PageBuilder.tsx
git commit -m "feat(editor): recursive EditableNode canvas; containers populatable via click-insert

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Recursive drag-and-drop (into/within/across containers)

**Files:**
- Modify: `web/src/components/admin/editorContext.ts` (drag fields)
- Modify: `web/src/components/admin/EditableNode.tsx` (drag handle, drop targets, indicator)
- Modify: `web/src/components/admin/PageBuilder.tsx` (drag state + `handleDrop` via `insertNode`/`moveNode`, depth guard)

**Interfaces — Consumes:** `insertIndexFor` (`dnd.ts`), `insertNode`, `moveNode` (`tree.ts`), `treeDepth` (`walk.ts`).

- [ ] **Step 1: Extend the editor context with drag state**

In `web/src/components/admin/editorContext.ts`, extend `EditorApi`:

```ts
export type DropTarget = { parentId: string | null; index: number };

export type EditorApi = {
  serviceOptions: string[];
  selectedId: string | null;
  select: (id: string) => void;
  edit: (blockId: string, path: (string | number)[], value: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  // drag
  dragActive: boolean;
  dropTarget: DropTarget | null;
  startDrag: (id: string) => void;
  endDrag: () => void;
  hover: (target: DropTarget) => void;
  drop: () => void;
};
```

- [ ] **Step 2: PageBuilder drag state + recursive `handleDrop`**

In `web/src/components/admin/PageBuilder.tsx`:

(a) Add the recursive DnD state (Task 5 removed the old flat DnD entirely):
```tsx
  const [dragId, setDragId] = useState<string | null>(null);       // reorder source node id
  const [dragType, setDragType] = useState<string | null>(null);   // palette insert type
  const [dropTarget, setDropTarget] = useState<{ parentId: string | null; index: number } | null>(null);
```
Add imports (the before/after index is computed inline in `EditableNode`, so no `dnd.ts` import is needed here):
```tsx
import { moveNode } from "@/lib/nodes/tree";   // add moveNode to the existing tree import
import { treeDepth } from "@/lib/nodes/walk";
```

(b) Replace `handleDrop` with:
```tsx
  const MAX_DEPTH = 6;
  const handleDrop = () => {
    const target = dropTarget;
    setDragId(null); setDragType(null); setDropTarget(null);
    if (!target) return;
    if (dragType !== null) {
      const bt = blockTypeFor(dragType);
      if (!bt) return;
      const block: PageBlock = { id: crypto.randomUUID(), type: dragType, props: structuredClone(bt.defaults) };
      const next = insertNode(page.blocks, target, block);
      if (treeDepth(next) > MAX_DEPTH) { setState({ error: `Blocks can nest at most ${MAX_DEPTH} levels deep.` }); return; }
      set("blocks", next);
      selectBlock(block.id);
    } else if (dragId !== null) {
      const next = moveNode(page.blocks, dragId, target);
      if (treeDepth(next) > MAX_DEPTH) { setState({ error: `Blocks can nest at most ${MAX_DEPTH} levels deep.` }); return; }
      set("blocks", next);
    }
  };
```

(c) Extend the `EditorContext.Provider` value with the drag api:
```tsx
                value={{
                  serviceOptions, selectedId: selected, select: selectBlock, edit: updateBlockProp, move, duplicate, remove,
                  dragActive: dragId !== null || dragType !== null,
                  dropTarget,
                  startDrag: setDragId,
                  endDrag: () => { setDragId(null); setDropTarget(null); },
                  hover: setDropTarget,
                  drop: handleDrop,
                }}
```

(d) The palette items already call `onDragType={setDragType}` (drag start) — unchanged. Ensure `ElementsPanel`'s `onDragEnd` also clears the target: change the PageBuilder-passed handler to `onDragType={(t) => { setDragType(t); if (t === null) setDropTarget(null); }}`.

- [ ] **Step 3: EditableNode — drag handle, drop targets, indicator**

In `web/src/components/admin/EditableNode.tsx`, consume the drag api from `useEditor()` and add:

(a) A drag handle span inside the wrapper (before the toolbar):
```tsx
      <span
        draggable
        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", node.id); ed.select(node.id); ed.startDrag(node.id); }}
        onDragEnd={() => ed.endDrag()}
        aria-label="Drag to reorder"
        className="absolute left-1 top-2 z-30 grid h-7 w-6 cursor-grab place-items-center rounded bg-[#17191c] text-[rgba(246,245,242,0.85)] opacity-0 transition-opacity group-hover/node:opacity-100 active:cursor-grabbing"
      >⠿</span>
```

(b) On the wrapper `<div>`, add drop handling that targets THIS node's parent slot. Pass `parentId` + `index` into `EditableNode` (add props `parentId: string | null`) and compute before/after:
```tsx
      onDragOver={(e) => {
        if (!ed.dragActive) return;
        e.preventDefault();
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        const pos = e.clientY < r.top + r.height / 2 ? "before" : "after";
        ed.hover({ parentId, index: pos === "before" ? index : index + 1 });
      }}
      onDrop={(e) => { if (!ed.dragActive) return; e.preventDefault(); e.stopPropagation(); ed.drop(); }}
```
(`insertIndexFor` is effectively inlined here as `pos === "before" ? index : index + 1`.)

(c) Only the **empty-container** dashed zone needs an explicit inside-target (append at index 0). For a NON-empty container, hovering any child already resolves to a slot inside that container (the child's wrapper targets its own parent, which IS the container), so no extra "container gap" target is needed — the container's own wrapper `onDragOver` (step b) targets the container's *parent* slot (i.e. placing before/after the container as a unit). Add to the empty-state dashed div:
```tsx
        onDragOver={(e) => { if (!ed.dragActive) return; e.preventDefault(); e.stopPropagation(); ed.hover({ parentId: node.id, index: 0 }); }}
        onDrop={(e) => { if (!ed.dragActive) return; e.preventDefault(); e.stopPropagation(); ed.drop(); }}
```
Also highlight the empty zone when it is the active target: add `${ed.dropTarget?.parentId === node.id ? "border-[var(--gold)] bg-[var(--surface-2)]" : ""}` to its className.

(d) Drop indicator: render a gold line when `ed.dropTarget` matches this node's slot:
```tsx
      {ed.dragActive && ed.dropTarget?.parentId === parentId && (ed.dropTarget.index === index || ed.dropTarget.index === index + 1) && (
        <div className={`pointer-events-none absolute inset-x-0 z-40 h-0.5 bg-[var(--gold)] ${ed.dropTarget.index === index ? "top-0" : "bottom-0"}`} aria-hidden="true" />
      )}
```

(e) Recurse with the parent id: children render `<EditableNode … parentId={node.id} index={i} />`; top-level `EditableNode`s in PageBuilder pass `parentId={null}`.

- [ ] **Step 4: Verify (typecheck + lint + browser)**

Run: `cd web && npx tsc --noEmit && npx vitest run && npm run lint` (no NEW lint errors).

Browser (temp dev route again, clean `.next` restart, delete route after): drag a palette block into a container (drops inside, indicator shows); drag a top-level block into a container and back out (cross-container move); reorder within a container; confirm dragging a container into its own child is refused (no-op); confirm the depth-cap notice appears when exceeding 6 levels.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/admin/editorContext.ts web/src/components/admin/EditableNode.tsx web/src/components/admin/PageBuilder.tsx
git commit -m "feat(editor): recursive drag-and-drop into/within/across containers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Whole-feature verification + cleanup

**Files:** none (verification) — plus deletion of any temporary dev route.

- [ ] **Step 1: Confirm no temp route remains**

Run: `cd "D:/Studiodota.net" && test ! -e web/src/app/dev-editor && echo "clean" || echo "DELETE web/src/app/dev-editor"`
Expected: `clean`. If not, delete `web/src/app/dev-editor`.

- [ ] **Step 2: Full gate**

Run: `cd web && npx tsc --noEmit && npm run lint && npx vitest run`
Expected: `tsc` silent; lint shows only the known pre-existing errors (no new ones); Vitest all green (tree + validateFields + existing).

- [ ] **Step 3: Final in-browser pass (temp route, then delete it)**

Recreate the temp dev route from Task 5 Step 4, clean-restart, and run the full script: create container → set direction row/column → drag blocks in from the palette → select + edit nested (Content text updates live; Style bg applies) → duplicate a nested subtree (assert visually distinct, no shared state) → move nested across containers → delete nested → verify the depth-cap notice. Screenshot the working row+column containers. **Delete the temp route.**

- [ ] **Step 4: Client spot-check handoff**

Provide the client recipe: clean Turbopack restart (`rm -rf web/.next`), then in the real admin: add a Container, drop Heading/Image/Text inside, switch direction, nest a Container in a Container, Save, View the published page → the nested layout renders.

## Notes / limitations

- **Deferred:** per-breakpoint container layout (A2.3 responsive), migrating the old `columns` widget, saved patterns, column-resize handles.
- **Depth cap 6** enforced by `validateTree` (save) and the editor `handleDrop` guard.
- **Pre-existing lint** (`ContactForm`/`Navbar`/`VideoPlayer`/`InlineText`/`Hero3D`/`HeroScrub`) is out of scope; only avoid adding NEW lint errors.
- **No component-test harness** — UI tasks verified by tsc/lint + the temp-route browser pass; pure logic (`tree.ts`, `select` validator) is unit-tested.
