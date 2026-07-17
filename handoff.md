# Studiodota.net — Session Handoff

> Read this first to continue work in a fresh session. Full detail also in
> `docs/PROJECT-BRIEF.md` and `docs/BUILD-NOTES.md`. Memory: `MEMORY.md` +
> `studiodota-project.md` (auto-loaded).

## What this is
Marketing/portfolio website for **Studiodota — a real architecture & design practice**
(NOT a 3D-rendering studio; that was an earlier concept, repositioned to real architecture
— content only was swapped, design kept). Live in `web/`.

## Repo / Git
- Root: `D:\Studiodota.net` (git). App: `web/`.
- Remote `origin` → `https://github.com/muradwp99/Studiodota.net` , branch `master`.
- Last push: commit `e82f7b1` "Build Studiodota architecture & design studio site" — everything is pushed.
- Root `.gitignore` excludes `.claude/`, `.agents/`, `node_modules/`, `.next/`.

## Run / build
```
cd web
npm run dev      # http://localhost:3000  (Next 16 + Turbopack)
npm run build    # currently CLEAN — all 20 routes compile
```
Dev-server note: only run one instance; a 2nd `npm run dev` exits on a duplicate guard.
Verify visually via the in-app browser (mcp__Claude_Browser__*). The homepage has no WebGL
now, so screenshots work; use JS `window.scrollTo` or the `computer` scroll (max scroll_amount 10).

## Stack
Next.js 16 (App Router, TS, Turbopack) · React 19 · Tailwind v4 · Framer Motion · GSAP + ScrollTrigger · Lenis · Poppins (next/font/google, on `--font-gilroy` var) · Geist Mono (small mono).

## Design system (light theme is primary; dark via toggle)
Tokens in `web/src/app/globals.css` `:root` (light) + `:root[data-theme="dark"]`:
- Surfaces: `--ink #f4f3ef`, `--ink-2 #eae8e1`, `--surface #fff`, `--surface-2 #f0eee7`
- Text: `--bone #17191c`, `--bone-dim #545a62`, `--muted #6b7178`
- Accent: `--gold #a87f3f` (fills), `--gold-ink #856428` (readable accent TEXT), `--gold-hi`, `--gold-media #e6cb92` (accent text OVER dark images)
- `--on-media`/`--on-media-dim` = light text over dark imagery
- Glass: `--glass-bg`/`--glass-border`; `--watermark`
- Gradient utils: `.grad-warm .grad-soft .grad-mesh .grad-text .grad-text-media .btn-grad .card-grad`
- Patterns: `.pattern-grid .pattern-dots`
- Fonts/display: `.display-xl/-l/-m`, `.eyebrow`, `.btn/.btn-primary/.btn-ghost`, `.reveal`, `.marquee-*`
Theme toggle: `Navbar.tsx` sets `document.documentElement.dataset.theme` + localStorage.

## File map (key)
- `web/src/app/layout.tsx` — root layout, metadata (architecture), fonts, Navbar/Footer/SmoothScroll/ScrollProgress/grain
- `web/src/app/page.tsx` — Home = `<Hero/> + <Sections/>`
- `web/src/app/home-2/page.tsx` — video-hero variant, **noindex** (⚠ still uses OLD `HomeSections` + rendering-era copy; not in nav)
- `web/src/components/Navbar.tsx` — floating glass pill; hover mega-menus (Services / Gallery[video+photos] / Projects) + Blog + Contact + theme toggle + Get Started
- `web/src/components/Footer.tsx` — Arvon-style footer, watermark, architecture services
- `web/src/components/home/Hero.tsx` — slider hero, gradient "Studio" wordmark, bronze-gradient Show Portfolio
- `web/src/components/home/Sections.tsx` — ALL homepage sections (About+CountUp, Services[gradient cards, alternating], WhyChoose, Featured "Inside/Outside" + vertical Living/Playing/Working buttons + filter, Showreel[scroll-driven focus + play modal], Process[click→image+overlay, arrow], Timeline[scroll-driven, gradient rail], Testimonials, Clients[dual marquee], FAQ[smooth], Journals[featured + 3-grid], FinalCTA[form])
- `web/src/components/Reveal.tsx` — Framer Motion whileInView reveal (dir: up/right/left)
- `web/src/content/site.ts` — content layer (architecture services/projects/process/posts/testimonials/serviceOptions)
- Inner pages: `web/src/app/{about,services,projects,projects/[slug],journal,journal/[slug],contact,privacy}/page.tsx` (+ `PageHeader.tsx`, `ProjectCard.tsx`, `ContactForm.tsx`)
- Real renders (8, Magnific/Seedream): `web/public/media/renders/*.jpg` (named by project slug + hero/interior)
- Dead/unused: `web/src/components/hero/Hero3D.tsx` + `HomeHero.tsx` (old 3D hero — safe to delete) and old `web/src/components/HomeSections.tsx` (only home-2 uses it)
- Client references (design targets): `Homepage_ref/*` (14 section images)

## REVIEW (inline — the multi-agent workflow was interrupted before finishing; re-run below)
Verdict: **ship-able; a few P1 accessibility items to fix.** Prioritized:
- **P1 A11y — mega-menu is hover-only.** Services/Gallery/Projects panels open on mouse hover; no keyboard/focus/click open → keyboard & touch users can't reach them. Add button `onClick`/focus handling + Esc close in `Navbar.tsx`.
- **P1 A11y — nested interactive in Showreel.** The play "▶" is a `<span onClick>` inside a `<button>` (invalid nesting). Make the card a `<div>`/link and play a real `<button>`, or restructure.
- **P1 A11y — reduced motion.** `Reveal` (Framer) + scroll-driven Showreel/Timeline don't honor `prefers-reduced-motion`. Gate animations.
- **P2 Contrast — remaining small gold text.** A few decorative `text-[var(--gold)]` small uses (service numbers, active Featured tab, "Explore the gallery" link, timeline accent word) sit ~3.7:1 on light. Switch small ones to `--gold-ink`. (Buttons/eyebrows/muted already fixed.)
- **P2 — `/home-2` stale.** Uses old HomeSections + "3D rendering" copy + removed `.bezel/.clip-word` reliance. Update to new Sections or delete the route.
- **P2 — dead code.** Delete `components/hero/Hero3D.tsx`, `HomeHero.tsx`, old `HomeSections.tsx` once home-2 is handled.
- **P2 Perf — multiple window scroll listeners** (Lenis, ScrollProgress, Showreel, Timeline). Fine, but could consolidate; verify smoothness on low-end.
- **P2 SEO** — add `sitemap.xml`/`robots`, per-page OG images; `/` could use a distinct meta description.
- **Feel-tuning (subjective)** — Showreel section is `reel.length*40vh` (~200vh) and Timeline `*42vh`; test scroll length/pacing live and adjust the multipliers.
- To run the real multi-agent review fresh: relaunch the Workflow named intent "studiodota-final-review" (script at `.../workflows/scripts/studiodota-final-review-wf_63bef2ed-020.js`) — but since the conversation is being cleared, simplest is to ask the new session to "run a multi-agent review of web/src homepage (code, a11y, seo/perf, design + critic)".

## Known placeholders / not-done
- Contact form + FinalCTA form are front-end only (simulated submit) — no `/api/contact`/email/backend.
- Showreel + Gallery-mega "videos" use a render as poster; no real `.mp4` (drop one at `web/public/media/hero-loop.mp4`).
- No Strapi/MySQL backend yet (content is the typed `site.ts` layer). Backend was the originally-planned next phase (see docs/PROJECT-BRIEF.md).
- Portraits (testimonials/why-choose/journal author) use initials avatars, not photos (deliberate — no fake stock faces).

## Suggested next steps (pick up here)
1. Fix the P1 a11y items (mega-menu keyboard, showreel button, reduced-motion).
2. Sweep remaining small `text-[var(--gold)]` → `--gold-ink`; re-verify contrast.
3. Update or delete `/home-2`; delete dead 3D-hero files.
4. Live feel-tune Showreel/Timeline scroll pacing.
5. (Bigger) Wire the Strapi v5 + MySQL backend + `/api/contact` per docs/PROJECT-BRIEF.md.

## Connectors
Magnific MCP (image gen) is authed at user scope — generate in the Magnific app under unlimited (0 credits), pull via `creations_search`/`creations_get`. Figma connector needs interactive auth. Writes to Figma only work in the "Dependopolis 2" team.
