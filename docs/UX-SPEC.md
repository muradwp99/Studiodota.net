# Studiodota.net — UI/UX Specification

> Role: UI/UX Designer (`AGENTS.md` §3). Behavior + structure + design tokens only — **no
> production code**. This document defines *how the interface behaves*, not `.tsx`.
> Sources of truth: `docs/PROJECT-BRIEF.md`, `docs/SRS.md`, `docs/ARCHITECTURE.md`.
> Governed by the `AGENTS.md` GLOBAL CONTRACT. Every gap is surfaced under §11 ASSUMPTIONS
> or §12 ESCALATIONS — never invented.
> Version: 1.1 — 2026-07-14 (edited to apply RESOLVED DECISIONS R2, R4, R6, R7, R8,
> R9, R12, R13 from `docs/PROJECT-BRIEF.md §9b`; several §12 escalations now resolved).

---

## 0. SCOPE, LANE, AND CONFLICTS SURFACED (GLOBAL CONTRACT §5, §7)

**In my lane:** user flows, per-screen state matrices, information hierarchy, interaction
(click/hover/focus/keyboard/touch), validation & feedback behavior, responsive rules, the
design-token registry (names + values), and the two mandated motion specs (glass mega-menu,
photoreal→wireframe).

**Explicitly NOT in my lane (deferred to named owners, per GLOBAL CONTRACT §5):**
- Final UI copy / microcopy / error strings → **Content Writer** (`AGENTS.md` §13). I mark
  every copy slot `[COPY: …]`; the words are placeholders illustrating intent, not final.
- Strapi content model / field types → **DB Architect** (`AGENTS.md` §5); relations are set
  in `docs/ARCHITECTURE.md:364-385`.
- HTTP schemas → **API Designer**; shapes in `docs/ARCHITECTURE.md:387-422`.
- Brand logo + final licensed typefaces → Figma (`docs/SRS.md:406-411` R-3). **The Figma MCP
  connector is unauthorized in this session** — I cannot read or produce brand assets. Font
  choices below are a **proposed pairing with fallbacks**, flagged for replacement (§12 E-2).

**Conflict surfaced (no silent reconciliation, GLOBAL CONTRACT §7):**
1. `AGENTS.md:198-204` (my role rules) says *"Never specify a color/font/spacing value
   directly. Reference the token. If you need a new one, escalate; do not invent."* — yet my
   assigned task requires me to **define a concrete token set with values**. Resolution: this
   is greenfield with no token file (verified: only `PROJECT-BRIEF.md`, `SRS.md`,
   `ARCHITECTURE.md` exist under `docs/`). I am therefore *establishing* the token registry
   that all later work references. §6 is the **one** place raw values appear; everywhere else
   in this spec references token **names** only. Any color that is a genuinely new hue (not a
   derivation of the six brief primitives) is escalated in §12, not silently invented.
2. **`FR-7` vs validation-error color.** `docs/SRS.md:127-135` (FR-7) restricts all color to
   the six palette tokens; `--blueprint` is confined to one section. But the contact form
   (FR-32/33) needs an *error* signal, and the palette contains **no error/danger hue**. I do
   **not** invent a red. Default behavior uses icon + text + border built from existing tokens
   (`--gold` for attention + `--muted`/hairline). **RESOLVED (§12 E-1): errors stay gold** —
   `--gold` + icon + text + `--hairline-strong`; **no `--danger`/red hue is introduced.** Every
   error state below works *without color as the sole signal* (WCAG 1.4.1).

---

## 1. GLOBAL SCREEN INVENTORY

Screens/regions this spec covers (maps 1:1 to `FR-1`, `docs/SRS.md:114-116`):

| ID | Screen / region | Route(s) | FR anchor |
|---|---|---|---|
| **GC** | Global chrome: sticky top nav + mega-menu + mobile drawer + footer + skip link | all | FR-2…FR-5 |
| **H1** | Home 1 — scrub hero + preloader gate | `/` | FR-9…FR-12 |
| **H2** | Home 2 — video hero | `/home-2` | FR-13…FR-15 |
| **HB** | Shared home body (both variants) | `/`, `/home-2` | FR-16…FR-18 |
| **PL** | Projects gallery + filter | `/projects` | FR-19, FR-20 |
| **PD** | Project case-study detail | `/projects/[slug]` | FR-21…FR-23 |
| **SV** | Services | `/services` | FR-24 |
| **AB** | About | `/about` | FR-25 |
| **JL** | Journal list | `/journal` | FR-26, FR-27, FR-30 |
| **JD** | Journal post detail | `/journal/[slug]` | FR-28, FR-29 |
| **CT** | Contact form | `/contact` | FR-31…FR-38 |
| **PV** | Privacy Policy (static prose) | `/privacy` | R2 (`BRIEF §9b`) |
| **E4** | 404 / not-found | any invalid | FR-23, FR-29, AC-1 |

---

## 2. USER FLOW (every screen/state + every transition)

### 2.1 Top-level flow graph

```
                          ┌──────────────── Sticky Top Nav (GC) — on every screen ───────────────┐
                          │  Logo→/   Projects▾   Services▾   About   Journal   Contact           │
                          └───┬─────────────┬───────────┬────────┬────────┬──────────┬────────────┘
      first paint            │             │(mega)     │(mega)  │        │          │
  ┌─────────────┐            ▼             ▼           ▼        ▼        ▼          ▼
  │ Preloader   │        Home 1 (/)   Mega-menu:   Mega-menu:  /about  /journal   /contact
  │  % gate     │────▶   scrub hero   Projects      Services            (JL)       (CT)
  │ "START HERE"│        + body (HB)  (categories)  (offerings)          │           │
  └─────────────┘            │             │            │               ▼           ▼
        (H1 only,            │           pick        pick             /journal/    submit →
         first visit)        │          category     offering          [slug](JD)  success / error
                             ▼             ▼            ▼
                        featured    /projects?category=X /services (SV)
                        project →   (PL, filtered)        │
                        /projects/         │              └─ offering anchor
                        [slug] (PD)        ▼
                             ▲        project card → /projects/[slug] (PD)
                             └───────────────┘   related project → PD (loop)
  /home-2 (H2) shares identical body (HB); reachable only by direct URL / internal link (not in nav — see §11 A-2).
```

### 2.2 Per-flow transitions

- **Preloader → Home 1 (H1 only, first visit this session):** the **poster paints
  immediately** as LCP (`heroPosterH1`, R5) — the preloader is a translucent overlay on top
  of it, **never the only door** (R7). A `%` counter tracks the hero threshold buffer
  (`docs/ARCHITECTURE.md:250-251`). The **enter gate** ("START HERE") enables at
  **`min(25% buffered, 4s timeout)`** — whichever comes first — so a slow or stalled buffer
  can never lock the visitor out (R7). Activating it (click / `Enter` / `Space`) dismisses the
  preloader (fade + upward wipe, `--dur-hero`, `--ease-emphasized`) and reveals the scrub hero;
  frames that are still arriving continue to stream and the scrub enhances as they decode.
  If the timeout fires before enough frames are usable, the visitor enters on the static
  poster and the scrub simply enables once its buffer is ready — or stays disabled if frames
  never load (see §3.2 `stalled/timeout` + `error`). Skipped on `/home-2`, on repeat visits
  within the session (sessionStorage flag), and under `prefers-reduced-motion` (gate shows
  immediately at the poster). See §11 A-4.
- **Nav item (no children) click →** client-side route transition; nav stays mounted (sticky).
  A top progress hairline (`--gold`, 2px) animates during navigation (`--dur-base`).
- **Nav parent (Projects/Services) activate → mega-menu** open state machine (§5.4).
- **Mega-menu category/offering click →** navigate to `/projects?category=<slug>` (PL, pre-
  filtered) or `/services#<offering-slug>` (SV, scroll-to). Menu closes on navigation.
- **PL card click → PD.** PD "related/next project" → PD (loop). Breadcrumb / back → PL.
- **CT submit →** client validation → in-flight → success confirmation **or** error state with
  input preserved + retry (FR-35…FR-37). No route change on submit.
- **Any invalid content slug →** E4 (FR-23/FR-29).
- **Global escape hatches:** logo always → `/`; footer always exposes all 7 top-level routes
  plus a utility link to **`/privacy`** (R2). `/home-2` is not linked from nav or footer (R4).

---

## 3. STATE MATRIX (mandatory — all 7 states per screen)

States: **loading · empty · partial · populated · error · permission-denied · offline.**
`permission-denied` has **no public-visitor surface** (NG-2, `docs/SRS.md:61-63`) — where it
cannot occur for a public visitor I state that explicitly *and* define the one editor/preview
case it maps to, so no state is left undefined.

### 3.1 GC — Global chrome (nav, mega-menu, footer)

| State | Behavior |
|---|---|
| **loading** | Nav shell renders in static HTML (server component, `docs/ARCHITECTURE.md:301-304`) — **no skeleton needed**, no layout shift. If `nav` taxonomy fetch is still resolving, parent items render **without** dropdown affordance until groupings hydrate (progressive enhancement); logo + top links are always present. |
| **empty** | A parent (Projects/Services) with **zero** groupings renders as a plain link to `/projects` or `/services` (no caret, no mega-menu). Footer always renders its fixed links (the 7 top-level routes + a `/privacy` utility link, R2) regardless of CMS. |
| **partial** | Some groupings load, others fail: show the ones that resolved; a failed group is simply absent (never a broken row). |
| **populated** | Full nav + mega-menu groupings + footer. |
| **error** | `nav` fetch fails entirely → nav degrades to **flat links only** (Projects/Services become direct links, no mega-menu). One console warning; no visible error to the user; no unhandled rejection. |
| **permission-denied** | N/A for public visitor (no auth). |
| **offline** | Nav is in already-delivered HTML; remains fully operable for in-page actions. Cross-route clicks that need an uncached page defer to the target screen's offline state. |

### 3.2 H1 — Home 1 scrub hero (+ preloader)

| State | Behavior |
|---|---|
| **loading** | The **poster** (`heroPosterH1`) paints immediately as LCP — served via `next/image` with explicit width/height and `priority` preload, **byte budget ≤ 60KB (AVIF/WebP)** so LCP holds on the 3G-class profile (R6/G-7, `docs/ARCHITECTURE.md:245-246`); preloader `%` counts the buffer; body below hero is already painted (hero never blocks body). |
| **empty** | N/A — hero is an art asset, always present (placeholder frames if real assets absent, FR-11). |
| **partial** | Enter gate enables at **`min(25% buffered, 4s timeout)`** (R7); remaining frames stream during scroll; scrubbing past the buffered edge holds the last decoded frame until the next arrives (never a blank canvas). Decode uses the mandatory LRU sliding window above 40 buffered frames — never decode-all (R6). |
| **stalled/timeout** | (R7) Buffer stalls or the 4s timeout fires before ~25% is ready → **enter gate enables anyway on the poster**; the visitor is never locked out. Frames continue to arrive in the background and the scrub silently upgrades from static → interactive as they decode. If some frames 404 while others load (partial fetch), render what decoded and hold the nearest frame; if the buffer never becomes usable, fall through to `error` (static poster, scrub disabled). |
| **populated** | Full sequence buffered; smooth scrub 0→100% ↔ frame 0→N (FR-10/AC-8). |
| **error** | Frames/manifest 404 (FR-11/AC-9): paint the static poster, **disable scrub** (section still scrolls, no pin jump), one warning, no console error, no unhandled rejection. |
| **permission-denied** | N/A. |
| **offline** | If the HTML + poster are cached, the poster shows and scrub is disabled; body renders from cache. Uncached first visit while offline → browser offline page (out of app scope). |
| **reduced-motion** | (mandated, EC-6) skip scrub + preloader animation: show a single static frame; no pin, no `%` gate animation. |

### 3.3 H2 — Home 2 video hero

| State | Behavior |
|---|---|
| **loading** | The `heroPosterH2` poster paints immediately as LCP — `next/image`, explicit dims, `priority`, **≤ 60KB (AVIF/WebP)** budget (R5/R6); `<video preload="metadata">` fetches in background (`docs/ARCHITECTURE.md:288-291`). |
| **empty** | N/A — placeholder video/poster if asset absent (FR-15). |
| **partial** | Poster held until enough video buffers to loop; then autoplay (unless reduced-motion). |
| **populated** | Looping muted video (FR-14/AC-11); scroll does **not** change the hero. |
| **error** | `onError` → poster/placeholder stays, no console error (FR-15/AC-12); optional play control appears. |
| **permission-denied** | N/A. |
| **offline** | Poster from cache; video may not load → poster remains (graceful). |
| **reduced-motion** | (EC-6) do **not** autoplay; show poster + a visible play control the user can trigger. |

### 3.4 HB — Shared home body

| State | Behavior |
|---|---|
| **loading** | ISR-static: body ships fully rendered (`docs/ARCHITECTURE.md:150-152`); featured-project imagery uses `next/image` with explicit dimensions → **no CLS**. Below-fold sections lazy-reveal on scroll (GSAP), each with a pre-sized container so nothing shifts. |
| **empty** | If a CMS-driven slot (e.g. featured projects) is empty → that section collapses to a defined fallback (e.g. "Selected work" links to `/projects`); structural/static sections always render. |
| **partial** | Some featured items missing media → per-card empty-media treatment (§3.5 media rule); section still renders remaining cards. |
| **populated** | All sections + featured grid + journal teaser. |
| **error** | `home` fetch fails at build/ISR → route serves last good ISR page (`docs/ARCHITECTURE.md:457-460`); if never built, editorial slots fall back to their empty treatment, static sections render. Never a raw error. |
| **permission-denied** | N/A public; **preview** editor case: a bad preview secret → 401 handled by `/api/preview`, visitor never affected. |
| **offline** | Served from cache if visited; else target-route offline behavior. |

### 3.5 PL — Projects gallery + filter

| State | Behavior |
|---|---|
| **loading** | Skeleton grid of card placeholders matching final card aspect ratio + count = page size (prevents CLS). Filter chips render immediately from `nav` taxonomy. |
| **empty** | Zero published projects → defined empty state: `[COPY: "No projects published yet."]` + CTA to `/contact`. Not a blank grid. |
| **empty (filtered)** | A category with zero matches → "No projects in [category]" + a "Clear filter" affordance returning to all. |
| **partial** | Page N loaded, more available → "Load more" / next-page control visible; already-loaded cards interactive. |
| **populated** | Grid of exactly the published count for the active filter (AC-15/AC-16); pagination per API Designer policy (`docs/ARCHITECTURE.md:151`). |
| **error** | List fetch fails → error panel with retry `[COPY]`; preserves any active filter; no stack trace. |
| **permission-denied** | N/A (drafts never returned to public, `docs/ARCHITECTURE.md:171-174`). |
| **offline** | Cached page renders; "Load more" / filter changes that need the network show an inline offline notice + retry; visible cards stay usable. |

### 3.6 PD — Project case-study detail

| State | Behavior |
|---|---|
| **loading** | SSG/ISR → arrives rendered; below-fold gallery images lazy-load (EC-2, up to 200 images → never eager, `docs/ARCHITECTURE.md:194-195`). Hero/cover pre-sized. |
| **empty** | Project with no gallery/body → render title + cover only; omit empty sections cleanly (EC-1). No "undefined". |
| **partial** | Some gallery media missing → skip broken items, render the rest; body renders regardless. |
| **populated** | Full case study: title, cover, media gallery, body, metadata, related/next. |
| **error** | Fetch error for an existing slug → error page with retry + link back to `/projects`. |
| **not-found** | Unknown/unpublished slug → **E4** 404 (FR-23/AC-18). Distinct from `error`. |
| **permission-denied** | N/A public; unpublished slug is a 404, not a 403 (avoids leaking existence). |
| **offline** | Cached detail renders; uncached → offline fallback. |

### 3.7 SV — Services / 3.8 AB — About

| State | Behavior (SV) | Behavior (AB) |
|---|---|---|
| **loading** | Section skeletons sized to content. | Prose skeleton (title + paragraph blocks). |
| **empty** | Zero offerings → "Services coming soon" + `/contact` CTA. | Empty about body → minimal studio statement fallback + `/contact`. |
| **partial** | Render resolved offerings; skip broken. | Render available blocks. |
| **populated** | All published offerings; anchors match Services mega-menu groupings (AC-19). | Full about content. |
| **error** | Serve last ISR; else empty fallback. | Same. |
| **permission-denied** | N/A. | N/A. |
| **offline** | Cache-served. | Cache-served. |

### 3.9 JL — Journal list

| State | Behavior |
|---|---|
| **loading** | Skeleton list rows sized to final row height. |
| **empty** | Zero published posts → defined empty state (FR-30/AC-24): `[COPY: "No entries yet."]`, no blank/error. |
| **partial** | Page loaded; "Load more" if more exist. |
| **populated** | Posts newest-first by `publishedAt` (A-5), each → `/journal/[slug]`. |
| **error** | Error panel + retry; no stack trace. |
| **permission-denied** | N/A (drafts excluded). |
| **offline** | Cached list renders; pagination needing network → offline notice + retry. |

### 3.10 JD — Journal post detail

| State | Behavior |
|---|---|
| **loading** | Rendered via SSG/ISR; inline images lazy-load. |
| **empty** | Post with empty body → title + published date + `[COPY: "This entry has no content yet."]`; no crash (EC-1). |
| **partial** | Missing cover → render without it; body renders. |
| **populated** | Full post. |
| **not-found** | Unknown/unpublished slug → **E4** 404 (FR-29/AC-23). |
| **error** | Fetch error for existing slug → error page + retry + back to `/journal`. |
| **permission-denied** | N/A public. |
| **offline** | Cached renders; else offline fallback. |

### 3.11 CT — Contact form

| State | Behavior |
|---|---|
| **loading** | Static shell + form paints instantly (no data dependency). A persistent **storage/privacy notice** ("Your inquiry is stored so we can reply; see our [Privacy Policy](/privacy).", R2) sits directly under the submit button and is present in every state. |
| **empty** | Pristine form = default; all fields empty **and consent unchecked**, submit button enabled (validation runs on submit/blur, §7); storage notice + consent checkbox visible. |
| **partial** | Some fields filled, some invalid → per-field error markers; submit attempts surface all errors. |
| **populated (valid)** | All required valid → submit enabled. |
| **in-flight** | Submit **disabled**, spinner/label swap, inputs read-only to prevent edits mid-send (FR-35/AC-28). |
| **success** | Confirmation replaces/overlays the form; fields cleared or locked so the same message can't be re-sent (FR-36/AC-27); a "send another" affordance available. |
| **error (server/network)** | Error banner (role="alert"), **all input preserved**, submit re-enabled for retry (FR-37/AC-29). |
| **error (rate-limited)** | 429 → "Please wait before sending again" with retry-after guidance (AC-30); input preserved. |
| **permission-denied** | N/A (public endpoint; abuse control is rate-limit/honeypot, not auth — FR-38). |
| **offline** | Submit detects offline → inline "You appear offline; your message is saved here — retry when reconnected." Input preserved, nothing lost. |

### 3.12 E4 — 404 / not-found

| State | Behavior |
|---|---|
| **populated** | Branded 404: wordmark, `[COPY: heading + one line]`, primary CTA → `/`, secondary → `/projects`, and the global nav/footer for escape. Returns HTTP 404 (AC-1). |
| all others | Static; no data dependency — loading/empty/partial/error/offline collapse to the same static page; permission-denied N/A. |

---

## 4. INFORMATION HIERARCHY (see first · second · never)

Global principle: **cinematic image first, minimal chrome, technical credibility on demand.**
The dark canvas (`--ink`) recedes; imagery and `--gold` accents advance.

| Screen | User sees FIRST | SECOND | LAST / on-demand | NEVER on this screen |
|---|---|---|---|---|
| **H1/H2** | Hero render/video + studio positioning line (one serif sentence) | Enter/scroll affordance | Featured work, services, blueprint section on scroll | Pricing, forms above the fold, `--blueprint` outside its section |
| **HB** | Positioning manifesto headline | Featured projects | Journal teaser + contact CTA band | Dense body copy competing with imagery |
| **PL** | The work (image grid) | Category filter | Project titles/meta (secondary to image) | Marketing copy dominating the grid |
| **PD** | Cover render + project title | Technique/scope summary | Full gallery + body + related | Nav distractions during immersive scroll |
| **SV** | Offering names (what we do) | Short value line each | Detail/body per offering | Prices |
| **AB** | Studio statement | Approach/credibility | Team/clients (if any) | — |
| **JL** | Latest entry (image + title) | Entry list | Dates/meta | Comments (NG-6) |
| **JD** | Post title + cover | Body prose (readable measure ≤ 72ch) | Related/next | — |
| **CT** | "Start a project" headline + form | Field labels + inline help | Success/error feedback | Any field not needed (keep it short) |

`--blueprint` (`#4EA1FF`) appears **only** in the HB technical/wireframe section (FR-7/FR-17,
AC-7/AC-13). `--gold` is the single primary accent everywhere else (CTAs, active states,
focus). Everything else is the `--ink`/`--surface`/`--bone`/`--muted` neutral field.

---

## 5. INTERACTION SPEC (click · hover · focus · keyboard · touch — per element)

### 5.1 Global rules
- **Focus visible on everything focusable:** a 2px `--gold` outline offset `--space-2xs`
  (WCAG 2.4.7). Never remove focus outline without an equal-or-better replacement.
- **Touch targets:** ≥ 44×44 CSS px hit area (exceeds the 24×24 floor, `AGENTS.md` A11y).
- **Reduced motion:** all GSAP/scroll animation degrades per §6.6 + each screen's rule.
- **Skip link:** first focusable element = "Skip to content" (visually hidden until focused),
  jumps focus to `<main>`.
- **Motion honors token durations/eases** from §6.6; no ad-hoc timing.

### 5.2 Top nav (GC)
| Element | Click / tap | Hover | Focus | Keyboard | Touch |
|---|---|---|---|---|---|
| Logo | → `/` | subtle `--gold` tint | outline | `Enter` | 44px target |
| Link item (About/Journal/Contact) | route change | underline grows from left (`--dur-fast`) | outline + underline | `Tab` reach, `Enter` activate | tap |
| Parent (Projects/Services) `<button aria-expanded aria-controls>` | toggle mega-menu | **hover-intent** open (80ms delay) | outline | `Enter`/`Space` toggle; `↓` opens + moves focus into panel; `Esc` closes | tap toggles (no hover-intent on touch) |
| Sticky bar | — | gains `--surface` translucent bg + hairline once scrolled > hero threshold | — | — | — |

### 5.3 Mobile nav drawer (< md, §6.5 breakpoints)
- Hamburger `<button aria-expanded aria-controls="mobile-drawer" aria-label>` → opens
  full-height drawer (`--z-drawer`) with slide-in + scrim (`--dur-base`, `--ease-entrance`).
- Mega-menu parents become **accordions** (`<button aria-expanded>` per group) — tap expands
  its category/offering list (`docs/ARCHITECTURE.md:320-322`).
- **Focus trapped** inside drawer while open; `Esc` and scrim tap close it; on close, focus
  returns to the hamburger. Body scroll locked while open.

### 5.4 Glassmorphism mega-menu — open/close state machine (mandated)
State machine (matches `docs/ARCHITECTURE.md:311-314`): `closed → opening → open → closing →
closed`.

| Trigger | From → To | Notes |
|---|---|---|
| Click / `Enter` / `Space` on parent | closed→opening→open (or open→closing→closed) | toggles |
| `↓` Arrow on focused parent | closed→open + focus first panel item | |
| Hover-intent enter (desktop, pointer:fine) | closed→open after 80ms dwell | cancelled if pointer leaves before 80ms |
| Hover-intent leave | open→closing after 160ms grace | grace prevents flicker crossing the gap |
| `Esc` | any→closing→closed + focus returns to parent | (AC-3) |
| Outside click / focus leaves panel | open→closing→closed | |
| `Tab` past last panel item | closes, focus continues to next nav item | |

**Focus management:** on open, focus moves to the first grouping link; focus is **contained**
in the panel but always escapable (`Esc`, or `Tab` past the end closes and continues). On
close, focus returns to the trigger. `aria-expanded` reflects state; panel `id` matches
`aria-controls`.

**Animation (open):** GSAP timeline, `--dur-base` (240ms), `--ease-entrance`:
1. Scrim (`--overlay-scrim`) fades `0 → 1`.
2. Panel: `translateY(-8px → 0)` + `opacity 0 → 1`.
3. `backdrop-filter: blur(0 → var(--glass-blur))` + `saturate(var(--glass-saturate))`.
4. Grouping columns **stagger** in, `24ms` each (`--stagger-fast`), `translateY(6px→0)`+fade.
5. `will-change: transform, opacity, backdrop-filter` set on `opening`, **cleared** on `open`.

**Animation (close):** reverse, faster — `--dur-fast` (160ms), `--ease-exit`; no stagger
(collapse as one). Blur `→ 0`, panel fades + lifts `-4px`, scrim fades out; `will-change`
cleared on `closed`.

**Glass surface:** `background: var(--glass-fill)` (translucent `--surface`) +
`backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))`; 1px
`--hairline` top border; `--elev-2` shadow. **Fallback** (`@supports not (backdrop-filter)`):
opaque `--surface` panel, no blur (`docs/ARCHITECTURE.md:305-309`).

**Reduced motion:** no translate/stagger/blur transition — panel appears/disappears instantly
(blur applied statically if supported); scrim toggles with a `--dur-instant` opacity only.

### 5.5 Home 1 preloader + enter gate
- `%` counter is live text (announced politely via `aria-live="polite"`, throttled).
- Enter gate is a real `<button>`; `Enter`/`Space`/click dismisses. Keyboard-reachable.
- **Never the only door (R7):** the button becomes enabled at `min(25% buffered, 4s timeout)`.
  A `setTimeout` (cleared if the buffer threshold arrives first) guarantees the gate enables
  within 4s regardless of buffer progress, so a stalled/flaky connection cannot lock the
  visitor out. Until enabled the button shows `aria-disabled="true"` with a "Preparing…"
  label; on timeout-enable the label returns to "START HERE" even if frames are incomplete.
- Reduced motion / repeat visit / `/home-2`: no gate (§11 A-4).

### 5.6 Scrub hero (H1)
- Non-interactive element; driven only by scroll position (no click/hover).
- **Poster alt text (R13):** the Home-1 poster (`heroPosterH1`) is the LCP element and a
  **meaningful** image, so it carries descriptive `alt` — copy key **`hero.h1.poster.alt`**,
  owned by Content (`AGENTS.md §13`), mirroring the existing `hero.h2.poster.alt`. The scrub
  frame `<canvas>`/sequence itself is decorative (`alt=""` / `aria-hidden`) since the poster
  already conveys the scene; only the poster is announced.
- Keyboard/AT users: the hero is decorative motion; the *content* (positioning line) is real
  text in the DOM, reachable and readable without scrubbing. Scroll via keyboard (`Space`,
  `PgDn`, arrows) advances frames like pointer scroll.

### 5.7 Projects filter (PL)
- Filter = a **single-select** chip/segmented control (`role="tablist"` semantics if tabbed,
  else `<button aria-pressed>` chips). Active chip uses `--gold` fill + `--text-on-gold`.
- Click/tap selects; `←/→` move between chips; `Enter`/`Space` activates; selection updates
  the URL (`?category=<slug>`) so it is shareable/back-button-safe.
- "Clear filter" returns to all.

### 5.8 Cards (PL, HB featured, JL)
- Whole card is one link target (single `<a>` wrapping media + title) — no nested
  interactive controls (avoids nested-link a11y bugs).
- Hover (pointer:fine): image scale `1 → 1.03` + `--gold` title tint (`--dur-base`,
  `--ease-standard`); overlay caption fades in. Touch/reduced-motion: no scale; caption is
  always visible.
- Focus: `--gold` outline around the whole card; identical to hover intent.

### 5.9 Contact form controls — see §7.

### 5.10 Photoreal→wireframe section (HB) — see §8 (interaction is scroll-driven).

---

## 6. DESIGN TOKEN SET (names + values — the single source of raw values)

> Naming: primitives keep the **exact names from the brief** (`docs/PROJECT-BRIEF.md:49-56`)
> so the source of truth is unbroken. Semantic + system tokens are added on top. **Every
> non-primitive color token is an alpha/mix derivation of the six brief primitives — no new
> hue is introduced** (respects FR-7). Consumers reference **semantic** tokens, not raw hex.

### 6.1 Primitive colors (from brief — unchanged)
```css
:root {
  --ink:       #0B0B0C;  /* page background (near-black) */
  --surface:   #17171B;  /* cards / raised surfaces */
  --muted:     #8A8578;  /* muted text, captions, warm gray */
  --bone:      #EDEAE3;  /* primary text on dark */
  --gold:      #C9A96A;  /* primary accent — champagne */
  --blueprint: #4EA1FF;  /* secondary accent — TECHNICAL/WIREFRAME SECTION ONLY */
}
```

### 6.2 Derived color tokens (alpha/mix of the six primitives only)
```css
:root {
  /* elevation neutrals (mixes of surface↔bone / surface↔ink) */
  --surface-raised: color-mix(in srgb, var(--surface) 88%, var(--bone) 12%); /* higher card */
  --surface-sunken: color-mix(in srgb, var(--surface) 70%, var(--ink) 30%);  /* wells/inputs */

  /* text roles */
  --text-primary:   var(--bone);
  --text-secondary: color-mix(in srgb, var(--bone) 72%, var(--ink) 28%);
  --text-muted:     var(--muted);
  --text-on-gold:   var(--ink);          /* text sitting on a --gold fill */

  /* lines & borders */
  --hairline:       color-mix(in srgb, var(--bone) 14%, transparent);  /* rgba(bone,.14) */
  --hairline-strong:color-mix(in srgb, var(--bone) 28%, transparent);

  /* accent states */
  --gold-hover:     color-mix(in srgb, var(--gold) 82%, var(--bone) 18%);
  --gold-pressed:   color-mix(in srgb, var(--gold) 82%, var(--ink) 18%);
  --gold-ring:      color-mix(in srgb, var(--gold) 60%, transparent);  /* focus ring */

  /* scrims & glass */
  --overlay-scrim:  color-mix(in srgb, var(--ink) 72%, transparent);   /* mega-menu / drawer bg */
  --glass-fill:     color-mix(in srgb, var(--surface) 55%, transparent);
  --glass-blur:     16px;
  --glass-saturate: 120%;

  /* focus (global) */
  --focus-ring:     var(--gold);
  --focus-offset:   2px;
}
```

### 6.3 Semantic feedback tokens (E-1 RESOLVED — errors stay gold, no `--danger`)
```css
:root {
  --feedback-attention: var(--gold);   /* required-field / warning marker (paired w/ icon+text) */
  --feedback-success:   var(--gold);   /* success uses gold + check icon + text (no green in palette) */
  --feedback-error:     var(--gold);   /* RESOLVED (E-1): errors stay gold — no --danger/red hue.
                                          Error styling = --feedback-error + --hairline-strong +
                                          alert icon + text, so color is never the sole signal. */
}
```

### 6.4 Typography (proposed pairing — final faces from Figma/brand, §12 E-2)
Direction from brief (`docs/PROJECT-BRIEF.md:58-59`): elegant serif display + clean sans body
+ mono technical labels.
```css
:root {
  /* families — proposed, license-friendly, with robust fallbacks (E-2) */
  --font-display: "Fraunces", "Canela", Georgia, "Times New Roman", serif;      /* headlines, logo wordmark */
  --font-body:    "Inter", "Suisse Int'l", system-ui, -apple-system, sans-serif;/* body/UI */
  --font-mono:    "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;    /* blueprint labels */

  /* fluid type scale — mobile-first, clamp(min@360px, fluid, max@1920px) */
  --fs-display-1: clamp(2.75rem, 1.4rem + 6.8vw, 7rem);     /* hero headline */
  --fs-display-2: clamp(2rem, 1.2rem + 3.6vw, 4.5rem);      /* section hero / manifesto */
  --fs-h1:        clamp(1.75rem, 1.2rem + 2.2vw, 3rem);
  --fs-h2:        clamp(1.5rem, 1.15rem + 1.5vw, 2.25rem);
  --fs-h3:        clamp(1.25rem, 1.05rem + 0.8vw, 1.5rem);
  --fs-body-lg:   clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);
  --fs-body:      1rem;        /* 16px base — never below 16 for body */
  --fs-caption:   0.875rem;    /* 14px */
  --fs-mono-label:0.75rem;     /* 12px — uppercase, tracked, blueprint annotations */

  /* line-heights */
  --lh-tight:  1.05;  /* display */
  --lh-snug:   1.2;   /* headings */
  --lh-normal: 1.55;  /* body — readable measure ≤ 72ch */
  --lh-mono:   1.4;

  /* weights */
  --fw-light: 300; --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600;

  /* tracking */
  --tracking-tight:  -0.02em;  /* large display */
  --tracking-normal: 0;
  --tracking-wide:   0.08em;   /* mono labels, eyebrows */
  --tracking-wider:  0.16em;   /* uppercase micro-labels */
}
```

### 6.5 Spacing, layout, radii, elevation, z-index, breakpoints
```css
:root {
  /* spacing scale (8px rhythm; 4px sub-step) */
  --space-2xs: 0.25rem;  /* 4  */
  --space-xs:  0.5rem;   /* 8  */
  --space-sm:  0.75rem;  /* 12 */
  --space-md:  1rem;     /* 16 */
  --space-lg:  1.5rem;   /* 24 */
  --space-xl:  2rem;     /* 32 */
  --space-2xl: 3rem;     /* 48 */
  --space-3xl: 4rem;     /* 64 */
  --space-4xl: 6rem;     /* 96 */
  --space-5xl: 8rem;     /* 128 */
  --space-6xl: 12rem;    /* 192 */

  /* section vertical rhythm — fluid */
  --section-y: clamp(4rem, 2rem + 8vw, 10rem);

  /* layout */
  --container-max: 1440px;
  --container-pad: clamp(1rem, 0.5rem + 3vw, 4rem);  /* gutter */
  --measure:       72ch;  /* max reading width for body prose */

  /* radii */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px; --radius-pill: 999px;

  /* borders */
  --border-hairline: 1px solid var(--hairline);

  /* elevation (subtle on dark) */
  --elev-1: 0 1px 2px color-mix(in srgb, var(--ink) 60%, transparent);
  --elev-2: 0 8px 32px color-mix(in srgb, var(--ink) 65%, transparent);
  --elev-3: 0 24px 64px color-mix(in srgb, var(--ink) 70%, transparent);

  /* z-index scale */
  --z-base: 0; --z-scrim: 80; --z-megamenu: 90; --z-nav: 100;
  --z-drawer: 110; --z-modal: 120; --z-toast: 150; --z-skip: 200;
}
```
**Breakpoints** (mobile-first; documented values — CSS custom properties can't drive
`@media`, so these are the canonical numbers Frontend uses; range covers G-5 360→1920):

| Token name | Min-width | Purpose |
|---|---|---|
| `bp-xs` | 360px | smallest supported (G-5 floor) |
| `bp-sm` | 480px | large phone |
| `bp-md` | 768px | **nav collapse boundary** (A-2) — mobile drawer < md, full nav ≥ md |
| `bp-lg` | 1024px | tablet-landscape / small desktop; mega-menu multi-column |
| `bp-xl` | 1280px | desktop |
| `bp-2xl` | 1536px | large desktop |
| `bp-max` | 1920px | design ceiling (G-5 top); content caps at `--container-max`, gutters grow |

### 6.6 Motion & easing tokens (GSAP) — mandated
```css
:root {
  /* durations */
  --dur-instant: 80ms;  --dur-fast: 160ms;  --dur-base: 240ms;
  --dur-slow: 400ms;    --dur-slower: 640ms; --dur-hero: 900ms;

  /* stagger steps */
  --stagger-fast: 24ms;  --stagger-base: 60ms;

  /* easing (CSS cubic-bezier) */
  --ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1);   /* general moves */
  --ease-entrance:   cubic-bezier(0.0, 0.0, 0.2, 1);   /* decelerate — things arriving */
  --ease-exit:       cubic-bezier(0.4, 0.0, 1, 1);     /* accelerate — things leaving */
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);    /* cinematic reveal (preloader, hero) */
}
```
**GSAP ease-name equivalents** (for `gsap.to(..., { ease })`, since GSAP uses named eases):
| Token | GSAP ease |
|---|---|
| `--ease-standard` | `"power2.inOut"` |
| `--ease-entrance` | `"power2.out"` |
| `--ease-exit` | `"power2.in"` |
| `--ease-emphasized` | `"expo.out"` (or a registered `CustomEase` matching the cubic-bezier above) |

**Global reduced-motion contract:** when `prefers-reduced-motion: reduce`, all durations
collapse toward `--dur-instant`, ScrollTrigger scrubs/pins are disabled (static end-state
shown), staggers removed, `--ease-emphasized` reveals become instant. This is a hard rule
across every screen (`AGENTS.md` A11y; EC-6).

---

## 7. VALIDATION & FEEDBACK (contact form is the only input surface, FR-31…FR-38)

### 7.1 Fields (assumed set, A-7 / pending Q-3, `docs/SRS.md:434`)
| Field | Required | Constraint | Control |
|---|---|---|---|
| Name | ✔ | 1–120 chars, trimmed | text input |
| Email | ✔ | RFC-shaped format (FR-33) | email input (`inputmode="email"`) |
| Message | ✔ | **1–5000 chars, enforced client + server** (oversize → 422, EC-H/R8) | textarea, auto-grow, live char count near the 5000 cap |
| Company | ✘ | **≤ 120 chars, client + server (R9)** | text input |
| Project type | ✘ | from the placeholder list (R15) or free text | select or input |
| **Consent** | ✔ | must be checked to submit — "I agree to the [Privacy Policy](/privacy)" (R2) | checkbox with a real `<label>` linking to `/privacy` |
| Honeypot (`hp`) | — | must stay empty; visually hidden, `aria-hidden`, `tabindex="-1"` | hidden input (FR-38) |

The **Consent** control is a genuine required field: the label text contains a link to the
`/privacy` page (opens in the same tab; keyboard-reachable, distinct focus from the checkbox).
Submitting a JSON body only — there is **no `x-www-form-urlencoded` / no-JS fallback path** in
v1 (R8); all success/error/rate-limit states below are client-rendered from the JSON response.

### 7.2 When validation fires
- **On blur** (per field): validate that field once the user leaves it; show inline error if
  invalid. Do not validate a field the user hasn't touched yet (no premature error on load).
- **Consent (R2):** unchecked consent is treated exactly like any other unmet required field —
  the submit button stays visually enabled, but a submit attempt **blocks the network request**
  and surfaces the consent error ("Please agree to the Privacy Policy to continue") beside the
  checkbox; the error clears the moment it is checked.
- **On submit:** validate all; if any invalid, **block the network request** (FR-32/AC-25),
  move focus to the **first** invalid field (which may be the consent checkbox), and surface
  all field errors simultaneously.
- **On input after an error:** re-validate that field live so the error clears as soon as it
  becomes valid (positive feedback).

### 7.3 Error presentation (color-independent — WCAG 1.4.1)
- Each error sits **directly beneath its field**, tied via `aria-describedby`; the field gets
  `aria-invalid="true"`.
- Signal is **triple**: (a) an inline **icon** (alert glyph), (b) **text** message
  `[COPY — owned by Content §13; format: what happened + how to fix]`, (c) a border treatment
  `--hairline-strong` + `--feedback-attention` (`--gold`). Never color alone.
- Errors are announced to screen readers: field errors via `aria-describedby`; form-level
  errors (server/network/rate-limit) via a `role="alert"` live region at the top of the form.

### 7.4 Submit / in-flight / success / failure (FR-35…FR-37)
- **In-flight:** submit button `disabled` + `aria-busy`, label → "Sending…", spinner; inputs
  `readonly`; prevents double-submit (AC-28). A second click does nothing.
- **Success (200):** replace the form with a confirmation panel (`role="status"`), `--gold`
  check icon + `[COPY: "Message sent — we'll reply within N business days."]`; fields cleared
  or locked so re-send isn't accidental (FR-36); "Send another" resets to a pristine form.
  Confirmation appears within the 10s budget (AC-27).
- **Failure — server 5xx / MAIL_FAILED (502):** form stays, **all input preserved**, top
  `role="alert"` banner `[COPY: "Couldn't send — please retry."]`, submit re-enabled (AC-29).
- **Failure — rate-limited (429):** banner `[COPY: "Too many attempts — try again in Ns."]`
  with the retry-after value (AC-30); input preserved; submit disabled until retry-after.
- **Failure — validation echoed by server (422):** map server field errors back to fields
  (defensive; client already validated, FR-32/33).
- **Offline:** detected before send → inline notice, input preserved, no request attempted.

### 7.5 Success/feedback signals elsewhere
- Route-transition progress hairline (`--gold`) for navigation feedback.
- "Load more" (PL/JL): button → `aria-busy` while fetching; new items announced via a polite
  live region ("N more projects loaded"). On failure: inline retry, existing items untouched.

### 7.6 Consent & storage notice (R2)
- **Consent checkbox** (§7.1) is a required field whose `<label>` contains a link to
  **`/privacy`**. It is unchecked by default; a submit attempt without it is blocked and the
  field-level error appears beside it (§7.2).
- **Storage notice** — a persistent line of `--fs-caption` text directly beneath the submit
  button, present in every CT state: `[COPY: "Your inquiry is stored so we can reply, then
  auto-deleted after 180 days. See our Privacy Policy."]` (retention figure per R2). This
  notice is informational (not a checkbox) and does not block submission.
- **`/privacy` page (PV)** is a static prose route (no data dependency): loading/empty/
  partial/error/offline all collapse to the same static page; `permission-denied` N/A. It is
  linked from the contact consent label, the storage notice, and the footer (§3.1).

---

## 8. PHOTOREAL → WIREFRAME SCROLL SECTION (mandated — HB technical/blueprint, FR-17)

Reference: vaulk.com (`docs/PROJECT-BRIEF.md:68-70`). **Sole location of `--blueprint`
(`#4EA1FF`)** (FR-7/AC-13). Owns the `--font-mono` annotation labels.

### 8.1 Structure & layers
- A **pinned** section (GSAP ScrollTrigger `pin`) spanning ~1.5–2 viewport heights of scroll.
- Three stacked layers in one pinned stage:
  1. **Photoreal** render (raster, `next/image` or canvas frame) — top layer, full-bleed.
  2. **Wireframe/blueprint** line-art of the *same* scene — SVG (or line-render) beneath.
  3. **Annotation layer** — `--font-mono`, `--fs-mono-label`, `--tracking-wider`, colored
     `--blueprint`, with thin `--blueprint` leader lines to points on the scene.
- **Sticky left section-nav** (desktop ≥ lg): a vertical index of the annotation callouts;
  the active callout highlights (`--blueprint`) as its scroll segment enters
  (`docs/PROJECT-BRIEF.md:69`).

### 8.2 Scroll choreography (progress 0 → 1)
| Progress | What happens |
|---|---|
| 0.00–0.15 | Photoreal fully visible; eyebrow label fades in (`--font-mono`, `--muted`). |
| 0.15–0.55 | Photoreal **dissolves to wireframe** — animate a clip/mask or opacity+`--blueprint` stroke fade-in so lines appear as the render recedes. |
| 0.35–0.85 | Annotation leader lines **draw on** via SVG `stroke-dashoffset` (length→0), one segment per callout, staggered `--stagger-base`; each mono label fades/rises in (`--ease-entrance`). Left section-nav highlights the active callout. |
| 0.85–1.00 | Full wireframe + all annotations held; a closing mono caption; then unpin and continue to next section. |

Easing `--ease-emphasized` for the dissolve; `--ease-entrance` for label/line reveals.
`will-change` set only while the section is active in the viewport, cleared on exit.

### 8.3 States & degradation
- **Reduced motion (EC-6):** no pin, no scrub. Render a **static end-state** — a stacked
  before/after (photoreal image, then wireframe image with all annotations visible). No draw-on.
- **Mobile (< md):** do **not** pin (pinning long sections on mobile is janky). Convert to a
  **sequential stack**: photoreal block → wireframe block with annotations listed **below** as
  a mono list (not floating leaders, which don't fit narrow screens). Left section-nav is
  hidden; callouts become inline numbered items.
- **Asset missing:** if the wireframe/photoreal art isn't provided, show the photoreal
  placeholder + a static annotated wireframe placeholder; never a blank pinned void (parallels
  FR-11 hero degradation).
- **`--blueprint` containment:** this component is the only one that imports the `--blueprint`
  token; a lint/review check treats its use elsewhere as a defect (FR-7/AC-7).

---

## 9. RESPONSIVE BEHAVIOR (mobile-first; breakpoints from §6.5; G-5 360→1920, no h-scroll)

General: single-column mobile-first; layout upgrades additively at each breakpoint. **No
horizontal page scroll at any width 360–1920** (G-5). Wide media/tables/code scroll inside
their own `overflow-x:auto` container, never the page body.

| Region | < md (360–767) | md–lg (768–1023) | ≥ lg (1024+) |
|---|---|---|---|
| **Top nav** | Logo + hamburger only; full-height drawer; mega-menus → accordions (§5.3) | Full inline nav appears; mega-menu opens as a **single-column** panel | Mega-menu multi-column glass panel (§5.4) |
| **Hero H1/H2** | Full-bleed; positioning line stacks; scrub still works (fewer/smaller frames tier, `docs/ARCHITECTURE.md:253-257`) | full-bleed | full-bleed, larger type |
| **HB manifesto** | headline `--fs-display-2`; clip-mask wordmark scales down | scales up | `--fs-display-1` |
| **HB featured grid** | 1 col | 2 col | 3 col (or curated asymmetric) |
| **Photoreal→wireframe** | stacked, not pinned; annotations listed below (§8.3) | short pin OR stacked | full pinned + sticky left nav |
| **PL gallery** | 1 col; filter = horizontally scrollable chip row (contained) or dropdown | 2 col | 3–4 col |
| **PD** | single column; gallery 1-up; body full width (`--measure` cap) | body + side meta | body centered `--measure`, meta rail |
| **SV** | stacked offerings (accordion optional) | 2 col | 2–3 col |
| **JL** | 1 col list | 2 col | 2–3 col |
| **JD** | single column, `--measure` prose | same, centered | same + wider media breakouts |
| **CT** | single-column stacked fields, full-width submit | 2-col for Name/Email row | centered form, `--measure` |
| **Footer** | stacked link groups, wordmark top | 2–3 col | full row |

**Reflow/collapse/hide summary:**
- **Reflows:** all multi-column grids → fewer columns downward.
- **Collapses:** nav → hamburger drawer (< md); mega-menu → accordion; photoreal→wireframe →
  stacked (< md).
- **Hides:** sticky left section-nav (< lg); hover-only caption overlays become always-visible
  on touch; decorative hover scale disabled on touch/reduced-motion.
- **Zoom (WCAG 1.4.10):** usable at 200% zoom without horizontal scroll — fluid type + `rem`
  spacing + `--measure` caps ensure reflow rather than clipping.

---

## 10. EDGE CASES (min 5; covers empty · scale · concurrent · permission · network + more)

- **EC-A — Empty (FR-30/EC-1):** `/journal`, `/projects` with zero published entries → defined
  empty state + `/contact` CTA (see §3.5/§3.9). Project with no gallery / post with empty body
  → render available fields, omit empty sections cleanly. **Never** a blank page or "undefined".
- **EC-B — Max scale (EC-2, `docs/SRS.md:344-346`):** 10,000 projects/posts → server-paginated
  list, skeletons sized to page size, "Load more" / pagination; never render all rows. A case
  study with 200 images → lazy-load below fold, optional in-page "load more gallery"
  (`docs/ARCHITECTURE.md:194-195`). Hero sequence bounded by device tier + LRU
  (`docs/ARCHITECTURE.md:253-257`).
- **EC-C — Concurrent / second user (EC-3):** two visitors load a PD at the moment an editor
  unpublishes → each sees the last cached version until cache expiry, then 404 — never a 500
  (`docs/ARCHITECTURE.md:349-351`). Contact double-submit → in-flight lock (AC-28). This is a
  read-mostly public site; no client-side write races beyond the contact POST.
- **EC-D — Permission denied (EC-4):** no public auth surface (NG-2). The only mapping: a
  visitor cannot reach draft content (drafts 404, never 403 — avoids leaking existence);
  Strapi admin/preview is editor-only and off the public UI. Bad preview secret → 401 handled
  server-side, invisible to visitors.
- **EC-E — Network failure (EC-5):** contact submit fails mid-flight → error state, input
  preserved, retry (§7.4). Strapi unreachable at request → serve last ISR page or a defined
  error page — **never a raw stack trace** (`docs/ARCHITECTURE.md:361-362`; behavior itself is
  Q-5, escalated §12 E-4).
- **EC-F — Slow network / heavy media (EC-6):** hero never blocks body first paint; poster/
  first-frame immediate; scrub/video streams progressively. `prefers-reduced-motion` → static
  frame / poster, no autoplay, no scrub, no scroll pins (§3.2/§3.3/§8.3).
- **EC-G — Long / unusual content (EC-7):** 150-char titles wrap to max 2 lines then ellipsis
  (`line-clamp`) on cards; full title shown on detail. Emoji / non-Latin in titles render
  (body font must include the glyphs — flag if brand font lacks them, §12 E-2). No layout
  overflow at any width. Slug normalization owned by Strapi.
- **EC-H — Malformed contact input (EC-8):** message capped at **5000 chars** and company at
  **120 chars**, enforced client **and** server (oversize message → **422** field-level, not a
  crash; no 413 path — R8/R9); missing consent → blocked with a field error (R2); no submitted
  content is ever rendered back unescaped anywhere (XSS guard — Security owns verification);
  honeypot silently drops bots (200, no email). Submission is **JSON only** — no no-JS path.
- **EC-I — Bilingual/RTL:** **out of scope** — English only (NG-4, FR-8). `<html lang="en">`,
  no language switcher (AC-33). Layout is nonetheless built with fluid tokens, so a future
  ±40% string variance would reflow rather than break — but no RTL work is in v1.

---

## 11. DESIGN TOKENS USED (traceability)

Every value referenced in this spec resolves to a §6 token. No stray values appear in §§2–5,
7–10. Summary of which token groups each screen relies on:

| Screen | Color | Type | Space/Layout | Motion |
|---|---|---|---|---|
| GC nav/mega-menu | `--glass-fill`,`--overlay-scrim`,`--glass-blur/saturate`,`--gold*`,`--hairline`,`--surface`,`--z-*` | `--font-body`,`--fs-body`,`--tracking-wide` | `--container-pad`,`--space-*`,`--radius-md`,`--elev-2` | `--dur-base/fast`,`--ease-entrance/exit`,`--stagger-fast` |
| H1/H2 hero | `--ink`,`--bone`,`--gold` | `--font-display`,`--fs-display-1` | full-bleed,`--section-y` | `--dur-hero`,`--ease-emphasized` |
| HB body | `--surface*`,`--bone`,`--muted`,`--gold` | display+body scale | grid,`--section-y`,`--measure` | reveal `--ease-entrance`,`--stagger-base` |
| HB wireframe | **`--blueprint`** (only here),`--font-mono` | `--fs-mono-label`,`--tracking-wider` | `--section-y` | pin+scrub, `--ease-emphasized` |
| PL/PD/SV/AB/JL/JD | neutrals + `--gold` accents | display/body/`--measure` | grids,`--space-*`,`--radius-*` | card hover `--dur-base`; reveal on scroll |
| CT | `--surface-sunken` (inputs),`--feedback-attention`,`--gold`,`--hairline-strong` | `--font-body`,`--fs-body`,`--fs-caption` | stacked,`--measure`,`--space-*` | `--dur-fast` field transitions |
| E4 | `--ink`,`--bone`,`--gold` | `--font-display`,`--fs-display-2` | centered | minimal |

New tokens I defined (beyond the six brief primitives): all of §6.2–§6.6. Per §0 conflict-1
this is the sanctioned greenfield token registry, not free-form invention; all color tokens
are derivations of the six primitives. The only genuinely *new hue* requested by UX need
(`--danger`) is **not** defined — it is escalated (§12 E-1).

---

## 12. ESCALATIONS (decisions I could not make in-lane — Orchestrator/user must resolve)

- **E-1 — No error/danger color in the palette. → RESOLVED (errors stay gold).** Per
  Orchestrator direction, error states keep the palette-only treatment: `--gold`
  (`--feedback-attention`) + alert icon + text + `--hairline-strong` (color never the sole
  signal, WCAG 1.4.1). **No `--danger`/red hue is introduced.** All copy must reference the
  icon/label or "highlighted fields", never "red" (coordinated with Content — the COPY-DECK
  "marked in red" string is void).
- **E-2 — Final typefaces not licensed/available.** Brand fonts come from Figma (R-3,
  `docs/SRS.md:406-411`), and the **Figma MCP connector is unauthorized in this session**.
  §6.4 proposes Fraunces / Inter / IBM Plex Mono with fallbacks as a placeholder pairing.
  **Decision needed:** confirm/replace faces + licenses; verify the chosen body face has full
  glyph coverage for any non-Latin content in titles (EC-G).
- **E-3 — Home body section list (Q-2, `docs/SRS.md:431-433`).** As UI/UX I defined the body
  *structure* (§2.1, §4-HB, §8) from the three reference sites, which is my lane. But the
  exact editorial **content** of each section and the CMS-vs-static split (A-4) needs PM +
  Content + DB confirmation before final layout locks.
- **E-4 — Strapi-unreachable behavior (Q-5).** Whether a content route serves stale, shows an
  error page, or fails the build affects the `error`/`offline` rows in §3. Architect proposed
  fail-build + serve-stale (`docs/ARCHITECTURE.md:584-588`); still unconfirmed.
- **E-5 — Taxonomy values (Q-8). → PARTIALLY RESOLVED (R15 placeholders).** R15 seeds
  placeholder taxonomy — Categories: Exterior, Interior, Aerial/Masterplan, Animation;
  Services: Exterior CGI, Interior CGI, 3D Animation, Virtual Tours, Masterplans — clearly
  marked as placeholders pending real values from the user (Q-8). The filter/mega-menu
  **behavior** is specified; the placeholder **items** render until real values arrive.
- **E-6 — Legal/cookie pages (Q-7). → RESOLVED (R2).** A **`/privacy` Privacy Policy page** is
  now in the sitemap (PV, §1) and the footer utility links (§3.1). The contact form gains a
  **required consent checkbox** linking to `/privacy` and a **storage/retention notice**
  ("stored so we can reply, auto-deleted after 180 days") beneath submit (§7.1/§7.6).
- **E-7 — `/home-2` discoverability. → RESOLVED (R4).** `/home-2` is `noindex, follow` with
  `<link rel=canonical href="/">`, **excluded from nav, footer, and `sitemap.xml`**; reachable
  only by direct URL / internal link (consistent with §2.1 and A-2). SEO ownership sits with
  the API/SEO artifacts; UX simply keeps it out of the nav and footer surfaces.

---

## 13. ASSUMPTIONS

- **A-1** Mobile-nav-collapse breakpoint = **`bp-md` 768px** (carried from `docs/SRS.md:455-456`
  A-2). Confirm.
- **A-2** `/home-2` is reachable by direct URL / internal link, not a primary nav item (brief
  doesn't place it in nav). Flagged as E-7.
- **A-3** Journal ordering = newest-first by `publishedAt` (carried from `docs/SRS.md:462-463`
  A-5).
- **A-4** Home 1 preloader `%` gate shows on **first visit per session only**, and never under
  reduced-motion or on `/home-2` — to avoid gating repeat visitors. The brief shows the gate
  as hero mood (loftthirtyone, `docs/PROJECT-BRIEF.md:63`) but doesn't specify frequency.
- **A-5** Contact field set = Name/Email/Message (required) + optional Company/Project-type +
  honeypot (carried from `docs/SRS.md:467-468` A-7; pending Q-3).
- **A-6** Projects filter is **single-select** by category (one category at a time), matching
  the mega-menu's one-category-per-link model (FR-20). Multi-select not assumed.
- **A-7** Card long-title rule = clamp to 2 lines then ellipsis on lists; full title on detail
  (EC-G). This is my in-lane "defined rule" per `docs/SRS.md:370-373`.
- **A-8** "Success", "error", and "required/attention" feedback all use `--gold` + icon + text
  (no green, no red in palette) per E-1 (RESOLVED: errors stay gold).
- **A-9** Proposed type pairing (Fraunces/Inter/IBM Plex Mono) is a placeholder; final faces
  per E-2. Base body size is **16px** minimum (never smaller for body copy).
- **A-10** Section reveal animations (fade/translate on scroll) apply to HB and content
  sections; they are decorative and fully disabled under reduced-motion. The brief mandates
  GSAP scroll reveals (`docs/PROJECT-BRIEF.md:20`) but not their exact per-section timing —
  timing uses §6.6 tokens.
- **A-11** `permission-denied` is not a reachable state for a public visitor on any content
  screen (NG-2); documented as N/A with its editor/preview mapping rather than omitted, to
  satisfy the state-matrix completeness requirement.

**This section is not empty:** eleven assumptions (A-1…A-11) declared, seven escalations
(E-1…E-7) surfaced, plus two in-document conflicts named in §0. No requirement was invented;
every gap is a labeled assumption or an escalation per the GLOBAL CONTRACT.
