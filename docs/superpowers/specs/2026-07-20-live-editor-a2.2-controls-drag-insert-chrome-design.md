# Live Editor — A2.2 controls + drag-to-insert + full-screen chrome fix

**Date:** 2026-07-20
**Branch:** `feature/admin-v1-client-ready`
**Status:** Design (approved to write spec + plan)
**Related:** [`2026-07-19-live-editor-core-design.md`](2026-07-19-live-editor-core-design.md) (A1 foundation), [`2026-07-20-live-editor-a2-inspector.md`](../plans/2026-07-20-live-editor-a2-inspector.md) (A2.1 inspector)

## Context

The full-screen Gutenberg-style page editor (`PageBuilder.tsx`) has an A2.1 Content/Style/Advanced
inspector and an A3.1 left elements panel. Three client-reported gaps, bundled here:

1. **Chrome bug** — the full-screen editor (`fixed inset-0 z-50`) is overlapped by the admin top bar
   (`AdminBar`, `sticky top-0 z-[90]`). The editor's own header (Save / ⚙ / ←) is partly hidden behind
   "Howdy, {admin}". The editor is *built* to cover everything (`fixed inset-0`) — it just has too low a
   z-index.
2. **Drag-and-drop "not worked"** — reorder-by-drag-handle exists but is fragile / undiscovered; dragging a
   new block from the left panel onto the canvas was never built (`ElementsPanel.tsx` is click-to-insert only,
   with a `// drag-to-insert comes in a later pass` TODO).
3. **Not enough controls** — client wants "more advanced controlling, styling, and all… more flexible and
   smooth." This is the A2.2 control batch (typography / border / shadow / hover / position / visibility /
   custom CSS).

## Goals

- Editor renders as a true full-screen takeover (nothing from the admin shell bleeds over it).
- A block type can be **dragged from the left panel and dropped between/around existing blocks**, with a live
  drop indicator; existing reorder still works and is more robust.
- The Style/Advanced inspector gains a meaningful first batch of professional controls, each **actually wired
  to the CSS engine** and covered by the existing guard tests.

## Non-goals (explicitly deferred)

- Dropping blocks **into containers** (nested `columns`, recursive drag/select) — separate A3.2 effort.
- **Gradient** background, **background-image** picker, **motion/animation** presets.
- **Per-breakpoint** style controls + device toggle (A2.3) — the handoff flags `needsBox` as a trap there
  (a fixed inline `display:contents` can't express "box only at mobile").
- Keyboard-accessible DnD — native HTML5 DnD is pointer-only; click-insert and move ↑/↓ remain the keyboard
  paths (unchanged).

---

## Part 1 — Full-screen chrome fix

**Change:** `PageBuilder.tsx` root wrapper `z-50` → `z-[100]`.

`AdminBar` is `z-[90]`, its dropdowns `z-[95]`; the sticky `AdminNav` aside is auto z (already covered). `z-[100]`
puts the editor above all admin chrome. This matches Gutenberg (no WP admin bar while editing); the editor's own
`←` returns to `/admin/pages`. No portal or conditional-render surgery.

**Files:** `web/src/components/admin/PageBuilder.tsx` (1 line).
**Verification:** client spot-check — admin bar no longer visible while editing; Save/⚙/← fully clickable.

---

## Part 2 — Drag-and-drop: robust reorder + palette drag-to-insert

### 2a. Pure drop-index helpers (new, tested)

New `web/src/lib/nodes/dnd.ts`:

```ts
export type DropPos = "before" | "after";
// Index to splice a NEW item in at (nothing removed first).
export function insertIndexFor(over: number, pos: DropPos): number;
// Final index for a REORDER (source removed first, so indices after `from` shift left).
export function reorderIndexFor(from: number, over: number, pos: DropPos): number;
```

`insertIndexFor = pos === "before" ? over : over + 1`
`reorderIndexFor = let to = insertIndexFor(over,pos); return from < to ? to - 1 : to;`

New `web/src/lib/nodes/dnd.test.ts` — before/after, drag-down, drag-up, no-op, insert-at-ends. Replaces the
inline math currently in `PageBuilder.handleDrop`.

### 2b. Palette items become draggable

`ElementsPanel.tsx`: each block button gets `draggable`, and on drag start sets a `dataTransfer` payload (so the
drag initiates cross-browser incl. Firefox) **and** reports the type up via a new optional prop:

```ts
onDragType?: (type: string | null) => void   // called (type) on dragstart, (null) on dragend
```

`onInsert` (click) is unchanged — click-insert stays as the primary + keyboard path. Add a `cursor-grab`
affordance. Remove the stale "later pass" comment.

### 2c. PageBuilder wires insert-drag alongside reorder-drag

- New state `dragType: string | null` — the palette type being dragged (`null` during reorder/idle). Sibling of
  the existing `dragIndex`.
- Reorder `onDragStart` also sets `e.dataTransfer.effectAllowed`/`setData` for robustness.
- Per-block `onDragOver` guard widens: fire when `dragIndex !== null || dragType !== null`. It still sets
  `overIndex`/`overPos`. The gold drop-indicator renders for **either** drag kind.
- The **blocks container** and the **empty-page state** become drop targets so a drop released in the gutter /
  on an empty page inserts at the end / at index 0 (dashed "Drop block here" hint shown while `dragType` is set).
- Block `onDrop` calls `e.stopPropagation()` so it doesn't double-fire with the container.
- `handleDrop` branches:
  - `dragType !== null` → `insertAt(insertIndexFor(overIndex ?? end, overPos), dragType)` (reuses existing
    `insertAt`, which builds + selects the new block).
  - else → reorder via `reorderIndexFor(...)` (existing behavior).
  - clears the relevant state either way.

**Files:** `web/src/lib/nodes/dnd.ts` (new), `dnd.test.ts` (new), `ElementsPanel.tsx`, `PageBuilder.tsx`.

### "Not worked" note

The single most common cause of "the editor doesn't work" in this project is a **wedged Turbopack dev cache**
(handoff §CRITICAL GOTCHA) — a stale parse error that contradicts a clean `tsc`. The manual test recipe
therefore starts with a clean restart: kill `:3000`, `rm -rf web/.next`, `npm run dev`. Adding `dataTransfer`
also fixes the class of reorder failures where a drag never initiates.

---

## Part 3 — A2.2 control batch

Every new control obeys the standing contract: **control key ↔ `styleToCss` emission ↔ guard tests** stay in
lockstep. Box-generating keys also go in `needsBox` so the wrapper becomes a real box; inheritable text keys do
not (they pass through `display:contents`, like `color`/`textAlign` today).

### 3a. Renderer additions (small)

`styleControls.ts` `StyleControl` union + `StyleRenderer.tsx`:
- New kind **`toggle`** (checkbox) — for per-device visibility.
- New kind **`textarea`** (multi-line) — for Custom CSS.
- **Dotted keys**: allow `key: "hover.backgroundColor"`. `StyleRenderer` resolves value with
  `getAt(data, key.split("."))` and writes with `onChange(key.split("."), v)`. `buttongroup` covers
  fontWeight / borderStyle / position / textTransform (no new `select` kind needed).

### 3b. Style tab (writes `node.style`)

| Group | Control | key | Engine → CSS | Box? |
|---|---|---|---|---|
| Typography | slider px | `fontSize` | `font-size` | no (inherited) |
| | buttongroup 400/500/600/700 | `fontWeight` | `font-weight` | no |
| | slider (unitless 1–2, step .05) | `lineHeight` | `line-height` | no |
| | slider px (-2…10) | `letterSpacing` | `letter-spacing` | no |
| | buttongroup none/upper/capitalize | `textTransform` | `text-transform` | no |
| Sizing (existing + new) | slider px | `width` | `width` | **yes** |
| Border | slider px | `borderWidth` | → `border-*` | **yes** |
| | buttongroup none/solid/dashed/dotted | `borderStyle` | | **yes** |
| | color | `borderColor` | | **yes** |
| Shadow | buttongroup None/Soft/Medium/Strong | `boxShadow` | `box-shadow` (preset→string map in css.ts) | **yes** |
| Hover | color | `hover.backgroundColor` | `:hover{background-color}` (exists) | **yes** (`s.hover`) |
| | color | `hover.color` | `:hover{color}` (exists) | **yes** |

Border emission: emit `border-width`/`border-color` when set, and `border-style` = `borderStyle` or (if width/
color set but style unset) default `solid`, so a border actually shows.
Hover already emitted by `hoverToCss` — only controls are new; hover stays base-only (not responsive) for now.

### 3c. Advanced tab (writes `node.advanced`)

| Group | Control | key | Engine | Box? |
|---|---|---|---|---|
| Spacing (existing) | dimension | `padding`, `margin` | — | yes |
| Position | buttongroup static/relative/absolute/sticky | `position` | `position` (new emission) | **yes** (`ADV_BOX_KEYS`) |
| Layout & attributes (existing) | slider / text | `zIndex`, `cssClasses`, `cssId` | — | — |
| Visibility | 3× toggle | `hideDesktop`, `hideTablet`, `hideMobile` | already emitted by `hideCss` | — |
| Advanced | textarea | `customCss` | already emitted, **hardened** | yes |

**Custom CSS hardening (required before exposing the control)** — `css.ts` currently does
`custom.replace(/selector/g, sel)` and `BlockRenderer` injects via `dangerouslySetInnerHTML`:
- whole-word replace: `/\bselector\b/g` (don't rewrite `selectorate`, etc.);
- neutralize `</style` (case-insensitive) so authored CSS can't break out of the `<style>` tag.
Admin-only authoring keeps risk low, but this is the handoff-flagged trap and is cheap to close.

### 3d. Engine + guard-test updates

- `css.ts` `styleToCss`: add the responsive-resolved declarations above (font-size/weight, line-height,
  letter-spacing, text-transform, width, border-*, box-shadow, position). All via the existing `r()` resolver so
  they're responsive-ready and consistent.
- `css.ts` `needsBox`: `STYLE_BOX_KEYS` gains `borderWidth`, `borderStyle`, `borderColor` (replacing the unused
  composite `border`); `width`, `boxShadow` already present. `position` already in `ADV_BOX_KEYS`.
- `styleControls.test.ts`: extend `STYLE_KEYS` / `ADV_KEYS` sets with every new key (incl. dotted
  `hover.backgroundColor`, `hover.color`, and `hideDesktop/Tablet/Mobile`, `customCss`).
- `css.test.ts`: add emission assertions (border, shadow, width, typography, position, hardened custom-CSS
  `</style>` + word-boundary), and extend the `needsBox`-sync `styleBoxKeys`/`advBoxKeys` arrays.

**Files:** `styleControls.ts`, `StyleRenderer.tsx`, new `controls/ToggleControl.tsx`, `css.ts`,
`styleControls.test.ts`, `css.test.ts`.

**Typography caveat (documented):** inherited text props apply through the `display:contents` wrapper, but a
block's own type classes (e.g. `display-l` on a Heading) can override `font-size`. Per-element typography
targeting is a later refinement.

---

## Testing & verification

- **Vitest** (pure logic): `dnd.test.ts` (new); extended `css.test.ts` + `styleControls.test.ts`. Target: all
  green, count up from 54.
- **`npx tsc --noEmit`** and **`eslint`** clean.
- **Cannot self-verify the admin UI** — it is `requireAdmin`-gated and logging in is a prohibited action (same
  constraint as every prior session). UI is verified by client spot-check.
- **Client spot-check recipe** (provided on handoff):
  1. Clean restart: kill `:3000`, `rm -rf web/.next`, `npm run dev`.
  2. Chrome: open a page editor → admin bar gone, editor header fully usable.
  3. DnD insert: drag "Heading" from the left panel between two blocks → drops there; drag onto an empty page →
     inserts; drag to the gutter below the last block → appends.
  4. Reorder: drag the `⠿` handle to reorder → still works.
  5. Controls: set border + shadow + hover on a block, Save, View → styles render on the public page; toggle
     "hide on mobile" → block hides < 767px.

## Risks / traps

- **Guard-test lockstep** — adding a control key without engine emission (or vice-versa) fails
  `styleControls.test.ts` / `css.test.ts`. That's the point; update all three together.
- **Custom-CSS injection** — must land with the hardening; do not expose the textarea otherwise.
- **DnD double-drop** — block vs container drop targets; `stopPropagation` on the block `onDrop` prevents it.
- **Turbopack cache** — advise the clean restart; a stale cache can masquerade as "DnD not working."
- **Next 16** — all changes are client React/DOM + pure TS; no Next-16-specific APIs touched.
