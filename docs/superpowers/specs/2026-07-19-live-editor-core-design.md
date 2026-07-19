# Live Editor Core — Design Spec (Sub-project A)

**Date:** 2026-07-19
**Branch:** feature/admin-v1-client-ready
**Status:** Approved design → ready for implementation plan

---

## 1. Context & goal

The admin already has a live, click-to-edit page builder ([`PageBuilder.tsx`](../../../web/src/components/admin/PageBuilder.tsx)) that renders blocks through one shared renderer ([`BlockRenderer.tsx`](../../../web/src/components/blocks/BlockRenderer.tsx)) used by both the admin canvas and the public site. Blocks are a flat list of `{ id, type, props }`, edited through a right sidebar that only exposes **content** fields.

The goal is to turn this into an **Elementor/WordPress-class editor**: a persistent left elements panel, true nested containers, and a **Content / Style / Advanced** tabbed inspector with a full styling control library — while keeping the single-renderer, JSON-in-`Page.blocks` architecture that already works.

## 2. Scope

This spec covers **Sub-project A (Live Editor Core)** only. It is the foundation for the wider roadmap agreed with the client:

| # | Sub-project | Depends on |
|---|---|---|
| **A** | **Live Editor core** (this spec) | — |
| B | Expanded block library ("match WP" widgets) | A |
| C | Save safety net (autosave, unsaved guard, draft preview, revisions) | A |
| D | Saved sections / patterns | A |
| E | Media upgrade (search, alt-text, multi-upload, optimize) | — |
| F | Onboarding (checklist + tour) | — |
| G | Settings polish (per-page SEO, white-label login, remove "4.9/5", Settings/Customize dedupe) | — |

Each sub-project gets its own spec → plan → implementation cycle. Build order: **A → B → C → D → E → F → G**.

## 3. Decisions locked (from brainstorming)

- **Style depth:** full parity (colors, typography, spacing, background, border/shadow, hover, responsive, motion, custom CSS, z-index).
- **Element catalog:** match WordPress closely (catalog itself is filled in sub-project B; A ships the framework + existing 20 blocks + Layout containers).
- **Nesting:** **true nested containers** — section → column → widget, recursive.
- **Panel layout:** **left elements panel + right Content/Style/Advanced inspector**, canvas centered.

## 4. Data model — recursive node tree

`Page.blocks` (a `Json` column) goes from a flat array to a recursive tree. No DB migration required.

```ts
type Responsive<T> = T | { base?: T; tablet?: T; mobile?: T };

type Node = {
  id: string;
  type: string;                         // "container" | "columns" | "column" | "heading" | "image" | …
  props: Record<string, unknown>;       // Content tab — existing block fields, unchanged
  style?: Record<string, unknown>;      // Style tab values
  advanced?: Record<string, unknown>;   // Advanced tab values
  children?: Node[];                    // container-type nodes only
};
type PageTree = Node[];
```

- **Breakpoints:** `base` (desktop, default), `tablet` (≤1024px), `mobile` (≤767px).
- **Backward compatible:** `style`, `advanced`, `children` are all optional. An old flat block is already a valid childless `Node`.

## 5. Style / Advanced engine — the universal wrapper

Every node renders inside a wrapper element carrying a stable class `.n-{id}` (mirrors Elementor's `.elementor-element-{id}`). A **pure function** turns a node's `style` + `advanced` into real CSS:

- `nodeCss(node): string` → rules for `.n-{id}`, `.n-{id}:hover`, `@media (max-width:1024px)` and `@media (max-width:767px)` variants, and custom CSS (author writes `selector { … }`, `selector` is substituted with `.n-{id}`).
- `collectCss(tree): string` → walks the tree, concatenates all node CSS → a **single `<style>` block** emitted once. SSR on the public route; recomputed via `useMemo` in the editor.

**Rationale:** inline styles cannot express media queries, `:hover`, or `::before` overlays — all required for parity. A generated, id-scoped stylesheet is the only approach that reaches full parity and works identically server-side and in-editor.

**Security:** the Advanced → Custom CSS field injects admin-authored CSS into the public page. This is the **same trust model already shipped** by the `embed` block and `integrations.headCode`/`footerCode` (admin-only, no public input). No new external-input surface is introduced.

## 6. Inspector — Content / Style / Advanced tabs (right panel)

Selecting a node shows three tabs. With nothing selected, the panel shows Page settings (slug + SEO), as today.

| Tab | Scope | Controls |
|---|---|---|
| **Content** | per-block | Existing `FieldsRenderer` over the block's `fields`. Unchanged — now inside a tab. |
| **Style** | universal wrapper + per-block extras | Background (color / gradient / image + overlay), Typography (family incl. **Gilroy**, size, weight, line-height, letter-spacing, transform, align, color), Border (per-side width/style/color, per-corner radius), Box-shadow, Sizing (width / max-width / min-height / self-align), **Hover** sub-state + transition. A block may declare extra style controls (e.g. Button color, Hero overlay). |
| **Advanced** | universal | Margin & Padding (4-side, responsive, unit-aware), Position (default / absolute / fixed + offsets), Z-index, Responsive visibility (hide on desktop / tablet / mobile), Motion (entrance animation + duration + delay), CSS ID, CSS classes, Custom CSS. |

- **Control library (new components):** `ColorControl` (swatch + hex + alpha, seeded with the design-token palette — gold `#a87f3f`, ink/bone/surface neutrals), `DimensionControl` (4-side linked/unlinked box + unit px/em/rem/%), `SliderControl`, `SelectControl`, `ButtonGroupControl` (segmented icon groups e.g. alignment), `TypographyControl`, `BackgroundControl`, `BorderControl`, `BoxShadowControl`, `AnimationControl`, `CodeControl` (custom CSS).
- **`ResponsiveField`** wraps any control: device icons switch which breakpoint the control edits; the active breakpoint is driven by the top-bar device toggle.
- Style/Advanced controls are declared as a **`StyleControl` spec** (parallel to `FieldSpec`) rendered by a **`StyleRenderer`** (parallel to `FieldsRenderer`), so the universal set is defined once and per-block extras just append.

## 7. Left elements panel + nesting UX

- Persistent **left panel** with **Elements** and **Structure** (navigator) sections. (Sub-project D adds a **Saved** section here.)
- Elements grouped WordPress-style: **Layout** (Container, Column presets 1–6), **Text**, **Media**, **Widgets**, **Embeds**. A search box filters.
- **Three insertion paths:** drag onto canvas (drops into a container or between siblings with a live insertion line), click-to-insert (into the selected container / at end), and the existing inline **`+`** points remain.
- **Navigator tree:** now essential because click-to-select is ambiguous with nesting. Provides reliable selection + reorder, plus a canvas breadcrumb "select parent" affordance.

**A ships:** the panel framework + Layout containers/columns + the **existing 20 block types remapped into categories**. The larger widget catalog (List, Table, Accordion, Tabs, Counter, Testimonial, Maps, generic oEmbed, …) is **sub-project B**, which registers additional elements into this same panel.

## 8. Editor chrome

- Top bar gains: **device toggle** (desktop / tablet / mobile — resizes the canvas *and* sets the breakpoint the responsive controls edit), **undo / redo** (tree history stack, debounced for inline typing, Ctrl+Z / Ctrl+Shift+Z), and **preview**.
- The recursive canvas keeps inline click-to-edit text and drag-reorder working at every depth.

## 9. Server validation + rendering (kept in lock-step)

- `pageSchema.blocks` in [`lib/actions/pages.ts`](../../../web/src/lib/actions/pages.ts) becomes a **recursive** zod schema (`z.lazy`) accepting `style`, `advanced`, and `children`; **depth-capped** (≈6) and **total-node-capped** (replaces the current flat `.max(60)`).
- `validateFields` still validates `props` per block type; `style` / `advanced` validate against the universal `StyleControl` specs; `children` recurse.
- `BlockRenderer` becomes a recursive **`renderNode`** used by both the public route and the admin canvas (single renderer preserved): wrapper (`.n-{id}` + CSS id/classes) → inner block component → recursed children → plus the collected `<style>`.

## 10. Migration & backward compatibility

- `normalizeTree()` runs on read: assigns missing ids, leaves `props` intact, treats old flat blocks as childless nodes. Existing published pages render byte-identically until edited.
- The public route already tolerates arbitrary `blocks` JSON; new optional fields don't break it.

## 11. Testing (TDD)

Pure logic is tested first, before implementation:

- `nodeCss` / `styleToCss` — correct CSS for base + responsive + hover + custom-CSS cases.
- `normalizeTree` — old flat pages upgrade losslessly.
- Tree ops — insert / move / duplicate / delete at arbitrary depth; depth + count caps enforced.
- Responsive-value resolution — `Responsive<T>` collapses to the right value per breakpoint.

Interaction/component layer gets lighter coverage (selection, tab switching, drag insert smoke tests).

## 12. Implementation phasing (each phase independently shippable)

1. **A1 — Foundation:** `Node` model + `normalizeTree` + recursive renderer + style/advanced CSS engine + recursive server validation. Existing right sidebar keeps working; blocks gain (empty) wrappers.
2. **A2 — Inspector:** Content / Style / Advanced tabs + `StyleControl`/`StyleRenderer` + full control library + `ResponsiveField`.
3. **A3 — Left panel + nesting:** elements panel, drag/click insert, Container/Column node types, navigator tree.
4. **A4 — Chrome:** device preview, undo/redo, preview.

## 13. Risks & mitigations

- **Recursive drag-and-drop is the hardest UX.** Mitigation: ship the navigator tree (A3) as the reliable reorder/selection path so canvas DnD isn't the only way to manage nesting.
- **CSS generation performance on large trees.** Mitigation: `collectCss` memoized on the tree; per-node CSS is cheap string building; no runtime style recalcompute beyond React state.
- **Scope creep from "full parity."** Mitigation: A delivers the *engine + universal control set*; block-specific and long-tail widgets are explicitly sub-project B.
- **Data safety while the model changes.** Mitigation: additive/optional fields only, `normalizeTree` on read, no destructive DB migration.

## 14. Out of scope for A (tracked elsewhere)

Expanded widget catalog (B); autosave/revisions/unsaved-guard (C); saved patterns (D); media upgrade (E); onboarding (F); settings polish (G).
