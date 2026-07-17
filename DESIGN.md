# Design

## Theme

Light-primary ("rich charcoal on warm paper") with a dark theme via toggle. Editorial-architectural: cinematic full-bleed renders, generous space, a single champagne-bronze accent, and a section-adaptive glass navigation whose tint follows the surface behind it.

## Color

Light (`:root`):
- Surfaces — `--ink #f4f3ef`, `--ink-2 #eae8e1`, `--surface #ffffff`, `--surface-2 #f0eee7`
- Text — `--bone #17191c`, `--bone-dim #545a62`, `--muted #6b7178`
- Accent (champagne bronze) — `--gold #a87f3f`, `--gold-hi #8f6c39`, `--gold-ink #856428` (readable accent TEXT on light), `--gold-media #e6cb92` (accent text over dark imagery)
- Over-media — `--on-media #f5f5f3`, `--on-media-dim rgba(245,245,243,.76)`
- Lines — `--line rgba(17,19,21,.1)`, `--line-strong rgba(17,19,21,.18)`
- Glass — `--glass-bg rgba(255,255,255,.84)`, `--glass-border`

Dark (`:root[data-theme="dark"]`): inks → `#111315 / #1b1d20 / #24272b`, text → `#f5f5f3 / #a5abb2`, gold lightens (`#c6a672 / #d6b483 / #d8b877`).

Contrast rule: small accent text uses `--gold-ink` (on light) or `--gold-media` (over dark imagery). Body ≥4.5:1.

## Typography

- Display + body: **Poppins** (`next/font`, exposed on `--font-gilroy`). Mono: **Geist Mono** (small labels, numeric indices).
- Scale: `.display-xl` clamp(2.9→8.75rem, 800), `.display-l` clamp(2.25→4.5rem, 600), `.display-m` clamp(1.55→2.5rem, 600), `.eyebrow` (uppercase 0.72rem, tracked 0.18em, `--gold-ink`), `.lede`.
- Tight display tracking (−0.02 to −0.045em); `text-wrap: balance` on headings where set.

## Components

- **Nav** — floating glass pill, section-adaptive tone (`.nav-shell[data-tone]` driving `--nav-fg/-dim/-accent/-hover-bg/-active-bg`); hover + click + keyboard mega-menus with Esc/focus handling; theme toggle.
- **Buttons** — `.btn` / `.btn-primary` (gold) / `.btn-ghost`; `.btn-grad` (bronze gradient); circular arrow buttons for sliders/steps.
- **Surfaces** — `.card`, `.card-grad` (gradient border), `.bezel`. No nested cards.
- **Motion primitives** — `Parallax` / `ParallaxImage`, `ScrollHighlightText`, `ImageMaskText`, `Reveal` (Framer whileInView), `useReducedMotion`, `useSectionTone`.

## Layout

- `.shell` (max 1440, fluid `--edge` inline padding). `.section` (fluid block padding clamp 5→10rem).
- Full-bleed cinematic sections; sticky / scroll-driven sequences (showreel, timeline, project slider); rounded-top "curtain" transitions between dark and light bands.
- Textures: `.pattern-grid`, `.pattern-dots`. Section gradients: `.grad-warm / -soft / -mesh`.
- Responsive grids without breakpoints: `repeat(auto-fit, minmax(280px, 1fr))`.

## Motion

- **GSAP + ScrollTrigger synced to Lenis** (`SmoothScroll.tsx`, which bails entirely under reduced motion). Framer Motion for reveals / layout.
- Eases: `--ease-lux cubic-bezier(.22,1,.36,1)`, `--ease-out (.16,1,.3,1)`. Ease-out only; no bounce/elastic.
- Vocabulary: parallax cover images, scroll-scrubbed reveals, tonal curtain transitions, image-masked display text, word-by-word scroll highlight, dual marquee.
- **All motion is `prefers-reduced-motion` gated** — SmoothScroll bails, `useReducedMotion` no-ops component animations (with static fallbacks, e.g. Timeline), and a CSS `@media` block disables keyframe animations.
