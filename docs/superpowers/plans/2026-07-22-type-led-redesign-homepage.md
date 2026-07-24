# Type-Led Redesign — Homepage Slice — Implementation Plan

> Executed INLINE by the controller in the same session (per user instruction: no subagents).
> This plan is the execution record: exact files, order, key constants, acceptance criteria.
> Design detail lives in the spec: `docs/superpowers/specs/2026-07-22-type-led-redesign-design.md`.

**Goal:** Convert the homepage's About / Featured / Services-head / Final-CTA to LARGO-style text-led sections with GSAP word reveals and a Three.js ambient geometry layer — presentation-only (all sections keep reading their existing CMS blocks).

**Branch:** `feature/admin-v1-client-ready` · **Stack additions:** none (gsap, three, @react-three/fiber, @react-three/drei already installed).

## Key constants (from the trace, tuned for Archivo)

- `.display-2xl`: `clamp(3.4rem, 12.5vw, 12rem)` · lh `0.82` · ls `-0.055em` · weight 500
- `.display-index`: `clamp(2.2rem, 7.5vw, 7.5rem)` · lh `0.95` · ls `-0.045em` · weight 500
- Reveal: per-word ghost-rise `y: 1.1em → 0`, `opacity 0 → 1`, stagger `0.06s`, `expo.out`, `0.9s`, once, trigger at `top 80%`
- Drift: scroll-linked `y: ±6%`, scrub 1
- GeometryField: line color `#a87f3f` @ opacity ≤ 0.25 (dark bands), DPR cap 1.5, rotation ≤ 0.05 rad/s, paused off-screen + reduced-motion static

## Tasks

1. **Foundation** — `globals.css`: add `.display-2xl`, `.display-index` (+ hover-roll utility for the giant CTA link). New `components/SplitReveal.tsx`: server-renders the words split (deterministic, hydration-safe), GSAP+ScrollTrigger ghost-rise on mount, `useReducedMotion` → static, cleanup on unmount. Gate: tsc + words render identically without JS.
2. **About → manifesto** — `home/Sections.tsx` About statement becomes `.display-2xl` + `SplitReveal`; body copy column beneath. Same `home.about` block data.
3. **Featured → typographic project index** — new `components/home/ProjectIndex.tsx`: rows of project NAME (`.display-index`) + meta line (category · location · year from the existing `home.featured` items / projects data); border-t rules between rows; hover = cursor-following image card (GSAP `quickTo`, image from the item's existing image field), touch/no-hover = small inline thumbnail; row links to the project. Replaces the drift-rows presentation inside `Featured` (data + admin editing unchanged).
4. **Services rows + giant CTA + kinetic band** — service names as `.display-index` list rows above the existing slider; FinalCTA headline becomes one giant interactive "Start a project" line (~11vw) with hover roll; one marquee word-band divider (LIVING — PLAYING — WORKING) scroll-scrubbed.
5. **GeometryField (three.js)** — `components/GeometryField.tsx` (R3F wireframe lattice: plan-grid LineSegments + node points, fog) + `next/dynamic` client wrapper; mounted as the background layer of the Showreel dark band and the Final CTA band. Guards: lazy, DPR ≤ 1.5, IntersectionObserver pause, reduced-motion static frame.
6. **Verify + ship** — `npx tsc --noEmit`, lint changed files, `npm run build` (DB running); clean-restart browser pass: desktop 1440 + 390px (type scale, index rows, hover card, marquee, canvas), reduced-motion emulation (static), console clean; measure new sizes via JS. Commits per task; handoff + ledger updates.

## Acceptance

- Homepage sections About/Featured/Services/CTA read as text-first at rest (no image cards in Featured's initial view); photography appears on hover/intent.
- All copy still editable from the admin (blocks unchanged, seed untouched).
- Reduced-motion users get static, complete content. No hydration warnings; build clean; no new lint errors; homepage LCP not regressed by three.js (lazy, below-fold).
