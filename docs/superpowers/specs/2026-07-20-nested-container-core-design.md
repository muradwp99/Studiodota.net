# Nested Container Core — flexible flex Container + recursive editor (A3.2)

**Date:** 2026-07-20
**Branch:** `feature/admin-v1-client-ready`
**Status:** Design (approved to write spec)
**Related:** [`2026-07-19-live-editor-core-design.md`](2026-07-19-live-editor-core-design.md) (A1), A2.1/A2.2 inspector, [`2026-07-20-live-editor-a2.2-controls-drag-insert-chrome-design.md`](2026-07-20-live-editor-a2.2-controls-drag-insert-chrome-design.md) (drag-to-insert)

## Context

The `Node` type already carries `children`, `BlockRenderer.renderNode` already renders `children`
recursively, and `validateTree` already validates them (depth cap 6 / 300 nodes / 20KB bag). What is
missing:

- **No block actually holds child blocks.** Today's `columns` block stores `{heading, body}` objects in
  `props.items` — it is a fixed widget, not a container of nodes.
- **The editor is top-level only.** Selection, the block toolbar (move/dup/delete), inline text edit,
  the Content/Style/Advanced inspector, and every drop target operate on the flat `page.blocks` array.
  Nothing recurses into `children`.

## Goal

A single **flexbox Container** block that holds arbitrary child blocks and is *highly flexible to edit*
(layout + full styling + nesting), and an editor that treats **every node at any depth** as
selectable, editable, duplicable, removable, movable, and a drop target.

The flex Container is the modern primitive (as in current Elementor): `direction: row` → columns,
`direction: column` → a stack. This subsumes the need for a separate "columns as container" phase.

## Non-goals (deferred)

- **Per-breakpoint container layout** (different direction/gap on tablet/mobile) — needs the A2.3
  responsive work; phase-1 layout is base-only.
- **Migrating the existing `columns` widget** to a container — left untouched (no migration risk); the
  flex Container supersedes it for new layouts.
- **Saved patterns / reusable blocks**, drag-out-to-top-level-from-deep affordances beyond normal DnD,
  and column-resize handles.

---

## Architecture — three units

### Unit 1 — Pure tree helpers (`web/src/lib/nodes/tree.ts`, unit-tested)

Immutable operations complementing the existing read-only `walkNodes`/`countNodes`/`treeDepth`:

```ts
findNode(tree: Node[], id: string): Node | null
findParent(tree: Node[], id: string): { parent: Node | null; index: number } | null  // parent null = top level
updateNode(tree: Node[], id: string, fn: (n: Node) => Node): Node[]
removeNode(tree: Node[], id: string): Node[]
insertNode(tree: Node[], target: { parentId: string | null; index: number }, node: Node): Node[]
moveNode(tree: Node[], id: string, target: { parentId: string | null; index: number }): Node[]
duplicateNode(tree: Node[], id: string): { tree: Node[]; newId: string }   // deep clone, FRESH ids recursively
```

- All are pure and recursive; top-level cases reduce to the current flat behavior.
- `duplicateNode` deep-clones and regenerates **every** id in the subtree — fixing the current
  `duplicate` trap that clones nested ids verbatim.
- `moveNode` reuses the `reorderIndexFor` shift logic from `dnd.ts` when source and target share a parent.
- **Guard against invalid moves:** a node cannot be moved into itself or a descendant (`moveNode`
  returns the tree unchanged in that case). Unit-tested.

### Unit 2 — The flex Container block

- New block type `container` in `pageBlocks.ts`:
  - `defaults`: `{ direction: "column", gap: 24, align: "stretch", justify: "start", wrap: false }`, and it is created **with `children: []`**.
  - `fields` (Content tab, layout controls): direction (row/column), gap (number px), align-items,
    justify-content, wrap (toggle). Needs a **`select` field kind** added to `FieldsRenderer` (options
    list) — reused by direction/align/justify. `gap` is `number`, `wrap` is `toggle` (both already
    supported). Width is constrained with the existing `maxWidth` Style control (no separate box/full prop).
  - Inherits the full A2.2 **Style** and **Advanced** control sets (shared, unchanged) → bg, border,
    shadow, radius, min-height, padding/margin, position, visibility, custom CSS.
- **Rendering:** container layout is applied as flex styles on the node's **wrapper** (the `.n-{id}`
  box). `needsBox` already returns `true` when `children.length`, so a container is always a real box.
  A shared wrapper helper (see Unit 3) computes the wrapper's inline layout style from the container's
  props: `display:flex; flex-direction; gap; align-items; justify-content; flex-wrap` (base breakpoint
  only — responsive deferred). The container's `Block` switch case renders **no own content** — its
  children are the content.
- **Public render stays byte-identical for existing pages** (no existing node is a container; the new
  wrapper-layout branch only triggers for `type === "container"`).

### Unit 3 — Recursive editable canvas + recursive DnD

**Shared wrapper helper.** Extract the wrapper concern (scoped `<style>` from `nodeCss`, `wrapperAttrs`
class/id, `needsBox` box-vs-`display:contents`, and the new container flex style) into one helper used
by **both** the public renderer and the editor, so editor WYSIWYG never drifts from the published page.
The public `BlockRenderer.renderNode` renders `wrapper → inner(Block) → children.map(renderNode)`. Also
export the single-node `Block` content renderer (inner only) for the editor.

**`EditableNode` (new admin component), used by `PageBuilder` per top-level block and recursively:**
renders, for one node:
1. the shared wrapper (same class/CSS/box/flex as public) — so it looks exactly like the live page;
2. editor **chrome**: selection ring when selected, hover toolbar (move ↑/↓ within parent · duplicate ·
   delete), drag handle, and drop indicator;
3. the node's own `Block` inner content (inline-text-editable);
4. if the node is a container: a **drop zone** rendering `node.children.map(EditableNode)`; an **empty**
   container shows a dashed "Drop blocks here" target.

**Recursive DnD.** Drag state carries a resolved target `{ parentId: string | null; index: number; pos: "before" | "after" }`:
- each node's `onDragOver` sets the target to its own parent + its index + before/after (from cursor Y);
- each container's empty/gutter zone sets the target to `{ parentId: containerId, index: end }`;
- `stopPropagation` keeps the innermost zone authoritative (same pattern as the current top-level DnD);
- `handleDrop` branches: palette drag → `insertNode(target, newBlock)`; reorder → `moveNode(draggedId, target)` (which no-ops on self/descendant targets).
- Reuses `insertIndexFor`/`reorderIndexFor` from `dnd.ts`.

**PageBuilder wiring.** `selectedBlock` → `findNode`; `updateSelectedProps/Style/Advanced` and
`updateBlockProp` → `updateNode`; `duplicate` → `duplicateNode` (+ select new); `remove` → `removeNode`;
`move` → `moveNode` within parent; `insertAt`/palette-insert and `handleDrop` → `insertNode`/`moveNode`.
Top-level behavior is unchanged (helpers reduce to the flat case). `insertIndex()` (insert-after-selected)
resolves the selected node's parent+index via `findParent` so palette clicks insert next to a selected
nested node.

---

## Data flow

1. User drags a block from the palette over a container's drop zone → drag state target =
   `{parentId: container.id, index}` → drop → `insertNode` → new tree → re-render → the child appears
   inside the container, laid out by the container's flex.
2. User clicks a nested child → `selected = child.id` → inspector shows that child's Content/Style/Advanced
   (found via `findNode`) → edits route through `updateNode` → the nested node re-renders in place.
3. User duplicates/removes/moves a nested child → `duplicateNode`/`removeNode`/`moveNode` → new tree.

## Error handling / edge cases

- Move into self/descendant → no-op (guarded in `moveNode`).
- Depth/size beyond caps → `validateTree` already rejects on save (depth 6 / 300 nodes / 20KB); the editor
  should also refuse to drop below depth 6 (cheap `treeDepth` check in `handleDrop`) with a small notice,
  so the user isn't surprised at save time.
- Empty container → renders the dashed drop target (edit) / nothing meaningful (public: an empty flex box,
  acceptable; authors fill it).
- A container's own inline-text: none (containers have no own text), so no `InlineText` for them.

## Testing / verification

- **Vitest** (`tree.test.ts`): find/findParent/update/remove/insert/move/duplicate incl. nested; fresh-id
  cloning (assert no id collisions across the cloned subtree); move-into-descendant no-op; behavior parity
  with the old flat ops for top-level. Extend `validate`/`walk` coverage if touched.
- `npx tsc --noEmit` + `npm run lint` (no NEW errors) + `npm test`.
- **Agent-side UI check without login** (login is a prohibited action): reuse the temporary
  unauthenticated dev-route technique — mount `PageBuilder` with a sample tree, then in-browser: add a
  Container, drag Heading/Text into it, confirm flex layout (row → side by side), select a nested child
  and edit its text (Content) + background (Style), duplicate/remove/reorder nested children, drag a
  child from one container to another, and confirm the depth-cap notice. Delete the route after.
- **Client spot-check** on the real admin (clean Turbopack restart first).

## Risks / traps

- **WYSIWYG drift:** editor and public rendering must share the wrapper helper — if they diverge, the
  canvas lies about the published result. (Mitigation: single shared helper; a node with no chrome renders
  byte-identically to `renderNode`.)
- **DnD target ambiguity across nested zones:** innermost-wins via `stopPropagation`; every drop resolves
  to an explicit `{parentId, index}` (no reliance on a single global `overIndex`).
- **`duplicate` id collisions:** `duplicateNode` regenerates all ids (tested).
- **Turbopack cache:** big edit → advise a clean `rm -rf web/.next` restart before the client checks.
- **Next 16:** all changes are client React + pure TS; no Next-16 APIs touched.

## Suggested task order (for the plan)

1. `tree.ts` + tests (pure foundation).
2. Refactor PageBuilder's existing top-level ops onto `tree.ts` (behavior-preserving; no UI change yet).
3. Shared wrapper helper + export single-node `Block` renderer; keep public render byte-identical.
4. `container` block type + `select` field kind + wrapper flex rendering (public + editor).
5. `EditableNode` recursive canvas (chrome + container drop zone), replacing the flat `.map` in PageBuilder.
6. Recursive DnD (`{parentId,index,pos}` target; palette-insert + move via tree ops; depth-cap guard).
7. Whole-feature verification (temp dev-route browser pass) + cleanup.
