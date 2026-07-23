# Type-Led Redesign ("LARGO direction") — trace + design

**Date:** 2026-07-22
**Branch:** `feature/admin-v1-client-ready`
**Status:** Design (trace complete; awaiting direction approval before implementation plan)
**Client brief (via email):** *"I shared this so you can see how they use large text in some places. I want to highlight text/wording in some places rather than relying on images."* Reference: https://largo.studio/

---

## Part 1 — Reference trace: largo.studio (measured in-browser, 2026-07-22)

LARGO Inc. — Japanese spatial/interior design studio (adjacent domain to Studiodota).

### Typography (the core of the look)

| Role | Desktop size | Mobile size | Line-height | Tracking | Font |
|---|---|---|---|---|---|
| Statement / manifesto | **186–189px (≈13vw)** | 60–68px (≈15–17vw) | **0.77–1.0** | **−7% (−0.07em)** | TTNorms-Medium (neutral grotesque, Latin) |
| Section display ("For customers, with customers.") | 141px (9.8vw) | ~60px | 0.73 | −7% | TTNorms-Medium |
| **Project names in the index** | 110px (7.6vw) | ~36px | 0.91 | −7% | TTNorms-Medium |
| Giant link ("All projects") | 172px (11.9vw) | — | 1.0 | −7% | TTNorms-Medium |
| Body | ~14–16px | — | normal | 0 | CezannePro / Hiragino (Japanese) |

Key ratios: display text is **10–13× body size**; weight stays *Medium* (400–500), never bold —
scale + tightness carry the impact, not weight. Latin display + local-language body pairing.

### Structure (what replaces imagery)

Hero statement ("A space to host tomorrow's episode.") → manifesto section ("Way of Thinking", ~180
words of body copy under a 13vw title) → About one-liner → Workflow → **projects index as a giant
typographic LIST**: each project = its NAME at 110px + a small meta row (CATEGORY · LOCATION · TOTAL
AREA). No image cards in the flow — imagery appears on interaction. One ambient `<video>` (about.mp4)
is the only large media at rest.

### Motion system (traced mechanics)

- **Split-word reveal:** every display line is split into `span.word` / `span.text` (inline-block).
  Hidden state = `opacity:0; translateY(+200px)` — **no clip mask** (overflow visible; words rise as
  ghosts with very large travel). Per-property 0.3s transitions; in-curve
  `cubic-bezier(0.55, 0.055, 0.675, 0.19)`; staggered per word. Triggered on section enter.
- **Scroll vocabulary: 312 bound elements** — 178 × `js-parallaxType-cssTrigger` (enter-viewport
  state flips) + 134 × untyped `js-parallax` (continuous scroll-linked drift). Custom engine (no
  global GSAP/Lenis exposed; all bundled). **No position:sticky, no horizontal-scroll sections.**
- **Canvas "logo module" (their geometric signature):** four full-viewport **2D canvases** —
  `logoModuleBack` (animated brand geometry as the page BACKGROUND layer), `logoModuleBackMenu`
  (same in the fullscreen menu), `logoModuleFront` + `PageTransitionBg-mask` (canvas-masked page
  transitions built from the logo motif). **No Three.js / WebGL anywhere.**
- **Geometry elsewhere:** minimal — 7 SVGs (6 paths, 6 lines: logo/arrows/rules). The "geometric
  pattern" of the site IS the logo module + thin rules + the huge glyphs themselves.
- Preloader (dot loop) gates the first reveal choreography. Header is `position:relative` (not
  sticky); navigation lives in a fullscreen overlay menu.

### What to take vs. leave

**Take:** the type scale + tightness; text-as-hero sections; the typographic project index with
meta rows; ghost-rise word reveals; an ambient geometric background layer; restraint (few images at
rest, imagery on interaction).
**Leave/adapt:** Japanese body pairing (keep Studiodota's Archivo/Geist system); their 2D-canvas
logo module (Studiodota's equivalent will be a Three.js geometry field — see below); full-page
canvas transitions (out of scope for this slice).

---

## Part 2 — Design: Studiodota "Type-Led" slice (GSAP + Three.js)

Client wants text/wording highlighted **in some places** — a rebalance, not an image purge. The
scroll-scrub hero, project photography, and gallery remain; selected sections convert to type-led.

### 2.1 Type system (tokens in `globals.css`)

- `.display-2xl` — `font-size: clamp(3.4rem, 12.5vw, 12rem)`; `line-height: 0.82`;
  `letter-spacing: -0.055em` (Archivo tightens well at −5…−6%; −7% is too crashy for its shapes —
  final value tuned in browser); balances via `text-wrap: balance`.
- `.display-index` — project-index size: `clamp(2.2rem, 7.5vw, 7.5rem)`, lh 0.95, ls −0.045em.
- Existing `.display-xl/-l/-m` stay for inner pages; statement sections upgrade to the new tokens.
- Mobile floor keeps ≈15vw feel (the clamp minimums are tuned per token, checked at 390px).

### 2.2 Motion primitives (GSAP — already installed; Lenis-safe like HeroScrub)

- **`SplitReveal`** (new, replaces ad-hoc `Reveal` in converted sections): splits into words
  (`Intl.Segmenter`-safe simple splitter — no paid SplitText plugin), per-word ghost-rise
  (`y: 1.1em → 0`, `opacity 0 → 1`, stagger ~0.06s, expo.out ~0.9s) on ScrollTrigger enter, once.
  `prefers-reduced-motion` → render static. Used for every converted display block.
- **`DriftLayer`** helper: tiny continuous scroll-linked y-drift (±4–8%) for eyebrow/meta elements
  (the "134 parallax drifters" feel), via one shared ScrollTrigger scrub.
- **Kinetic word-band**: one oversized marquee band ("LIVING — PLAYING — WORKING —") as a section
  divider, GSAP horizontal scrub tied to scroll velocity (replaces one image transition).

### 2.3 Sections converted to text-led (homepage first)

1. **About statement** → 12.5vw manifesto with `SplitReveal` (copy already CMS-editable via
   `home.about`); body column beneath, LARGO-style.
2. **Featured projects strip** → **typographic project index**: each project = NAME in
   `.display-index` + meta row (CATEGORY · LOCATION · YEAR — data already in `home.featured` /
   projects table). **Hover/touch reveals a cursor-following image card** (GSAP quickTo) so
   photography appears on intent, honoring "not relying on images". Falls back to a static
   thumbnail column on touch devices.
3. **Services section heading row** → giant service names as list rows (existing slider stays below
   as the detail carousel; the type rows become the primary read).
4. **Final CTA** → one giant interactive line — "Start a project →" at ~11vw with hover roll
   (text-hover), form below unchanged.
5. Statement band (`ImageMaskText`) stays — already on-brand for this direction.

### 2.4 Three.js geometry field (the "geometric patterns" ask, adapted)

LARGO's ambient layer is its 2D logo module; Studiodota's equivalent — an architectural
**`GeometryField`** (R3F — `three`/`@react-three/fiber`/`drei` already in package.json):

- A thin-line **wireframe lattice/plan-grid** (lines + node points, subtle depth fog) rendered in
  brand line-color at low opacity, fixed behind two dark bands (Showreel band + the fullscreen CTA)
  and available to the nav overlay later.
- Motion: slow autonomous drift + scroll-linked rotation (ScrollTrigger progress → rotation.y) +
  gentle pointer parallax. All motion ≤ ~0.05 rad/s — texture, not spectacle.
- Engineering guards: lazy `next/dynamic` import (three enters the bundle only where used), DPR cap
  1.5, pauses when off-viewport (IntersectionObserver) and for `prefers-reduced-motion` (static
  frame), single shared canvas per band. Note: this is the project's first *live* three.js usage
  (Hero3D is dead code — unaffected).

### 2.5 CMS / editability

All converted sections keep reading their existing blocks (`home.about`, `home.featured`,
`home.services`, `home.cta`) — the client keeps editing copy in the admin; **the design change is
presentation-only, no schema changes.** (The deferred live-editor track is untouched.)

### 2.6 Out of scope (this slice)

Canvas/WebGL page transitions; fullscreen overlay nav rebuild; converting inner pages (services/
about follow in a phase 2 once the client approves the homepage direction); replacing the
scroll-scrub hero (kept; a type-led hero variant can be prototyped later if the client asks).

### Verification

`npm run build` + tsc/lint clean; in-browser pass (desktop + 390px, reduced-motion emulation,
Lighthouse perf sanity on the homepage — the GeometryField must not tank LCP/CLS; it mounts
below-fold and lazily). Client sign-off on the homepage before phase 2.
