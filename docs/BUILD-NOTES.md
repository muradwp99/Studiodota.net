# Studiodota.net — Build Notes (frontend v1)

Built autonomously 2026-07-14 with full authority. Frontend is complete, runs, and
passes a production build. Backend (Strapi + MySQL) is the next phase.

## How to run
```
cd web
npm run dev      # http://localhost:3000
npm run build    # production build (passes clean)
```

## Stack
- Next.js 16 (App Router, TS, Turbopack) · React 19 · Tailwind v4
- GSAP + ScrollTrigger · Lenis (smooth scroll) · three + @react-three/fiber + drei
- Fonts: Fraunces (display) + Geist Sans/Mono
- Design skills applied: `high-end-visual-design`, `hallmark` (installed under `web/.agents/skills`)

## What was built (all pages)
- `/` Home 1 — **live 3D GSAP scroll hero**: a Three.js architectural cityscape that,
  on scroll, dissolves from solid (photoreal) into a gold **wireframe blueprint** over a
  grid floor as the camera lifts — the Vaulk-style reveal. Verified working in-browser.
- `/home-2` Home 2 — **video hero variant** (`<video>` + cinematic CSS fallback). `noindex` + canonical → `/`.
- `/projects` (+ `?category=` filter) and `/projects/[slug]` detail (SSG)
- `/services` (anchored sections `#exterior` … `#product`)
- `/about`, `/journal` (+ `/journal/[slug]` SSG), `/contact`, `/privacy`
- Glassmorphism **mega-menu** (Work / Services) with smooth open animation + mobile drawer
- Shared premium components: bezel cards, reveal-on-scroll, render placeholders

## Decisions I made for you (autonomous, correct if wrong)
1. **Hero technique changed** from the planned pre-rendered *image-sequence scrub* to a
   **live Three.js (R3F) 3D scene** driven by ScrollTrigger. Why: no rendered frames were
   available, and live 3D delivers real "3D animation" + the blueprint reveal, verified.
   A cinematic gradient base sits behind the canvas so the hero is never blank. It is
   structured so an image-sequence or a real `.glb` model can replace it later.
   ⚠️ Perf: the WebGL canvas is heavier than an image scrub — before launch, review LCP
   and consider gating canvas init behind the poster / reduced-motion.
2. **Content is a typed local layer** (`web/src/content/site.ts`) mirroring the planned
   Strapi content-types, populated with real content adapted from realistic3d.co.
3. **Contact form is front-end only** (validation + states + consent checkbox + gold error
   styling). Simulated submit — not yet wired to `POST /api/contact`, persistence, or email.
4. **Placeholder assets**: project/service visuals are generated CSS/SVG "render" tiles;
   Home 2 video points at `/media/hero-loop.mp4` (drop a real file in `web/public/media/`).

## Reference-alignment pass (2026-07-14)
Re-studied vaulk.com, loftthirtyone.com, findrealestate.com in detail and pulled their
shared signatures into the build:
- **Header** — uppercase, letter-spaced nav links (Loft/Vaulk/Find refined type); edge-aligned; keeps mega-menu + retract-on-scroll glass.
- **Hero** — headline re-anchored **bottom-left** (Loft) over the 3D scene; **"Scroll to explore"** cue (Vaulk); mono **technical callouts** ("Accurate geometry", "True materials", …) fade onto the wireframe during the photoreal→blueprint reveal (Vaulk part-callouts).
- **Global scroll-progress bar** (Loft) — thin gold line, top.
- **Image-filled wordmark band** — giant "STUDIODOTA" with a gold→bronze→ink gradient clipped to the text, "From concept to render" eyebrow + mono capability tags (Find image-filled wordmark / Loft brand moment).
Production build re-verified clean after these changes.

## Real imagery + recolor pass (2026-07-16)
- **Magnific/Seedream-5-Pro renders wired in.** 8 photoreal renders generated in the Magnific
  app (unlimited, 0 credits) and pulled via MCP into `web/public/media/renders/`
  (hero, atelier-house, urban-oasis, leafy-precinct, riverside-warehouse, meridian-sports,
  harbour-masterplan, interior). Now used on: project cards + project detail (hero + framed
  views), services sections, Home 2 hero (real still behind the `<video>`), and a new
  full-bleed cinematic band on Home 1. Placeholder gradient tiles retired.
- **Palette changed** from "Atelier Noir" (champagne gold) to **"Verdigris Noir"** — cool
  near-black base + verdigris-teal accent `#57bda8` + cyan secondary `#6fd0e0`. Updated in
  `globals.css` tokens, hero base gradient, 3D wireframe/grid colours, clip-word gradient,
  and the Home 2 cinematic fallback. Gives a teal-vs-warm cinematic contrast against the
  golden-hour renders. Production build re-verified clean.
- Workflow that beats the credit limit: user generates in the Magnific app (unlimited path),
  Claude pulls via `creations_search`/`creations_get` (read-only, no credits).

## What I did NOT do (next phases)
- Strapi v5 + MySQL backend, content migration, draft/preview, `/api/contact` (persist +
  email + rate-limit + 180-day retention per ruling R2).
- Real hero 3D frames / real Home 2 video / real project photography.
- `sitemap.xml` / `robots`, OG images, analytics.
- The reviewer-agent passes (QA / Security / A11y / SEO / Code Review / Critic) on the
  built code — recommended before launch.
