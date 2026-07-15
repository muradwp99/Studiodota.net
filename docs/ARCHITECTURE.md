# Studiodota.net — System Architecture

> Role: Software Architect (`AGENTS.md` §2). Design only — **no production code**.
> Sources of truth: `docs/PROJECT-BRIEF.md`, `docs/SRS.md`. Governed by `AGENTS.md`
> GLOBAL CONTRACT. Signatures and pseudocode only; every gap is surfaced under
> §9 ASSUMPTIONS or escalated, never invented.
> Version: 1.1 — 2026-07-14 — applied ORCHESTRATOR rulings R2, R4, R5, R6, R7, R11
> (see `docs/PROJECT-BRIEF.md` §9b). These are authoritative and supersede any earlier hedge.

---

## 0. GOVERNANCE CONFLICT SURFACED (no silent reconciliation — GLOBAL CONTRACT §7)

`AGENTS.md:164-167` mandates the Architect "Design for the multi-tenant case ALWAYS.
Every query, cache key, file path, and background job must be tenant-scoped."

`docs/PROJECT-BRIEF.md:79` and `docs/SRS.md:59-63` (NG-1, NG-2) state this is a
**single-tenant public marketing site with no accounts, no auth on the public surface,
and no tenant data model**.

These two directives conflict. Per GLOBAL CONTRACT §7 I do **not** pick a winner silently.
**Resolution taken, pending Orchestrator confirmation:** I follow the project brief/SRS
(single-tenant) because it is the named source of truth for *this* project, and I treat
the AGENTS.md rule as a house default that this project explicitly overrides. Consequence:
there is exactly one logical tenant. Wherever AGENTS.md would demand a `tenant_id`, this
document substitutes a **global cache-tag namespace** and documents it, so the discipline
(deliberate, named cache keys; scoped invalidation) is preserved even though the tenant
dimension collapses to 1. See §9 A-1. If a second tenant is ever introduced this design
must be revisited (see §7 BLAST RADIUS).

---

## 1. CONTEXT

### What exists today
- `docs/PROJECT-BRIEF.md` — confirmed stack, palette, sitemap, hero variants, open risks.
- `docs/SRS.md` — FR-1…FR-42, AC-1…AC-33, EC-1…EC-8, open questions Q-1…Q-8.
- **No application code, no `package.json`, no Strapi project, no CI.** Verified: the only
  files under `docs/` are the two above (`docs/PROJECT-BRIEF.md`, `docs/SRS.md`); repo root
  is not a git repo. This is greenfield.

### What this document adds
The end-to-end technical design for a two-service system:
1. A **Next.js (App Router, TypeScript)** frontend — the public site (`docs/PROJECT-BRIEF.md:17`).
2. A **Strapi v5** headless CMS on **MySQL 8.x/MariaDB** — the content source
   (`docs/PROJECT-BRIEF.md:16-19`).

It fixes the decisions the SRS deliberately deferred to the Architect (`docs/SRS.md:397-401`
R-1): REST-vs-GraphQL, rendering strategy per route, cache/revalidation, contact-endpoint
shape, media handling, hosting topology, and the two hero architectures.

### Explicitly out of scope for this phase (deferred to named owners)
- Strapi field-level content model DDL → **DB/Data Architect** (AGENTS.md §5). This doc
  defines content-type *boundaries and relations*, not column types.
- The public HTTP contract schemas → **API Designer** (AGENTS.md §4). This doc defines
  *which* endpoints exist and their responsibilities.
- Home body section list → **UI/UX** (`docs/SRS.md:431-433` Q-2).
- Brand assets / fonts → Figma; **Figma MCP is unauthorized in this session** and brand
  production is out of scope (`docs/SRS.md:406-411` R-3).

---

## 2. PROPOSED DESIGN

### 2.1 Component map & boundaries

```
                          ┌─────────────────────────────────────────────┐
        Visitor  ──HTTPS──▶            Vercel Edge / CDN                  │
                          │  (Next.js App Router, RSC, ISR cache, Image   │
                          │   Optimization, Route Handlers)               │
                          └───────┬───────────────────────┬──────────────┘
                                  │ server-side fetch      │ /api/revalidate (webhook sink)
                                  │ (build + ISR + preview) │ /api/contact  (form sink)
                                  ▼                        ▲
                          ┌───────────────────────┐        │ webhook (entry.publish/…)
                          │   Strapi v5 (Node)     │────────┘
                          │  Content API (REST)    │
                          │  Draft & Publish       │
                          │  Upload provider ──────┼──▶ Object storage (S3/R2) ──▶ media CDN
                          │  Email plugin ─────────┼──▶ SMTP / email API
                          └───────────┬────────────┘
                                      ▼
                          ┌───────────────────────┐        ┌──────────────────────┐
                          │   MySQL 8.x / MariaDB  │        │  Rate-limit store      │
                          │   (content, D&P state) │        │  (Vercel KV / Upstash) │
                          └───────────────────────┘        └──────────────────────┘
                                                              (contact abuse control)
                          ┌───────────────────────────────────────────────┐
                          │  Hero frame CDN (image-sequence + poster) +     │
                          │  Home-2 video CDN (mp4/webm + poster)           │
                          └───────────────────────────────────────────────┘
```

### 2.2 Responsibilities

| Component | Owns | Must NOT |
|---|---|---|
| **Next.js app** | Routing, RSC rendering, ISR cache, `<head>`/SEO, all UI state, form UX, hero runtime, image optimization, revalidation sink, contact sink | Hold DB credentials; expose any Strapi write token to the client; render draft content on public (non-preview) routes |
| **Strapi v5** | Content authoring, Draft & Publish, media upload orchestration, publish webhooks, contact-email delivery, **contact-submission persistence** (written only by the Next.js `/api/contact` route via a server-only write token — R2) | Serve the public HTML; be the CDN for hot media; be reachable for writes by **anonymous** users (the contact write is a server-to-server call bearing a scoped token, never a browser call) |
| **MySQL** | Persist content + D&P state + **`ContactSubmission` rows (PII at rest — R2)** | Be queried directly by Next.js (only Strapi talks to it) |
| **Object storage + CDN** | Store & serve editorial media, hero frames, hero video | Be the origin the browser hits without a CDN in front |
| **Rate-limit store** | Atomic counters for contact abuse control (§4.3) | Persist PII |

### 2.3 Strapi ↔ Next.js integration: **REST, not GraphQL** (decision)

Chosen: **Strapi v5 REST Content API**, consumed server-side via a single typed fetch
wrapper, using `populate` + `fields` to shape each response into exactly what a route needs.

Rationale (weighed against GraphQL in §5):
- The read patterns are few, fixed, and page-shaped (one query per route). GraphQL's main
  win — clients composing arbitrary queries — is unused on a server-rendered marketing site.
- REST responses slot directly into Next's `fetch()` cache with `next.tags`/`revalidate`,
  which is the backbone of the revalidation strategy (§2.4). GraphQL POSTs are not cached by
  Next's fetch cache by default and would need manual `unstable_cache` wrapping.
- Strapi v5 REST is first-party and stable; the GraphQL plugin is an extra dependency
  (see §5 for the dependency-cost argument).

**N+1 guard (AGENTS.md:169):** every list/detail read is a *single* REST call with an
explicit `populate` tree; the frontend never loops over a collection issuing a follow-up
request per item. Example: `/projects` fetches cards + cover media + category in one request
via `populate=cover,category&fields=title,slug,...&pagination[pageSize]=…`. Detail pages
fetch the full `populate` tree for one slug in one request. This is enforced by keeping all
Strapi access inside `lib/strapi/queries.ts` (§4.1) — components never call `strapiFetch`
directly, so no ad-hoc per-item fetch can be introduced without a review touching that file.

### 2.4 Rendering strategy per route + cache/revalidation

**Model:** static-first. Every content route is statically generated and served from the
Vercel CDN, then kept fresh by **on-demand tag revalidation driven by Strapi webhooks**,
with a **time-based revalidate as a safety net** if a webhook is missed. This satisfies
G-3 / A-6 ("within 60s of next request", `docs/SRS.md:464-466`): the webhook path is
near-instant; the time-based floor bounds staleness even when the webhook fails.

Cache invalidation strategy is **named tags**, one per content aggregate plus one per
detail entity:

| Tag | Dirtied by | Revalidates |
|---|---|---|
| `home` | Home singleton publish, or any change to featured-projects selection | `/`, `/home-2` |
| `projects` | any Project publish/unpublish/reorder | `/projects` and project cards on home |
| `project:<slug>` | that Project publish/unpublish/edit | `/projects/<slug>` |
| `services` | any Service change | `/services`, Services mega-menu source |
| `about` | About singleton change | `/about` |
| `journal` | any Journal-post publish/unpublish | `/journal` |
| `post:<slug>` | that post's change | `/journal/<slug>` |
| `nav` | project categories / service offerings taxonomy change | nav + mega-menu on every page |

| Route | Strategy | `revalidate` floor | Tags attached to its fetches | Why |
|---|---|---|---|---|
| `/` (Home 1) | **ISR** static shell; hero is a client component | 3600s | `home`, `projects`, `nav` | Content changes rarely; hero runtime is client-side (§3) |
| `/home-2` | **ISR** (same shell) | 3600s | `home`, `projects`, `nav` | Identical body (FR-13). **SEO (R4): emits `robots: noindex, follow` + `<link rel="canonical" href="/">`; excluded from `sitemap.xml` and from nav.** |
| `/projects` | **ISR**, server-paginated | 300s | `projects`, `nav` | Gallery updates when work ships |
| `/projects/[slug]` | **SSG** via `generateStaticParams` + **ISR** for new slugs (`dynamicParams=true`) | 3600s | `project:<slug>`, `nav` | Detail pages are stable; new ones render on first hit |
| `/services` | **ISR** | 3600s | `services`, `nav` | Rare change |
| `/about` | **ISR** | 3600s | `about`, `nav` | Rare change |
| `/journal` | **ISR**, server-paginated | 300s | `journal`, `nav` | New posts appear promptly |
| `/journal/[slug]` | **SSG** + **ISR** for new slugs | 3600s | `post:<slug>`, `nav` | Stable once published |
| `/contact` | **Static** shell + client form | n/a | `nav` | Form is interactive; POST is dynamic (§4.3) |
| `/privacy` | **Static** (or ISR if CMS-authored) | 3600s | `nav` | Privacy Policy — prerequisite for contact PII persistence (R2) |
| Preview `/api/preview` → any route in **draft mode** | **SSR (dynamic, `no-store`)** | none | none (bypasses cache) | Editors must see drafts instantly (§2.5) |
| `/api/revalidate` (webhook sink) | Route Handler, dynamic | n/a | n/a | Receives Strapi webhook, calls `revalidateTag` |
| `/api/contact` (form sink) | Route Handler, dynamic | n/a | n/a | Side-effecting POST |
| 404 (`not-found`) | Static | n/a | n/a | FR-23/FR-29 |

**Cache-stampede / race note (AGENTS.md:168):** ISR under Next uses stale-while-revalidate —
concurrent requests during regeneration are served the stale page while one background
regeneration runs; there is no thundering-herd to Strapi. Concurrent webhook deliveries
calling `revalidateTag` are idempotent (marking a tag stale twice is a no-op). No lock needed.

### 2.5 Draft / Preview architecture

- **Public routes never read drafts.** All public `strapiFetch` calls request published
  content only (Strapi v5 defaults to published; drafts require an explicit
  `status=draft` param **and** an authenticated Strapi API token). This enforces FR-40 /
  AC-31 and EC-4 (`docs/SRS.md:354-357`).
- **Editor preview** uses **Next.js Draft Mode**. Strapi's Preview feature is configured with
  a preview URL `→ /api/preview?secret=<PREVIEW_SECRET>&status=draft&type=project&slug=<s>`.
  The handler validates the secret, calls `draftMode().enable()`, and redirects to the target
  route. In draft mode, `lib/strapi/queries.ts` switches to `cache: 'no-store'` and requests
  `status=draft` with the read token. Result: editors see unpublished content live; the
  public CDN cache is untouched.
- The preview token and Strapi read token are **server-only env vars**, never shipped to the
  client (AGENTS.md FE rule 10; SRS NG-2).

### 2.6 Media / asset handling

Three distinct media classes, handled differently:

1. **Editorial media** (project imagery, journal images, OG images) — uploaded in Strapi,
   stored via a **Strapi S3-compatible upload provider** into object storage (S3 / Cloudflare
   R2), served through a **media CDN**. Next renders them with **`next/image`**, with the CDN
   host in `images.remotePatterns`. Gives modern formats, responsive `srcset`, explicit
   width/height (CLS guard, G-7 / SRS §15 checklist), and lazy-below-fold.
   - **EC-2 (200 images in one case study, `docs/SRS.md:346`):** detail-page galleries lazy-
     load below the fold and may paginate/"load more"; never render 200 eager `<img>`.

2. **Home-1 hero image sequence** — pre-rendered frames (`docs/PROJECT-BRIEF.md:22-23`). These
   are *not* editorial; they are a fixed art asset delivered as a numbered set + a JSON
   **manifest** (`frameCount`, `pattern`, `width`, `height`, `poster`, per-tier variants).
   Stored on the CDN (own path), fetched by the client hero runtime (§3.1), **not** through
   `next/image` (canvas needs raw decodable bytes, not the optimizer). Placeholder frames ship
   in the repo/CDN until real assets land (FR-11 / R-2).

3. **Home-2 hero video** — `.mp4` (H.264) + `.webm` (VP9/AV1) + a poster still, on the CDN
   (`docs/PROJECT-BRIEF.md:30`, FR-14). Served via `<video>` with `preload="metadata"`,
   `poster`, `muted`, `loop`, `playsinline`, `autoplay` (autoplay gated by reduced-motion, §3.3).
   Placeholder video/poster until real asset lands (FR-15 / R-2).

**Asset origin discipline (privacy / injection):** `images.remotePatterns` and the hero/
video CDN host are a **fixed allowlist** in config. Media URLs are consumed only from Strapi
API responses and the hero manifest — never from user input — so there is no SSRF/hotlink
surface from visitor-supplied URLs.

### 2.7 Hosting topology

| Service | Host (assumed — Q-1 open, `docs/SRS.md:429-430`) | Notes |
|---|---|---|
| Next.js frontend | **Vercel** | ISR, Image Optimization, Route Handlers, Edge CDN. Non-root by platform. |
| Strapi v5 | **Node container** on Render / Railway / Fly.io / DO App Platform (or a VPS) | Long-running; needs persistent process + healthcheck. **Not** serverless (Strapi is stateful/long-lived). |
| MySQL 8.x | **Managed MySQL** (PlanetScale-style / provider-managed / RDS) | TLS-only connection from Strapi. |
| Media | **S3 / Cloudflare R2 + CDN** | Strapi writes; CDN serves. |
| Hero frames / video | **CDN** (can reuse the media CDN or a static bucket) | Cache-immutable, long TTL. |
| Rate-limit store | **Vercel KV / Upstash Redis** | Atomic counters for `/api/contact` (§4.3). |
| Email egress | **SMTP creds or email API** (Resend/SES/SendGrid) via Strapi email plugin **or** a Next route-handler transport | D-4 (`docs/SRS.md:390-391`); mechanism per §4.3. |

All secrets (Strapi tokens, DB URL, SMTP, KV token, webhook secret, preview secret) come from
platform env / secret store; none baked into an image or the client bundle (AGENTS.md DevOps &
BE secret rules).

---

## 3. HERO ARCHITECTURES + MEGA-MENU (mandated coverage)

### 3.1 Home 1 — GSAP ScrollTrigger image-sequence scrub

**Element choice: `<canvas>`, not swapping `<img>.src`.** Rationale:
- Swapping `<img>` `src`/`srcset` per frame triggers layout/decode churn and inter-frame
  flashes; the browser may not have the next frame decoded when scroll advances.
- A single `<canvas>` lets us pre-**decode** frames to `ImageBitmap` off the main thread
  (`createImageBitmap`) and `drawImage` the current one — one element, no reflow, smooth scrub.

**Frame loading & decode pipeline:**
1. **Manifest fetch** (tiny JSON): `frameCount`, `urlPattern`, intrinsic `width`/`height`,
   `poster`, and **device tiers** (e.g. `mobile` = fewer, smaller frames; `desktop` = full).
2. **LCP poster first (R5 / R6):** the dedicated Home-1 poster (`heroPosterH1`, §4.2) is painted
   immediately as a single small static image so LCP is one asset, not the sequence (G-7,
   LCP ≤ 2.5s). **The poster is rendered with `next/image`, `priority` (preload), and explicit
   intrinsic `width`/`height` (CLS guard); its byte budget is ≤ 60 KB in AVIF/WebP.** This is the
   one hero asset that goes through the Next image optimizer; the scrub frames do **not** (§2.6 —
   canvas needs raw decodable bytes). The canvas draws frame 0 over the poster once its bitmap is
   ready. Home 2's poster (`heroPosterH2`) is bound by the same ≤ 60 KB / `next/image priority` rule.
3. **Progressive fetch + decode:** frames are fetched as blobs and decoded via
   `createImageBitmap(blob)` (async, off-thread). The **preloader** (the loft-thirty-one-style
   `%` gate, `docs/PROJECT-BRIEF.md:63`) is **never the only door** (R7): the poster is interactive
   immediately and "enter" is enabled at **`min(25% buffered, 4s timeout)`** — whichever comes
   first — so a slow or partially-failing buffer can never lock a visitor out. The rest of the
   frames stream in during scroll. See failure paths below for partial/stalled handling.
4. **Memory management (mandated — R6):** decoded `ImageBitmap`s are the memory cost
   (≈ width×height×4 bytes each). Budget is bounded by (a) hard frame caps per tier —
   **desktop ≤ 120 frames at ≤ 1440px wide, mobile ≤ 48 frames at ≤ 720px wide, AVIF/WebP**
   (see §9 A-3) — **and** (b) a **sliding-window LRU decode**: keep encoded blobs (cheap) for all
   frames, but only hold decoded bitmaps for a window around the current index, calling
   `ImageBitmap.close()` on evicted frames to release GPU/CPU memory. **The LRU window is
   MANDATORY above 40 buffered frames.** The "decode-all-and-keep" path is **forbidden** at any
   frame count above that threshold — it is not offered as a simpler alternative, because at the
   stated caps it would hold hundreds of MB of decoded bitmaps and OOM-crash mid-range mobiles.
   This is the named guard against unbounded hero memory growth.
5. **Scrub binding:** a GSAP **ScrollTrigger** pins the hero section over a scroll distance and
   maps `progress ∈ [0,1]` monotonically to `frameIndex = round(progress × (frameCount-1))`
   (FR-10 / AC-8). `onUpdate` sets a target index; an rAF loop redraws **only when the index
   changes** (dedupe → no wasted paints). Backward scroll reverses frames naturally.
6. **DPR-correct draw:** canvas backing store sized to `cssSize × devicePixelRatio`; frames
   drawn with `object-fit: cover` math so the render fills the hero at any aspect ratio.

**Failure & degradation paths:**
- **Frames 404 / manifest missing (FR-11 / AC-9):** runtime detects load failure, paints the
  placeholder poster, disables the scrub (section still scrolls, no pin jump), logs one
  warning — **no console error, no unhandled rejection** (AC-9 is explicit). Every fetch/decode
  is wrapped so there is no unhandled promise (AGENTS.md FE rule 2).
- **Slow network / partial or stalled buffer (EC-6, `docs/SRS.md:363-368`; R7):** the poster shows
  immediately and the visitor can always enter at `min(25% buffered, 4s timeout)`. If buffering
  stalls or **some frames 404 while others load**, the runtime enters on the poster and **enhances
  progressively** — the scrub engages once a contiguous usable window is decoded, drawing whatever
  frames exist and holding the nearest available frame for gaps. If a usable scrub can never be
  assembled (too few frames arrive), it falls back to the static poster with scrub disabled — the
  section still scrolls, no pin jump. Body paint is never blocked by the sequence, and the gate is
  never the only door in.
- **`prefers-reduced-motion` (EC-6):** skip the scrub entirely — render a single static frame,
  do not pin/animate.
- **Cleanup (AGENTS.md FE rule 11):** on unmount, `ScrollTrigger.kill()`, cancel rAF, abort
  in-flight frame fetches (`AbortController`), and `close()` all `ImageBitmap`s.

### 3.2 Shared home body (FR-16/FR-17/FR-18)

Both `/` and `/home-2` import **one** shared `<HomeBody>` server component so the body DOM is
byte-identical (AC-10). Only the hero slot differs. The technical wireframe/blueprint section
(FR-17) is the **sole** DOM subtree permitted to use `--blueprint` (`#4EA1FF`) — enforced by
scoping that token to that section's component and treating any other use as a defect
(FR-7 / AC-7 / AC-13). Featured projects (FR-18) come from the `home` fetch and link to
`/projects/[slug]`.

**`/home-2` `<head>` divergence (R4):** although the body DOM is byte-identical to `/`, the two
routes do **not** share a `<head>`. `/home-2` sets `robots: noindex, follow` and
`<link rel="canonical" href="/">`, is omitted from `sitemap.xml`, and never appears in nav. This
resolves the duplicate-content risk of two routes reading the same Home singleton `seo` component:
`/` is the sole indexable canonical; `/home-2` is a non-indexed variant/demo surface.

### 3.3 Home 2 — video hero

`<video>` with `poster` (LCP-friendly still), `muted loop playsinline autoplay`,
`preload="metadata"`, sources `.webm` then `.mp4`. No ScrollTrigger, no scrub (FR-14 / AC-11).
- **Reduced motion (EC-6):** if `prefers-reduced-motion: reduce`, do **not** autoplay — show
  the poster; optionally expose a play control.
- **Asset absent (FR-15 / AC-12):** poster/placeholder shows, `onError` handled, no console
  error.
- Cleanup: pause and release the element on unmount.

### 3.4 Glassmorphism mega-menu

**Composition:** nav structure is a **Server Component** (renders links + the category/service
groupings sourced from the `nav` fetch). A thin **Client Component** owns interactivity
(open/close, focus, keyboard). This keeps the menu content in the static HTML (SEO, no layout
shift) while isolating client JS.

**Glassmorphism surface:** semi-transparent `--surface` panel + `backdrop-filter: blur()`
over the darkened page. Because `backdrop-filter` is not universally supported and is GPU-
costly over large areas: (a) apply blur to the **panel only**, not full-viewport; (b) provide
a **solid-`--surface` fallback** via `@supports not (backdrop-filter: blur())`; (c) set
`will-change` only while animating, cleared after.

**Open/close state machine:** `closed → opening → open → closing → closed`. Triggers: click,
`Enter`/`Space`, and hover-intent on desktop (small open/close delay to prevent flicker when
the pointer crosses items). `Escape` and outside-click close it (AC-3). Animation via a GSAP
timeline (height/opacity/translate); `prefers-reduced-motion` → instant show/hide.

**Accessibility (US-11, AGENTS.md A11y):** trigger is a real `<button aria-expanded aria-controls>`;
menu is keyboard-navigable; focus moves into the panel on open and returns to the trigger on
close; focus is contained while open but always escapable. (Formal audit is the A11y reviewer's.)

**Mobile (FR-4 / AC-4, US-12):** below the breakpoint (assumed <768px, A-2) the top nav
collapses to a single toggle opening a full-height drawer; mega-menu groupings become
**accordions** inside the drawer. Same targets, keyboard-reachable.

---

## 4. INTERFACES (signatures / contracts only — no bodies)

> TypeScript signatures and pseudocode. Field-level schemas belong to API Designer (§4.2
> shapes) and DB/Data Architect (Strapi content model).

### 4.1 Strapi read layer (server-only) — `lib/strapi/`

```ts
// lib/strapi/client.ts  — the ONLY module that talks to Strapi. Server-only.
type StrapiFetchOpts = {
  tags?: string[];                 // Next cache tags for this read (§2.4)
  revalidate?: number | false;     // ISR floor; false = no-store (preview/dynamic)
  draft?: boolean;                 // preview mode → request status=draft + token
  query?: Record<string, string | number | boolean | string[]>; // populate/fields/filters/pagination
};
declare function strapiFetch<T>(collectionPath: string, opts?: StrapiFetchOpts): Promise<T>;
// Responsibilities: base URL + read token from env; build query string; attach
// { next: { tags, revalidate } } or { cache:'no-store' } for draft; throw a typed
// StrapiError on non-2xx (never leak raw body to caller).

// lib/strapi/queries.ts — page-shaped reads. Each is ONE request (N+1 guard, §2.3).
declare function getHome(opts?: {draft?: boolean}): Promise<Home>;
declare function getAbout(opts?: {draft?: boolean}): Promise<About>;
declare function getNavTaxonomy(): Promise<{ projectCategories: Category[]; services: ServiceRef[] }>;

declare function getProjects(params: {
  page: number; pageSize: number; category?: string;
}): Promise<Paginated<ProjectCard>>;                 // one call, populate=cover,category
declare function getProjectSlugs(): Promise<string[]>;               // for generateStaticParams
declare function getProjectBySlug(slug: string, opts?: {draft?: boolean}): Promise<Project | null>; // null → 404

declare function getServices(opts?: {draft?: boolean}): Promise<Service[]>;

declare function getJournal(params: { page: number; pageSize: number }): Promise<Paginated<PostCard>>; // newest-first (A-5)
declare function getPostSlugs(): Promise<string[]>;
declare function getPostBySlug(slug: string, opts?: {draft?: boolean}): Promise<Post | null>; // null → 404
```

### 4.2 Content-type boundaries (relations only; fields owned by DB Architect)

```
Collection types (Draft & Publish ON):
  Project     { slug (uid, unique), title, order (int, nullable — R1), cover(media),
                gallery(media[]), body(rich),
                category(relation → Category, many-to-one), ...seo }
  Post        { slug (uid, unique), title, cover(media), body(rich),
                publishedAt, readingTime, ...seo }                 // journal (no Tag type — R3)
  Service     { slug (uid), title, summary, body, order }          // groups Services mega-menu
  Category    { slug (uid), name, order }                          // groups Projects mega-menu + filter

Collection type (Draft & Publish OFF — operational, not editorial):
  ContactSubmission { name, email, message, company?, projectType?,       // R2
                      status(enum: new|read|archived), ipHash, userAgent, createdAt }
  // Written ONLY by the Next.js /api/contact route via a server-only write token (§4.3).
  // PII at rest → 180-day auto-purge (retention job, §4.3). Never publicly readable.

Single types (Draft & Publish ON):
  Home        { heroFrameManifestUrl (string → JSON manifest URL),        // R5
                heroPosterH1 (media — Home-1 LCP poster),
                heroVideoUrl (media), heroPosterH2 (media — Home-2 poster),  // TWO posters
                featuredProjects(relation → Project[]),
                ...blueprint/wireframe slots (R14, owned by DB), ...editorial slots per UI/UX Q-2,
                ...seo }
  About       { body, ...seo }
```
> **Nav taxonomy is DERIVED from Category + Service (R11 — confirmed, authoritative).** There is
> **no** editable `Navigation` single/collection type. The mega-menu groups are Categories (Projects)
> and Services (offerings); nav order follows each taxonomy's `order` scalar. No `GET /api/navigation`
> endpoint exists. This supersedes the earlier "flagged A-6" hedge; see §9 A-6.
> Note: `slug` uniqueness is **global** (single-tenant). This is the deliberate exception to
> AGENTS.md:266-269 (which wants tenant-scoped uniqueness) and is correct here per §0/A-1.

### 4.3 Public HTTP surface (Next.js Route Handlers) — shapes for API Designer to formalize

```ts
// POST /api/contact  — FR-31…FR-38. Dynamic. Server-only email + abuse control.
type ContactRequest = {
  name: string;            // required, trimmed, 1..120
  email: string;           // required, RFC-validated
  message: string;         // required, 1..5000 (server-enforced cap, EC-8 / R8)
  company?: string;        // optional, ≤120 (R9)
  projectType?: string;    // optional (A-7)
  consent: boolean;        // required — must be true ("I agree to the privacy policy", R2)
  hp?: string;             // honeypot — MUST be empty (bots fill it)  (FR-38, Q-4)
};
type ContactResponse =
  | { ok: true }                                   // 200 → success signal (AC-27, ≤10s)
  | { ok: false; code: 'VALIDATION'; fields: Record<string,string> }  // 422
  | { ok: false; code: 'RATE_LIMITED'; retryAfter: number }           // 429 (AC-30)
  | { ok: false; code: 'MAIL_FAILED' };                               // 502 (AC-29 retry)
// Pseudocode (JSON body only — no urlencoded/no-JS path):
//   validate(body) → 422 with field errors (server re-validates; client already did, FR-32/33)
//     - message > 5000 → 422 field-level (NOT 413 — R8); company > 120 → 422 (R9);
//       consent !== true → 422 field-level.
//   if body.hp non-empty → silently 200 (drop, don't email, don't persist)  [honeypot]
//   allowed = rateStore.INCR(key=ipHash+window); if allowed > LIMIT → 429  [atomic, §2.4 race]
//   sanitize/escape all fields; enforce max length (EC-8, XSS/oversize guard)
//   PERSIST + EMAIL (R2 — both, not one):
//     - POST a ContactSubmission to Strapi using a SERVER-ONLY write token (never client-visible;
//       stored ipHash + userAgent, status='new'); this is a server-to-server call.
//     - send email to STUDIO_INBOX (Q-6) via transport.
//     - if EITHER side effect fails → 502 (MAIL_FAILED), do NOT lie success (AC-29 retry).
//   never echo submitted content unescaped anywhere.
//
// RETENTION (R2 — PII at rest): a scheduled job auto-purges ContactSubmission rows older than
//   180 days. Consent + a public /privacy Privacy Policy page are prerequisites for going live.

// POST /api/revalidate — Strapi publish webhook sink. Dynamic.
type RevalidateRequest = { model: string; event: string; entry?: { slug?: string } };
// Header: x-strapi-signature (shared secret). Pseudocode:
//   verify(signature) with timing-safe compare else 401
//   map (model, entry.slug) → tag(s):  Project→['projects','project:'+slug,'home']  etc.
//   revalidateTag(tag) for each; return { revalidated: tag[] }   (idempotent, §2.4)

// GET /api/preview — Strapi Preview → Next Draft Mode. Dynamic.
//   verify(secret, timing-safe) else 401; draftMode().enable(); redirect(targetPath)
// GET /api/exit-preview — draftMode().disable(); redirect('/')
```

### 4.4 Hero runtime contract (client) — `components/hero/`

```ts
type FrameManifest = {
  frameCount: number; urlPattern: string;   // e.g. "/hero/desktop/frame_{n:4}.webp"
  width: number; height: number; poster: string;
  tiers?: { mobile?: Partial<FrameManifest>; };
};
declare function useImageSequenceHero(ref: RefObject<HTMLCanvasElement>, manifestUrl: string): {
  status: 'idle' | 'loading' | 'ready' | 'degraded';   // 'degraded' → placeholder path (FR-11)
  progress: number;                                     // buffered fraction (preloader gate)
  canEnter: boolean;                                    // R7: true at min(25% buffered, 4s timeout)
};
// manifestUrl comes from Home.heroFrameManifestUrl (§4.2). Internals (pseudocode):
// fetch manifest → pick tier by matchMedia (caps: desktop ≤120@≤1440px, mobile ≤48@≤720px — R6) →
// fetch+decode frames (AbortController) → createImageBitmap → MANDATORY LRU window with .close()
// eviction above 40 frames (decode-all forbidden — R6) → ScrollTrigger pin maps scroll progress →
// frameIndex → rAF draws on index change → reduced-motion static → partial/stalled or on error set
// 'degraded' + draw poster, canEnter still fires by 4s (R7) → cleanup kills ScrollTrigger/rAF/
// aborts in-flight fetches/closes bitmaps.
```

---

## 5. ALTERNATIVES CONSIDERED (mandatory, ≥2)

**A. Strapi consumption — GraphQL instead of REST (rejected).**
GraphQL would let one query fetch a deep tree and could reduce over-fetch. Rejected because:
(1) reads are fixed and server-composed, so client-side query flexibility is unused;
(2) Next's fetch cache + `next.tags`/`revalidate` — the core of §2.4 — applies cleanly to REST
GETs but not to GraphQL POSTs (would need manual `unstable_cache`, more surface to get wrong);
(3) it is an extra plugin/dependency to maintain (dependency-cost, AGENTS.md:170-172). REST
`populate`+`fields` already prevents N+1 and over-fetch. GraphQL stays a **reversible** future
option if read patterns become client-driven.

**B. Rendering — full SSR (dynamic) on every request instead of ISR (rejected).**
SSR-per-request would guarantee zero staleness (no cache window). Rejected: it puts Strapi on
the hot path of *every* visitor request (latency + load + a hard dependency — if Strapi blips,
every page 500s, worsening EC-5), and forfeits CDN caching, directly threatening G-7 LCP.
ISR + webhook revalidation gives near-real-time freshness (G-3) *and* CDN-fast delivery *and*
resilience (last good page is served if Strapi is down). SSR is retained only for the
draft-preview path, where freshness must be absolute and traffic is a handful of editors.

**C. Hero — swapping `<img>`/`<picture>` per frame, or CSS `background-image`, instead of canvas (rejected).**
Simpler to write. Rejected: per-frame `src` swaps cause decode jank, inter-frame flashes, and
CLS risk, and give no control over decode timing or memory eviction. Canvas + `createImageBitmap`
decodes off-thread, paints one stable element, and lets us bound memory with an LRU window
(§3.1) — the difference between a smooth cinematic scrub and a stuttering one on mid-range
mobiles.

**D. Contact abuse control — CAPTCHA (rejected on constraint) vs honeypot+rate-limit (chosen).**
FR-38 / R-5 (`docs/SRS.md:229-230,416-418`) forbid making the visitor solve external
challenges. Honeypot + atomic per-IP-window rate limit (Vercel KV/Upstash) meets FR-38 without
a CAPTCHA and without hurting AC-27's ≤10s timing. (A privacy-preserving invisible provider
could be added later if abuse warrants — flagged Q-4.)

---

## 6. TRADEOFFS (mandatory, non-empty — what this design is bad at)

- **Staleness window on missed webhooks.** If the Strapi→`/api/revalidate` webhook fails and
  no one re-requests, a page can be stale up to its `revalidate` floor (5 min lists / 60 min
  detail). Real-time-critical content is not this design's strength; it is tuned for a
  marketing site, not a newsroom.
- **Two-service operational surface.** Vercel + a separately-hosted stateful Strapi + managed
  MySQL + object storage + KV = more moving parts than an all-in-one. More to monitor, more
  places for env/secret drift (DevOps must own §2.7's env matrix).
- **Hero memory/CPU on low-end mobile.** Even with tiering and LRU, an image-sequence scrub is
  heavier than a static hero. On the weakest devices the honest answer is the reduced-motion/
  static-frame path — i.e. some visitors never get the cinematic effect by design.
- **`backdrop-filter` cost & fallback divergence.** The glass mega-menu looks different on
  browsers without `backdrop-filter` (solid fallback) and costs GPU while animating.
- **REST `populate` coupling.** Response shape is coupled to the `populate` trees in
  `lib/strapi/queries.ts`; a content-model change in Strapi can silently change payloads.
  Mitigation is typed responses + a Strapi contract the DB/API roles own — but the coupling
  is real.
- **No preview of *unpublished relations* edge.** Draft mode shows a draft entry, but deeply
  nested draft-relation combinations can differ subtly from published render; editors must be
  told preview ≈ (not =) production for complex relations.

---

## 7. BLAST RADIUS

| If this is wrong… | Impact | Reversible? |
|---|---|---|
| Revalidation tag mapping (§2.4) wrong | Stale pages or over-invalidation (Strapi load). Content-only, no data loss. | **Yes** — edit tag map, redeploy. |
| REST-vs-GraphQL choice wrong | Rework of `lib/strapi/*` only (isolated module). UI untouched. | **Yes** — swap the read layer; components unchanged. |
| Hero memory budget too high | Jank / crashes on low-end mobile for `/` only. | **Yes** — tune tier counts/resolution or force static; config, not rewrite. |
| ISR chosen where SSR needed | Visible staleness. No corruption. | **Yes** — flip a route to dynamic. |
| Contact rate-limit too loose | Spam email volume. No data loss/leak. | **Yes** — tighten limit. |
| Contact endpoint leaks/echoes input | XSS / abuse. Security-critical. | Must be caught pre-launch (Security review). |
| Preview/read token shipped to client | Draft content exposure. | **Hard to reverse** post-leak — rotate token immediately; treat as P0 (SRS NG-2). |
| **Single-tenant assumption (§0) wrong** | Entire cache-key/model/uniqueness design (global namespace, global slug uniqueness) is unsafe for tenant B. | **NOT reversible cheaply** — cross-cutting redesign. This is why §0 escalates the conflict rather than assuming. |

Reversible-vs-not summary: almost every performance/rendering decision here is a config-level
flip. The two **not**-cheaply-reversible items are (a) any secret leak to the client and
(b) the single-tenant foundation — both are called out and gated.

---

## 8. MIGRATION / ROLLOUT

No existing system to migrate *from* (greenfield, §1). "Migration" = safe stand-up order.

1. **Provision backing services first:** managed MySQL → Strapi container (TLS to DB) →
   object storage + upload provider → media CDN. Verify Strapi admin loads and a test upload
   lands on the CDN.
2. **Define content types** (DB/Data Architect owns DDL): Project, Post, Service, Category,
   Home, About — with Draft & Publish ON. Seed placeholder entries.
3. **Seed placeholder hero assets** (frames + manifest, video + poster) on the CDN so Home 1/2
   build green before real assets land (FR-11/FR-15, R-2).
4. **Scaffold Next.js** (App Router, TS), wire `lib/strapi/*` against Strapi with the read
   token; build all routes at their §2.4 strategies. `generateStaticParams` reads live slugs.
5. **Wire revalidation:** create the Strapi publish/unpublish webhook → `/api/revalidate` with
   the shared secret; verify a publish flips the right tag.
6. **Wire preview:** configure Strapi Preview URL → `/api/preview`; verify draft mode.
7. **Wire contact:** email transport + KV rate store; verify AC-25…AC-30 end-to-end.
8. **Deploy order & rollback (DevOps owns detail):** frontend deploys are atomic on Vercel —
   rollback = promote previous deployment. Strapi rollback = redeploy previous image; since
   this phase adds no destructive DB migration, old and new content schemas are compatible.
   Any future Strapi content-type change that drops/renames a field is a **breaking** change
   and needs the two-phase pattern (add-new → migrate → remove-old) — flagged for DevOps/DB.
9. **Cutover:** point DNS at Vercel once Strapi is reachable and the smoke test (one page per
   route group returns 200; a publish revalidates; a contact test email arrives) passes.

---

## 9. ASSUMPTIONS

- **A-1** Single-tenant, no public auth, no payments — carried from `docs/PROJECT-BRIEF.md:79-80`
  and `docs/SRS.md:59-63`. This is the basis for the §0 resolution (global cache-tag namespace,
  global slug uniqueness). **Escalated in §0 for Orchestrator confirmation** because it
  overrides AGENTS.md:164-167.
- **A-2** Mobile breakpoint for nav collapse <768px — carried from `docs/SRS.md:455-456` (A-2);
  final value is a UI/UX decision.
- **A-3** Hero frame caps (R6 — now a hard ceiling, not a soft target): **desktop ≤ 120 frames
  at ≤ 1440px wide, mobile ≤ 48 frames at ≤ 720px wide, AVIF/WebP.** The LRU sliding-window
  decode (§3.1) is **MANDATORY above 40 buffered frames** and "decode-all-and-keep" is forbidden
  above that threshold. Poster budget ≤ 60 KB, `next/image priority`. Real frame
  count/resolution/format are unknown until assets land (`docs/SRS.md:404-405` R-2), but any
  delivered set MUST be down-sampled to fit these caps before ship; G-7 is re-measured against them.
- **A-4** Revalidation model = Strapi webhook (near-instant) + time-based floor (300s lists /
  3600s detail) satisfies G-3/A-6's "within 60s". Actual floors are tunable; confirm with
  SEO/Perf.
- **A-5** Journal ordering newest-first by `publishedAt` — carried from `docs/SRS.md:462-463` (A-5).
- **A-6** ~~Assumption~~ **RESOLVED by R11:** nav mega-menu groupings are **derived** from the
  Category (Projects) and Service (offerings) taxonomies. There is no editable `Navigation` type
  and no `GET /api/navigation` endpoint (§4.2). Nav order follows each taxonomy's `order` scalar.
  This is now authoritative, not a hedge.
- **A-7** Contact fields = Name, Email, Message (required) + optional Company, Project-type,
  plus a honeypot field — carried from `docs/SRS.md:467-468` (A-7); pending Q-3.
- **A-8** Hosting = Vercel (Next) + Node-container Strapi + managed MySQL + S3/R2 + KV —
  carried from `docs/SRS.md:392-393` (D-5); **unconfirmed, Q-1 still open** (`docs/SRS.md:429-430`).
  A serverless-only Strapi host is explicitly excluded (Strapi is stateful/long-running).
- **A-9** New dependencies introduced by this design, each justified:
  - **GSAP + ScrollTrigger** — already in the confirmed stack (`docs/PROJECT-BRIEF.md:20`); buys
    the scrub + reveals; cost = license/bundle; abandonment risk low (mature, widely used).
  - **Strapi S3/R2 upload provider** — buys durable/CDN-served media off the app server; cost =
    config + storage bill; standard Strapi plugin.
  - **Rate-limit store (Vercel KV / Upstash Redis)** — buys an *atomic* counter for the contact
    race (a check in app code is not a guard, AGENTS.md BE rule 6); cost = one managed service;
    if abandoned, swap for any atomic KV. **Escalate if the platform forbids adding it** — falls
    back to platform-native rate limiting.
  - **Email transport (Resend/SES/SendGrid or SMTP)** — required by D-4; mechanism is a
    DevOps/Security choice; no lock-in (SMTP is portable).
  - No client-side data-fetching or state library is added (RSC + native fetch suffice).
- **A-10** Strapi is reachable at **build time** for `generateStaticParams`; if it is not, the
  build fails fast (preferred over shipping empty pages). Runtime Strapi outage is survived by
  serving the last ISR page (see EC-5 handling). **Q-5 (`docs/SRS.md:438-439`) — required
  behavior when Strapi is unreachable — remains open** and this is my proposed answer, not a
  confirmed requirement.

### Unresolved open questions this design depends on (escalate to Orchestrator/user)
- **Q-1** Confirmed hosting target (drives §2.7, A-8).
- **Q-2** Home body section list (UI/UX) — blocks final `<HomeBody>` and `home` content model.
- **Q-3** Final contact field set (A-7).
- **Q-4** Acceptable spam mitigation confirmation (honeypot + rate-limit proposed).
- **Q-5** Required behavior when Strapi is unreachable (A-10 proposes fail-build + serve-stale).
- **Q-6** Studio destination inbox + whether an auto-acknowledgement email is wanted (would be
  a new FR + Content copy).
- **Q-7** ~~Open~~ **RESOLVED by R2:** contact now persists PII, so a public **`/privacy` Privacy
  Policy page** is added to the sitemap, the form carries a required **consent checkbox**, and
  `ContactSubmission` rows auto-purge after **180 days** (§4.3, §4.2).
- **Q-8** Project category + service offering taxonomy values (drive nav, filter, content model).

**This section is not empty.** Ten assumptions (A-1…A-10) are declared and eight open questions
(Q-1…Q-8) plus the §0 governance conflict are escalated. No requirement was invented; every gap
is surfaced per the GLOBAL CONTRACT.
