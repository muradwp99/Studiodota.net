# Largo-direction motion + real content import — design

Date: 2026-07-23 · Branch: `feature/admin-v1-client-ready`
Brief (user): study largo.studio properly — geometric page loading, image/text/element/section
entry animations — and apply that language. Import real projects from `Projects.zip`
(names from folder names), services from `services.docx`, replace About with `Who We Are.docx`
("Who we are" in the menu), enable Services/Gallery/Projects menu links.
**Protected (do not change): Showreel, What clients say (testimonials), The practice
(statement band), Get in touch (home CTA), Footer.**

## 1. What largo.studio actually does (traced from their DOM/CSS)

- **First load**: `body.is-loading` → 3 pulsing dots top-center (`pageLoading-loop`, 2s,
  staggered .3s) → dark `#222` cover (`.PageTransitionBg-bg.is-firstLoading`) → **canvas mask
  drawn from their circle-logo geometry reveals the page** → `body.is-showContents`.
- **Route change**: cover slides up `translateY(100%→0)` 1s `cubic-bezier(.72,.04,.5,1.07)`
  (slight overshoot), dots while loading, geometric reveal of the next page.
- **Text**: line/word mask reveals — `.sentence > .outer(overflow:hidden) > .inner > .text`,
  rise from below, staggered, gated by `is-show`.
- **Images**: `js-imgLoad` curtain — flat panel `scaleX(1→0)` origin right,
  `.9s cubic-bezier(.52,.08,.18,1) .4s`.
- **Scroll**: `js-scrollShow` per-section `is-show`, `js-parallaxWrap` parallax.
- **Ornament**: giant canvas-drawn arcs of the logo geometry floating front + back of content.
- **Project cards**: image + word-masked title + info rows (CATEGORY / LOCATION / TOTAL AREA).
- Signature easings: UI `.37,.16,.12,1` · curtain `.52,.08,.18,1` · panel `.72,.04,.5,1.07`
  · loops `.645,.045,.355,1`.

## 2. Adaptation for Studiodota (Studio Dot A)

New shared motion pieces (all gate on `useReducedMotion`, static fallback):

| Piece | Behavior |
|---|---|
| `Preloader` | Server-rendered ink overlay: concentric gold arc system (SVG stroke-draw, echo of largo's circle geometry) + wordmark line-mask + 3 largo dots. Exits: arcs bloom, overlay wipes up with panel easing. Full ~1.8s on first visit per session (`sessionStorage`), ~0.7s after. Fires `sd:loaded` + sets `html[data-sd-loaded]`. |
| `PageTransition` | Document-level interception of internal link clicks → ink panel wipes up (cover, .45s), `router.push`, on `pathname` change panel continues up to reveal (.65s). Dots pulse while waiting; 4s failsafe reveal. Skips: modified clicks, external/hash/admin links, reduced motion. |
| `ImageReveal` | Curtain wipe (`scaleX 1→0`, origin right, .9s curtain easing) + inner image settle `scale(1.06→1)`, in-view once. Used across inner pages + non-protected home imagery. |
| `LineMask` | largo's exact text pattern: per-line/word overflow-mask rise, .9s UI easing, stagger .055; triggers on view or on `sd:loaded` (hero). Complements existing `SplitReveal` (ghost rise, no mask). |
| CSS | New tokens: `--ease-largo`, `--ease-curtain`, `--ease-panel`; arc ornament utility (`.geo-arcs`) for section backdrops. |

Integration: `(site)/layout.tsx` mounts `Preloader` + `PageTransition`. Hero headline
(HeroScrub) plays LineMask on `sd:loaded`. Non-protected home sections get upgraded reveals
(About manifesto → LineMask; WhyChoose/Process imagery → ImageReveal; Services header → LineMask).
Protected components' code stays byte-identical.

## 3. Content import

### Projects (Projects.zip → `public/projects/<slug>/NN.webp`, ≤1920px webp q80)
- Names come from folder names; `@` normalized to " @ ", `_Location` suffixes become the
  `location` field; `Signle/Single Family Residence` trees deduped (identical files merged).
- 17 published projects with images (62 optimized renders), cover = first image.
- 12 imageless folders imported as **unpublished drafts** so the client can add images and
  publish from the admin (4 × Affordable Housing, Crenshaw, Mixed Use-114, Studio Apartment-158,
  Ball Residence, Lot 08, 4 × Fire Rebuild @ Pacific Palisades).
- Categories: single-family · multifamily · affordable-housing · mixed-use · commercial ·
  office · senior-living. Filter bar derives labels from these.
- Schema: add `Project.gallery Json @default("[]")` (all images per project). Detail page
  renders the gallery grid with curtain reveals; admin ProjectForm gets a gallery editor.
- Old demo projects/gallery items soft-deleted by the import script; `Media` rows upserted
  for every new image so pickers can browse them.
- No fabricated facts: unknown years/locations stay empty and the UI hides empty fields.

### Services (services.docx → `page.services` as five phases)
Pre-Design · Schematic Design · Design Development · Construction Documentation ·
Additional Services — each phase: number, title, blurb (written), and the docx line items
(deduped verbatim list). Page layout: numbered phase rows, giant numerals, line-mask titles,
item lists as ruled two-column rows, alternating curtain images (real renders, e.g. the
office concept-sketch slide for Pre-Design). Mega-menu keeps working (id/title/blurb shape kept).

### Who we are (Who We Are.docx → `page.about` + menu)
- Menu: primary gains **"Who we are" → `/about`** (first position, largo-style); footer
  "About" label renamed. Route stays `/about` (no broken links).
- Page rebuild: giant line-mask title → story (docx paragraphs verbatim) with render imagery →
  **Nubaira quote band** (docx quote, "Meet Nubaira" label) → real stats (Founded 2021, 25+
  projects, 7 sectors) → existing process + CTA patterns.
- `home.about` + `home.featured` also refreshed: the old copy claimed "20+ years / 100+
  projects / 12 countries" (false for a 2021 firm) and featured projects linked to demo slugs
  that will 404 after import. Featured now points at 6 real flagships.

### Menu enable
Remove `HIDDEN_MENU_HREFS` disabling in `Navbar.tsx` (desktop + mobile) — Services/Gallery/
Projects become real links again and their mega panels light up (that code already exists).

## 4. Data flow / consistency

`defaults.ts` stays the single source of truth (fallback rendering + fresh seeds + admin specs
in `pageRegistry.ts` stay in lockstep). A one-off `scripts/import-projects.ts` (tsx) pushes the
same content into the running MySQL: upserts projects/gallery/media + overwrites the affected
block rows (`menus`, `page.about`, `page.services`, `page.projects`, `page.gallery`,
`page.contact`, `home.about`, `home.featured`). Other blocks untouched.

## 5. Risks / choices

- Preloader covers LCP — kept short and session-gated, largo does the same; reduced-motion
  users get a fast fade.
- Route transitions via click interception (App Router has no exit hooks) — failsafe timer
  guarantees reveal; modified/external clicks pass through untouched.
- `office-san-diego` images are presentation slides (concept/text) — kept, cover chosen as the
  cleanest render ("FRONT VIEW"); slides read as process material in the detail gallery.
- `rollaway-6663` comes from a loose file (`6663 Rollaway-Stanley.jpg`) rather than a folder —
  imported as its own published project ("6663 Rollaway – Stanley") since it is a distinct house.
