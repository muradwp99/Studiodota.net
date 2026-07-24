# A2.3 — Responsive controls + device toggle (per-breakpoint styling)

**Date:** 2026-07-21
**Branch:** `feature/admin-v1-client-ready`
**Status:** Design (approved: spec + plan)
**Related:** A1 foundation (`2026-07-19-live-editor-core-design.md`), A2.2 controls, A3.2 nested containers (`2026-07-20-nested-container-core-design.md`)

## Context

The style engine has been responsive since A1: `Responsive<T> = T | {base?, tablet?, mobile?}`,
`resolveResponsive`, and `styleToCss` already emit base rules plus `@media (max-width:1024px)` /
`(max-width:767px)` overrides for every style key. What is missing:

1. **UI** — no way to write per-breakpoint values; every control writes a scalar (base).
2. **Device preview** — no way to see tablet/mobile styling in the editor.
3. **The documented `needsBox` trap** — the box-vs-`display:contents` decision is ONE boolean applied
   as a fixed inline style (`BlockRenderer`), so a box prop set only at mobile would force an empty
   real box at desktop too (the same inconsistency class as the fixed `boxShadow:"none"` bug).
4. **Containers don't stack on phones** — `container` layout (`direction:"row"`) is inline and
   base-only, so a row stays a row at every width.

Two traps drive the architecture:

- **needsBox must become per-breakpoint** — but box-ness is **monotonic** (base values cascade down;
  tablet/mobile only add), so: box at base ⇒ box everywhere (today's behavior, unchanged); otherwise
  emit `display:contents` at base and a media-query `display:revert` from the first breakpoint that
  needs a box. Tractable, small CSS.
- **Media queries respond to the viewport, not a narrowed canvas div.** No iframe (rejected as a large
  editor rebuild): instead, in edit mode each node's CSS is generated **resolved at the toggled
  breakpoint** (flat, no media wrappers). The canvas narrows for visual context; the *styles* are
  correct by construction. Public output unchanged.

## Goals

- Any responsive-enabled control can hold different values per device (desktop=base / tablet / mobile),
  edited via a **device toggle** in the editor header, with an override indicator + clear.
- The editor canvas **previews** the selected device (resolved styles + narrowed width + a "hidden on
  this device" badge for hide-toggles).
- A `container` gets **"Stack on mobile"** (toggle prop, default ON for new containers) → row
  containers become columns below 767px, publicly and in preview.
- The wrapper's `display:contents`/box decision moves **into the generated CSS, per breakpoint**.

## Non-goals (deferred)

- Per-breakpoint container direction/gap/align/justify beyond `stackOnMobile`.
- Responsive `hover.*` (stays base-only), responsive `cssClasses`/`cssId`.
- Custom-CSS per breakpoint (authors write their own media queries; note: those won't activate in the
  narrow-canvas preview — documented limitation).
- Iframe canvas; editable breakpoint values (1024/767 stay fixed).

## Architecture — four units

### Unit 1 — Pure responsive helpers (`web/src/lib/nodes/responsive.ts`, unit-tested)

```ts
type Bp = "base" | "tablet" | "mobile";
resolveAt<T>(v: Responsive<T> | undefined, bp: Bp): T | undefined
  // CASCADED value at a breakpoint: mobile → mobile ?? tablet ?? base; tablet → tablet ?? base; scalars = base.
  // (Contrast resolveResponsive, which reads ONE slot — right for media-query emission, wrong for display.)
readResponsive(bag, key, bp)      // resolveAt over a style/advanced key (for control display)
writeResponsive(bag, key, bp, v)  // base: write scalar (or .base if already an object);
                                  // tablet/mobile: normalize scalar → {base: scalar} FIRST, then set slot
                                  // (naive setAt would destroy the scalar base value)
clearResponsive(bag, key, bp)     // remove one slot; collapse {base: x} back to scalar x
hasOverride(bag, key, bp)         // is a non-base slot explicitly set? (drives the indicator dot)
```

### Unit 2 — Engine (`css.ts`, unit-tested)

- `needsBoxAt(node, bp)` — `needsBox` semantics evaluated with **cascaded** per-bp values (`resolveAt`
  + the existing `hasVal`/`shadowOf` gating). `needsBox` stays (≈ box at any bp) for existing consumers/tests.
- **Container layout moves from inline style into generated CSS.** New `containerCss` branch inside
  `nodeCss`: `display:flex; flex-direction; gap; align-items; justify-content; flex-wrap` from props
  (same `ALIGN`/`JUSTIFY` whitelists), plus `stackOnMobile` → `@media (max-width:767px){ .n-id{flex-direction:column;} }`.
  Rationale: a stylesheet rule cannot beat an inline `flex-direction` without `!important`, so the
  inline `containerFlexStyle` must go. Render-equivalent; verified in-browser.
- **Display rules in CSS** (replaces the inline `display:contents`): for nodes that are not
  `solidBox`/container/children/hover/customCss — if no box at base, emit `.n-id{display:contents}`;
  if a box first appears at tablet (or mobile), add the matching media-query `display:revert`.
- `nodeCss(node, opts?: { preview?: Bp; solidBox?: boolean })`
  - `solidBox` (renderer passes `flexItem`; the editor always passes `true`): suppress display rules —
    a flex item / the editor wrapper must stay a real box. **Without this, the emitted
    `display:contents` would hit the editor wrapper (same `.n-id` class) and break chrome anchoring.**
  - `preview` (editor only): emit ONE flat rule — the per-bp emissions concatenated in cascade order
    (`base [+ tablet [+ mobile]]`; later duplicate declarations win within a block, so no new resolution
    logic), container direction resolved (`stackOnMobile` + mobile → column), NO media wrappers, NO
    hide-* `display:none` (the editor shows a badge instead), custom CSS emitted as-is.

### Unit 3 — Renderer (`BlockRenderer`)

- Wrapper inline style drops entirely (`nodeWrapperStyle`/inline `containerFlexStyle` removed);
  `renderNode` passes `nodeCss(node, { solidBox: flexItem })`. Un-styled childless nodes keep the
  no-wrapper Fragment path — **byte-identical**. Styled/container nodes move inline→CSS —
  **render-equivalent**, browser-verified.
- A bare container (no style) has children → already takes the wrapper path; `nodeCss` now emits its
  flex rules there.

### Unit 4 — Editor

- **Device toggle** (Desktop / Tablet / Mobile) in the `PageBuilder` header; state provided via the
  editor context. Canvas width per device: base = current, tablet = 1024px, mobile = 390px.
- `EditableNode` emits `nodeCss(node, { solidBox: true, preview: device })`; keeps its own real-box
  wrapper (chrome anchoring; unchanged divergence) but **drops its inline `containerFlexStyle`** — the
  emitted preview CSS now carries the container flex, and an inline `flex-direction:row` would defeat
  the preview's `column`. When the node is hidden at the previewed device
  (`hideDesktop/Tablet/Mobile`), render it dimmed with a "Hidden on <device>" badge instead of removing it.
- **StyleRenderer**: responsive-enabled kinds = `color`, `slider`, `dimension`, `buttongroup`. At the
  active device they read via `readResponsive` and write via `writeResponsive`; a dot marks an override
  at the active device, with a clear (✕) calling `clearResponsive`. `text`/`textarea`/`toggle` kinds
  stay base-only (attributes, per-device visibility toggles, custom CSS).
- **Container**: new field `stackOnMobile` (toggle, label "Stack on mobile", default `true` in
  `defaults`; existing saved containers without the key behave as `false` via normal prop fallback —
  acceptable: they predate the feature).

## Data flow

1. Toggle device → context bp changes → every `EditableNode` re-emits preview CSS at that bp; canvas
   narrows; controls re-read at that bp.
2. Edit a slider at Mobile → `writeResponsive` converts `fontSize: 20` → `{base:20, mobile:14}` →
   `updateNode` → preview shows 14 at Mobile, 20 at Desktop; save persists the object; public page
   emits base rule + mobile media query (existing engine path).
3. Container with `stackOnMobile` → public CSS gains the mobile `flex-direction:column` override;
   Mobile preview renders stacked.

## Error handling / edge cases

- `writeResponsive` on a scalar never loses the base value (normalize-first; unit-tested).
- `clearResponsive` removing the last override collapses back to a scalar (keeps bags tidy; no
  `{base: x}` residue).
- Box at base unchanged from today; box first at tablet/mobile → `display:revert` (div reverts to
  block). Monotonicity means no "box at base but not mobile" case exists (base cascades).
- `validateTree`/`sanitizeBag` already accept responsive objects (JSON size cap only). `savePage` zod
  passes bags as `z.record(...unknown)`. No schema change.
- Old pages: no responsive objects, no containers-with-stackOnMobile → emissions identical or
  render-equivalent (the display rules emit exactly the same visibility semantics the inline style had).

## Testing / verification

- **Vitest:** `responsive.test.ts` (resolveAt cascade, write-normalization, clear-collapse, hasOverride);
  `css.test.ts` extensions (needsBoxAt per-bp; display:contents/revert emission incl. monotonic cases;
  container flex + stackOnMobile emission; preview flat mode incl. cascade-order override and
  hide-suppression; solidBox suppression). Guard tests unchanged (no new style keys).
- `tsc` + lint (no NEW errors) + full suite.
- **Agent browser pass** (temp unauth dev-route, clean `.next` restart, delete after): mobile-only
  padding → Desktop preview unchanged / Mobile padded; device toggle swaps control values + dot;
  clear-override collapses; row container + stackOnMobile stacks at Mobile preview; published-page
  check at narrow viewport (real media queries); hidden-badge on hide-mobile.
- **Client spot-check** in the real admin (clean restart first).

## Risks / traps

- **Editor wrapper vs `display:contents` emission** — handled by `solidBox` (see Unit 2). The one place
  this feature could break the editor; unit-tested + browser-verified.
- **Inline style vs media query** — why container flex moves into CSS (no `!important` hacks).
- **Render-equivalence, not byte-identity** for already-styled nodes/containers (inline→CSS move) —
  verified in-browser on the public route; un-styled nodes stay byte-identical (Fragment path).
- **Preview is resolved-flat, not real media queries** — author-written media queries inside Custom CSS
  won't activate in preview (documented; the published page is the source of truth).
- Turbopack wedge: clean restart before browser checks.
