# Studiodota.net — Project Brief & Decision Log

> Single source of truth for all agents. Governed by `AGENTS.md`. Do not silently
> deviate from this brief; if reality conflicts with it, surface the conflict.

Last updated: 2026-07-14

---

## 1. What we are building
A marketing + portfolio website for **Studiodota** — an **architectural 3D-rendering /
CGI studio**. Cinematic, luxury, technically credible. Two home-page variants share
the same body; only the hero differs.

## 2. Confirmed stack
| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js** (App Router, TypeScript) | React Server Components where sensible |
| CMS | **Strapi v5** (headless) | Content-Type Builder, Draft & Publish, REST + GraphQL |
| Database | **MySQL** (8.x) / MariaDB | Strapi officially supports it |
| Animation | **GSAP + ScrollTrigger** | Hero + section scroll reveals |
| 3D hero technique | **Pre-rendered image-sequence scrub** | NOT live WebGL. Frames scrubbed on scroll. |
| Language | **English only** | No i18n layer required |

## 3. Home hero variants
- **Home 1 (`/`)** — hero is a GSAP ScrollTrigger-driven **image-sequence scrub** of a
  3D architectural scene (cinematic, à la Loft Thirty One).
- **Home 2 (`/home-2`)** — identical page layout, but the hero background is a
  **looping video** only. No scrub.

## 4. Sitemap
- `/` — Home 1 (3D scrub hero)
- `/home-2` — Home 2 (video hero)
- `/projects` — Projects / Portfolio (gallery) + `/projects/[slug]` case-study detail
- `/services` — Services
- `/about` — About / Studio
- `/journal` — Journal / Blog + `/journal/[slug]`
- `/contact` — Contact (form)

## 5. Navigation
- Sticky top nav. Any item with sub-sections opens a **mega-menu**:
  **glassmorphism** surface, **smooth open/close animation**.
- Candidate mega-menu parents: Projects (by category/type), Services (by offering).

## 6. Color palette — "Atelier Noir + blueprint accent"
Base = Atelier Noir. Blueprint blue is reserved for the technical wireframe/annotation
section only.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0B0B0C` | Page background (near-black) |
| `--surface` | `#17171B` | Cards / raised surfaces |
| `--muted` | `#8A8578` | Muted text, captions, warm gray |
| `--bone` | `#EDEAE3` | Primary text on dark |
| `--gold` | `#C9A96A` | Primary accent (CTAs, highlights) — champagne |
| `--blueprint` | `#4EA1FF` | Secondary accent — technical/wireframe section ONLY |

Typography direction: elegant serif display (logo/headlines) + clean sans body;
monospaced labels for the technical/blueprint section. Final pairing set by UI/UX.

## 7. Design references (evidence, browsed 2026-07-14)
- **loftthirtyone.com** — hero mood: % preloader → full-bleed cinematic aerial render,
  centered serif monogram, "START HERE" enter-gate. Dark luxury minimal.
- **findrealestate.com** — content placement + scroll: giant headline; on scroll an
  architectural render rises and **clip-masks a wordmark** (image-filled text). Section
  flow: Why → Mission → 3-step → Testimonials → Services.
- **vaulk.com** — uniqueness: photoreal render hero → scroll transitions into an animated
  **technical wireframe/blueprint** with monospaced annotation callouts + sticky
  left section-nav.

## 8. Open dependencies / risks
- **Hero 3D image-sequence frames** — source assets not yet provided. BLOCKS Home 1 hero
  final polish. Placeholder frames acceptable for build; real frames swapped later.
- **Home 2 hero video** — source video not yet provided. Placeholder acceptable for build.
- **Brand logo / final font licenses** — to be designed in Figma (user: "design better in figma").
- Figma writes only work in the **Dependopolis 2** team (only Full seat).

## 9b. RESOLVED DECISIONS — critique iteration 1 (2026-07-14)
These are ORCHESTRATOR rulings that resolve the Critic's blockers. They are now
authoritative; every artifact must be edited to match exactly. No re-litigation.

- **R1 Project ordering** — add a scalar `Project.order` (integer, nullable, default null).
  `/projects` sorts `order:asc` then `publishedAt:desc`. API + DATA-MODEL both reflect this.
- **R2 Contact = persist + email.** Add `ContactSubmission` (name, email, message,
  company?, projectType?, status enum new|read|archived, ipHash, userAgent, createdAt).
  `/api/contact` writes via a server-only Strapi token AND sends email. Retention: auto-purge
  after 180 days. Add a required **consent checkbox** ("I agree to the privacy policy") and a
  **`/privacy` Privacy Policy page**. API's "no persistence" statement is now void.
- **R3 No tags.** Remove the `Tag` type, `posts_tags_lnk`, and all tag citations/indexes.
  Post fields: title, slug, excerpt, body, coverImage, author?, publishedAt, readingTime, seo.
- **R4 `/home-2` SEO** — `robots: noindex, follow` + `<link rel=canonical href="/">`.
  Excluded from nav and from `sitemap.xml`. Uses its own poster/video fields (below).
- **R5 Canonical hero fields (Home singleton):** `heroFrameManifestUrl` (string→JSON manifest),
  `heroPosterH1` (media, Home 1 LCP), `heroVideoUrl` + `heroPosterH2` (media, Home 2). TWO posters.
- **R6 LCP budget** — hero poster ≤ **60KB** (AVIF/WebP), `next/image`, explicit dims, `priority`
  preload. Scrub frames: desktop ≤120 @ ≤1440px, mobile ≤48 @ ≤720px, AVIF/WebP. The LRU
  sliding-window decode is **MANDATORY** above 40 buffered frames — never decode-all.
- **R7 Preloader** — never the only door. Show poster immediately; enter enabled at
  min(25% buffered, **4s timeout**). Partial/stalled frames → enter on poster, enhance as frames
  arrive; if scrub can't run, static poster + scrub disabled.
- **R8 Contact status codes** — oversize message → **422** (field-level), cap 5000 chars
  client+server. Drop 413. **JSON only** — remove the urlencoded/no-JS path.
- **R9 Company cap** — **120** chars, client + server.
- **R10 readingTime** — include in `PostCard` and `Post` DTOs; computed server-side on save.
- **R11 Navigation = DERIVED** from Category + Service taxonomies (v1). Remove the editable
  `Navigation` single type. Mega-menu groups = Categories (Projects) and Services (offerings).
- **R12 Filter param** — `?category=<slug>` everywhere. Remove `?cat=`.
- **R13** — add `hero.h1.poster.alt` copy (Home-1 poster is the LCP image).
- **R14 Blueprint section fields (Home singleton):** `wireframeEyebrow`, `wireframeHeading`,
  `wireframeBody`, `wireframeAnnotations[]` (label + description), `wireframeCaption`. Copy matches.
- **R15 Placeholder taxonomy** (pending real values from user, Q-8): Categories = Exterior,
  Interior, Aerial/Masterplan, Animation. Services = Exterior CGI, Interior CGI, 3D Animation,
  Virtual Tours, Masterplans. Seed as placeholders; clearly marked.

Updated sitemap adds: `/privacy` (Privacy Policy). `/home-2` stays noindex.

## 9c. MODEL ROUTING — build phase (decided 2026-07-14)
Overrides the AGENTS.md default table where noted. Applied via per-agent `model` overrides.
- **UI/UX Designer** → **frontier (Opus)** — upgraded from Sonnet (design-led site; craft matters
  most here). Optional: run as a 2-model panel (Opus + Fable) → judge & synthesize if user opts in.
- **Frontend** → **frontier (Opus)** — whole FE, incl. the canvas image-sequence scrub hero + GSAP.
- **Backend** → **Sonnet** — conventional Strapi v5 + MySQL; correctness guarded by the review loop.
- Orchestrator / Architect / Security Reviewer / Critic → **Opus** (per AGENTS.md).
- API Designer / DB / QA / Code Reviewer / A11y / SEO-Perf / Content / DevOps → **Sonnet**.
- Mechanical (formatting, boilerplate, renames) → **Haiku**.
Rationale: the meaningful jump is Sonnet→frontier; spend it on UI/UX + FE, not on standard CRUD.

## 9. Assumptions (correct these if wrong)
- Single-tenant marketing site (no multi-tenant SaaS, no auth-gated app, no payments).
- Contact form emails the studio; no account system.
- Hosting target not yet specified (assume Vercel for Next.js + a Node host / container
  for Strapi + managed MySQL until told otherwise).
