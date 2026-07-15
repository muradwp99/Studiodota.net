# Studiodota.net — Software Requirements Specification (SRS)

> Role: Project Manager / Business Analyst (AGENTS.md §1).
> Source of truth: `docs/PROJECT-BRIEF.md`. Governed by `AGENTS.md` GLOBAL CONTRACT.
> This document is spec + acceptance criteria only. No production code is defined here.
> Version: 1.1 — 2026-07-14 (critique iteration 1: applied R2, R3, R4, R6, R7 from
> `docs/PROJECT-BRIEF.md` §9b; added FR-43…FR-49 and AC-34…AC-40).

---

## 1. PROBLEM STATEMENT

Studiodota is an architectural 3D-rendering / CGI studio (`docs/PROJECT-BRIEF.md:11-12`).
It has **no marketing or portfolio website today**, so:

- **Who is affected:** Prospective clients (architects, developers, real-estate marketers,
  brands) who evaluate CGI studios, and the studio owner who currently has no owned channel
  to present work or receive qualified inquiries.
- **What breaks today:** There is no place to (a) view the studio's rendered work as
  case studies, (b) understand the services offered, or (c) submit a project inquiry.
  Prospects who hear of the studio cannot self-serve any of this; every inquiry depends on
  a direct personal introduction.
- **How often:** Every prospect evaluation and every inbound-lead attempt. 100% of
  discovery and inquiry traffic currently has no destination.
- **The bar:** Competitor studios present cinematic, technically credible portfolios
  (evidence: `docs/PROJECT-BRIEF.md:61-70` — loftthirtyone.com, findrealestate.com,
  vaulk.com). Studiodota needs a site that matches that presentation quality and converts
  visitors into contact-form submissions.

---

## 2. GOALS

Each goal is measurable and verifiable at launch.

- **G-1** Ship a public marketing + portfolio website covering exactly the route groups
  in the sitemap (`docs/PROJECT-BRIEF.md:31-39,115`): `/`, `/home-2`, `/projects` (+ detail),
  `/services`, `/about`, `/journal` (+ detail), `/contact`, and `/privacy` (Privacy Policy,
  added per `docs/PROJECT-BRIEF.md:115` R2). `/home-2` is `noindex` and excluded from
  `sitemap.xml` per R4 (see FR-47).
- **G-2** Deliver two home-page variants (`/` and `/home-2`) that share an identical body
  and differ only in the hero (`docs/PROJECT-BRIEF.md:25-30`).
- **G-3** All body content on Projects, Journal, Services, and About is editable through
  Strapi v5 without a code deploy (`docs/PROJECT-BRIEF.md:18`). Publishing a change in
  Strapi makes it visible on the site within 60 seconds of the next page request
  (assumption, see §9 A-6).
- **G-4** A visitor can submit a contact inquiry that reaches the studio by email
  (`docs/PROJECT-BRIEF.md:80`), with a delivered success or failure signal shown to the
  visitor within 10 seconds of submission.
- **G-5** Every page renders correctly and is operable at viewport widths from 360px
  (mobile) to 1920px (desktop), with no horizontal page scroll at any width in that range.
- **G-6** Every page meets WCAG 2.2 AA (delegated to A11y reviewer; this SRS states it as
  an acceptance gate, not an implementation).
- **G-7** Largest Contentful Paint ≤ 2.5s and Cumulative Layout Shift ≤ 0.1 on a
  simulated throttled-mobile profile (3G-class bandwidth, 4× CPU slowdown) for every route (target; measured by
  SEO/Perf role, see §8 R-4).

---

## 3. NON-GOALS (mandatory, non-empty)

- **NG-1** No multi-tenancy. Single-tenant marketing site; no tenant scoping of data
  (`docs/PROJECT-BRIEF.md:79`).
- **NG-2** No end-user accounts, login, authentication, or authorization on the public
  site. The only privileged surface is the Strapi admin, used by studio staff
  (`docs/PROJECT-BRIEF.md:80`).
- **NG-3** No payments, e-commerce, checkout, or pricing transactions
  (`docs/PROJECT-BRIEF.md:79`).
- **NG-4** No internationalization / localization layer. English only
  (`docs/PROJECT-BRIEF.md:24`).
- **NG-5** No live WebGL / real-time 3D rendering in the hero. The Home 1 hero is a
  pre-rendered image-sequence scrub (`docs/PROJECT-BRIEF.md:22-23`).
- **NG-6** No comment system, user-generated content, or social login on the Journal.
- **NG-7** No search feature across the site in v1 (not mentioned in the brief; see §9 A-9).
- **NG-8** No email newsletter / subscription capture in v1 (not in brief; see §9 A-10).

---

## 4. USER STORIES

- **US-1** As a **prospective client**, I want to see the studio's rendered work as case
  studies, so that I can judge whether its quality fits my project.
- **US-2** As a **prospective client**, I want to filter/browse projects by category or
  type, so that I can find work relevant to my sector.
- **US-3** As a **prospective client**, I want to read a full case study for one project,
  so that I understand scope, technique, and outcome.
- **US-4** As a **prospective client**, I want to understand the services offered, so that
  I know whether the studio does the work I need.
- **US-5** As a **prospective client**, I want to submit a project inquiry through a form,
  so that I can start a conversation without needing a personal introduction.
- **US-6** As a **first-time visitor**, I want a cinematic home page that communicates the
  studio's positioning within the first screen, so that I decide to keep scrolling.
- **US-7** As a **returning visitor on a slow connection**, I want the home page hero to
  degrade to a lighter experience, so that I am not blocked by heavy media.
- **US-8** As a **reader**, I want to browse the studio's journal / blog posts, so that I
  can assess its expertise and process.
- **US-9** As a **studio content editor**, I want to add, edit, and unpublish projects,
  journal posts, and service entries in Strapi, so that I can keep the site current without
  a developer.
- **US-10** As a **studio owner**, I want every contact submission delivered to a monitored
  email inbox with the submitter's details, so that no lead is lost.
- **US-11** As a **keyboard-only or screen-reader user**, I want to operate the navigation,
  mega-menu, and contact form without a mouse, so that I can use the site.
- **US-12** As a **mobile visitor**, I want the top navigation and mega-menu to collapse
  into a usable mobile menu, so that I can navigate on a narrow screen.
- **US-13** As a **search-engine crawler**, I want each page to expose a unique title, meta
  description, canonical URL, and structured data, so that pages are indexed correctly.

---

## 5. FUNCTIONAL REQUIREMENTS

Atomic and testable. Grouped by area. IDs are stable.

### 5.1 Global / cross-cutting

- **FR-1** The site exposes exactly these routes and no other public routes:
  `/`, `/home-2`, `/projects`, `/projects/[slug]`, `/services`, `/about`, `/journal`,
  `/journal/[slug]`, `/contact`, `/privacy` (`docs/PROJECT-BRIEF.md:31-39,115`). `/privacy`
  is the Privacy Policy page required by R2 (see FR-45); it is added to `sitemap.xml`.
  `/home-2` is excluded from `sitemap.xml` (R4, FR-47) but remains a reachable public route.
- **FR-2** A sticky top navigation bar is present on every page and remains fixed to the
  top of the viewport while the page scrolls (`docs/PROJECT-BRIEF.md:41`).
- **FR-3** Navigation items that have sub-sections open a mega-menu on activation; the
  mega-menu surface uses a glassmorphism treatment and animates open and closed
  (`docs/PROJECT-BRIEF.md:41-44`). Mega-menu parents are **Projects** (grouped by
  category/type) and **Services** (grouped by offering) (`docs/PROJECT-BRIEF.md:44`).
- **FR-4** At viewport widths below the mobile breakpoint (see §9 A-2, assumed <768px), the
  top nav collapses into a toggle control that opens a full-height mobile menu containing
  the same navigation targets, including the mega-menu groupings.
- **FR-5** Every page renders a footer containing at minimum: studio name/wordmark,
  navigation links to all top-level sitemap pages, and a contact link/route.
  (Footer contents beyond this are a UI/UX decision; see §9 A-3.)
- **FR-6** Each of the 7 route groups sets a unique `<title>`, a unique meta description, a
  canonical URL, and Open Graph tags (`docs/PROJECT-BRIEF.md` design refs + US-13).
- **FR-7** Color usage is restricted to the six palette tokens in
  `docs/PROJECT-BRIEF.md:49-56`. `--blueprint` (`#4EA1FF`) is used **only** in the
  technical wireframe / annotation section (`docs/PROJECT-BRIEF.md:47-48,56`); its use
  anywhere else is a defect.
- **FR-8** The site is served in English only; no language switcher exists
  (`docs/PROJECT-BRIEF.md:24`).

### 5.2 Home 1 — `/` (3D scrub hero)

- **FR-9** `/` renders a hero that is a GSAP + ScrollTrigger-driven image-sequence scrub:
  frames advance as the user scrolls, not on a wall-clock timer
  (`docs/PROJECT-BRIEF.md:22-23,27-28`).
- **FR-10** The hero frame shown is deterministically bound to scroll progress: at scroll
  progress 0% the first frame is shown; at 100% of the hero's scroll range the last frame
  is shown; intermediate progress maps monotonically to intermediate frames.
- **FR-11** If the image-sequence frames are unavailable (assets not yet provided —
  `docs/PROJECT-BRIEF.md:72-73`), the build uses placeholder frames and the page still
  renders and scrolls without error.
- **FR-12** Below the hero, `/` renders the shared home body (see FR-16).

### 5.3 Home 2 — `/home-2` (video hero)

- **FR-13** `/home-2` renders the identical page layout and body as `/`, differing only in
  the hero (`docs/PROJECT-BRIEF.md:29-30`).
- **FR-14** The `/home-2` hero background is a looping video only, with no scroll-scrub
  behavior (`docs/PROJECT-BRIEF.md:30`).
- **FR-15** If the hero video asset is unavailable (`docs/PROJECT-BRIEF.md:74`), the build
  uses a placeholder video/poster and the page renders without error.

### 5.4 Shared home body (both variants)

- **FR-16** Both home variants share a single body composition below the hero. The body's
  section order and content are defined by UI/UX using the referenced patterns
  (`docs/PROJECT-BRIEF.md:61-70`) and are populated from CMS where content is editorial
  (see §9 A-4 for the exact section list, which the brief does not fully enumerate).
- **FR-17** The home body includes one technical wireframe / blueprint-annotation section
  that is the sole permitted location for the `--blueprint` accent
  (`docs/PROJECT-BRIEF.md:47-48`; ref vaulk.com `docs/PROJECT-BRIEF.md:68-70`).
- **FR-18** The home body surfaces a curated set of featured projects, each linking to its
  `/projects/[slug]` detail page.

### 5.5 Projects — `/projects` and `/projects/[slug]`

- **FR-19** `/projects` renders a gallery of all published projects sourced from Strapi
  (`docs/PROJECT-BRIEF.md:35`).
- **FR-20** `/projects` allows filtering the gallery by project category/type; the set of
  categories is the same taxonomy used by the Projects mega-menu (FR-3).
- **FR-21** Each project card links to `/projects/[slug]`, where `[slug]` is the project's
  unique, URL-safe slug from Strapi.
- **FR-22** `/projects/[slug]` renders a case-study detail page populated from the project
  entry in Strapi (title, imagery/media, body content, and any metadata fields defined by
  the Strapi content type — content model owned by Architect/CMS, see §8 R-1).
- **FR-23** Requesting `/projects/[slug]` for a slug that does not exist or is not published
  returns an HTTP 404 with the site's 404 page.

### 5.6 Services — `/services`

- **FR-24** `/services` renders the studio's service offerings sourced from Strapi
  (`docs/PROJECT-BRIEF.md:36`). Offerings are the same set used to group the Services
  mega-menu (FR-3).

### 5.7 About — `/about`

- **FR-25** `/about` renders studio/about content sourced from Strapi
  (`docs/PROJECT-BRIEF.md:37`).

### 5.8 Journal — `/journal` and `/journal/[slug]`

- **FR-26** `/journal` renders a list of published journal posts sourced from Strapi,
  newest first by publish date (`docs/PROJECT-BRIEF.md:38`; ordering is an assumption,
  §9 A-5).
- **FR-27** Each journal list item links to `/journal/[slug]`.
- **FR-28** `/journal/[slug]` renders a single post populated from Strapi.
- **FR-29** Requesting `/journal/[slug]` for a slug that does not exist or is not published
  returns an HTTP 404 with the site's 404 page.
- **FR-30** When there are zero published journal posts, `/journal` renders a defined empty
  state (copy owned by Content; see §7 EC and §8 R-2), not a blank page or error.

### 5.9 Contact — `/contact`

- **FR-31** `/contact` renders a contact form. Field set (assumed; §9 A-7): Name
  (required), Email (required), Message (required), and optional Company and Project-type.
  The final field set must be confirmed (§9 Q-3).
- **FR-32** On submit, the form validates required fields client-side and shows field-level
  error messages adjacent to each invalid field before any network request is made.
- **FR-33** The Email field is validated against a defined email format; an invalid email
  produces a field-level error and blocks submission.
- **FR-34** On a valid submit, the form sends the submission to a server endpoint that
  emails the studio inbox (`docs/PROJECT-BRIEF.md:80`). Delivery mechanism (Strapi email
  plugin, Next.js route handler, or third-party email service) is an Architect decision
  (§8 R-1); this FR only requires that a valid submission results in an email to the studio.
- **FR-35** While the submission request is in flight, the submit control is disabled to
  prevent double submission, and a loading indicator is shown.
- **FR-36** On a successful submission, the form shows a success confirmation and clears or
  locks the input fields so the same submission is not accidentally re-sent.
- **FR-37** On a failed submission (network or server error), the form shows an error state,
  preserves all entered input, and allows the visitor to retry.
- **FR-38** The contact endpoint applies spam mitigation (rate limiting and/or a
  bot-detection measure that is not a CAPTCHA requiring the visitor to solve external
  challenges). Exact mechanism is an Architect/Security decision (§8 R-1, §9 Q-4).

### 5.10 CMS (Strapi v5) — content operations

- **FR-39** Studio editors can create, edit, publish, and unpublish Project, Journal-post,
  and Service entries via the Strapi admin, using Strapi's Draft & Publish
  (`docs/PROJECT-BRIEF.md:18`).
- **FR-40** Only entries in the "published" state appear on the public site; "draft"
  entries never appear on any public route.
- **FR-41** Unpublishing an entry removes it from its list page and causes its detail route
  to return 404 (per FR-23 / FR-29) on the next request after cache expiry (§9 A-6).
- **FR-42** The public site consumes Strapi via REST or GraphQL
  (`docs/PROJECT-BRIEF.md:18`); the choice is an Architect/API-Designer decision (§8 R-1).

### 5.11 Contact persistence, consent & privacy (R2 — `docs/PROJECT-BRIEF.md:85-89`)

- **FR-43** In addition to emailing the studio (FR-34), a valid contact submission is
  **persisted** to a `ContactSubmission` record in Strapi. The record stores at minimum:
  `name`, `email`, `message`, optional `company`, optional `projectType`, a `status`
  enum (`new` | `read` | `archived`, default `new`), `ipHash` (a non-reversible hash of the
  submitter IP, not the raw IP), `userAgent`, and `createdAt`. The write is performed by the
  server endpoint using a **server-only Strapi token**; the public site never exposes a write
  credential or write capability to the browser (upholds NG-2, EC-4). The prior "no
  persistence" position is void (`docs/PROJECT-BRIEF.md:88`).
- **FR-44** The contact form includes a **required consent checkbox** labelled to the effect
  of "I agree to the privacy policy", with the phrase "privacy policy" linking to `/privacy`
  (FR-45). Submission is **blocked client-side and rejected server-side** if the checkbox is
  not checked; the block surfaces a field-level error adjacent to the checkbox (consistent
  with FR-32). No email is sent and no `ContactSubmission` is written when consent is absent.
- **FR-45** The site exposes a **`/privacy` Privacy Policy page** (FR-1) that renders the
  studio's privacy policy content, including at minimum: what personal data the contact form
  collects (name, email, message, optional company/project-type), that submissions are stored
  and for how long (180 days, FR-46), and how to request deletion. Whether the copy is static
  or CMS-editorial is a UI/UX + Architect decision (§8 R-1); this FR requires only that the
  route exists and renders the policy.
- **FR-46** Persisted `ContactSubmission` records are **automatically purged 180 days after
  `createdAt`**. Purged records are permanently removed such that they no longer appear in the
  Strapi admin or any query. The purge mechanism (scheduled job, Strapi lifecycle, or cron) is
  an Architect/DevOps decision (§8 R-1); this FR requires only that no record older than 180
  days survives.

### 5.12 Home-2 indexing / duplicate-content control (R4 — `docs/PROJECT-BRIEF.md:92`)

- **FR-47** `/home-2` sets `robots: noindex, follow` and a canonical link pointing to `/`
  (`<link rel="canonical" href="/">`). It is **excluded from the top navigation and mobile
  menu** (FR-3/FR-4) and **excluded from `sitemap.xml`**. It uses its own hero poster/video
  fields (`heroPosterH2`, `heroVideoUrl` — R5), distinct from Home 1's poster. This resolves
  the duplicate-content risk of `/` and `/home-2` sharing the Home singleton and its single
  `seo` component; `/home-2` is therefore exempt from FR-6's unique-title/description
  requirement because it is not indexed.

### 5.13 Hero media performance budget (R6 — `docs/PROJECT-BRIEF.md:96-100`)

- **FR-48** The hero LCP element on `/` (`heroPosterH1`) and on `/home-2` (`heroPosterH2`)
  is a poster image whose **transferred size is ≤ 60KB**, encoded as AVIF or WebP, rendered
  via `next/image` with **explicit `width`/`height`** (no layout shift, upholds G-7 CLS ≤ 0.1)
  and marked `priority` for preload. The scroll-scrub frame set (FR-9/FR-10) is capped at
  **≤ 120 frames at ≤ 1440px width on desktop** and **≤ 48 frames at ≤ 720px width on mobile**,
  AVIF or WebP. Frame decoding **must** use an LRU sliding-window decode (keep only a bounded
  window of decoded frames) once more than **40 frames** are buffered; a decode-all-and-retain
  strategy is prohibited. This gives G-7 (LCP ≤ 2.5s) a defended byte budget on the two home
  routes.

### 5.14 Hero preloader resilience (R7 — `docs/PROJECT-BRIEF.md:98-100`)

- **FR-49** The Home 1 preloader is **never the only way into the site**. The hero poster
  (`heroPosterH1`) is shown immediately on load; the "enter" affordance becomes enabled at
  **`min(25% of frames buffered, 4-second timeout)`** — whichever occurs first — so a slow or
  stalled connection cannot lock the visitor out. On **partial or stalled frame loading** (some
  frames arrive, some 404, or buffering never reaches 25%), the visitor enters on the poster and
  frames are enhanced progressively as they arrive; if the scrub cannot run at all, the hero
  falls back to the static poster with scrub disabled (consistent with FR-11/AC-9). No code path
  leaves the enter affordance permanently disabled.

---

## 6. ACCEPTANCE CRITERIA (Given / When / Then, per FR)

> Format: **Given** precondition **When** action **Then** observable, verifiable result.

- **AC-1 (FR-1)** Given the deployed site, When I request any URL not in the sitemap list,
  Then I receive an HTTP 404 with the site 404 page; When I request each of the 10 listed
  route patterns (including `/privacy`) with valid data, Then each returns HTTP 200.
- **AC-2 (FR-2)** Given any page, When I scroll the page down by 2000px, Then the top nav
  bar remains visible and fixed at the top of the viewport.
- **AC-3 (FR-3)** Given the desktop nav, When I activate the "Projects" (or "Services") nav
  item by click or by keyboard (Enter/Space), Then a glassmorphism mega-menu opens with an
  animation and lists that item's groupings; When I activate it again or press Escape, Then
  the mega-menu closes with an animation.
- **AC-4 (FR-4)** Given a viewport width of 375px, When the page loads, Then the top nav is
  collapsed to a single toggle; When I activate the toggle, Then a menu opens exposing all
  top-level routes and the mega-menu groupings, all reachable by keyboard.
- **AC-5 (FR-5)** Given any page at 375px width, When I inspect the footer, Then it contains
  the studio wordmark, links to all 7 top-level sitemap pages, and a contact link.
- **AC-6 (FR-6)** Given each of the 7 route groups, When I inspect the rendered `<head>`,
  Then `<title>`, meta description, canonical, and OG tags are present and the title +
  description differ from every other route group.
- **AC-7 (FR-7)** Given the full rendered site, When I audit computed colors against the
  6-token palette, Then no color outside the palette is used, and `--blueprint` appears
  only within the technical/wireframe section's DOM subtree.
- **AC-8 (FR-9, FR-10)** Given `/` with frames loaded, When scroll progress over the hero
  range is 0%, Then frame 1 is displayed; When progress is 50%, Then a middle frame is
  displayed; When progress is 100%, Then the final frame is displayed; scrubbing backward
  reverses frames.
- **AC-9 (FR-11)** Given the frame assets are absent, When I build and load `/`, Then the
  page renders with placeholder frames and produces no console error and no unhandled
  rejection.
- **AC-10 (FR-13)** Given `/` and `/home-2`, When I compare the DOM below the hero, Then the
  body sections are identical in structure and content ordering.
- **AC-11 (FR-14)** Given `/home-2`, When the page loads, Then the hero plays a looping
  video and scrolling does not change the hero frame/scene (no scrub).
- **AC-12 (FR-15)** Given the hero video asset is absent, When I load `/home-2`, Then a
  placeholder video or poster is shown and no console error occurs.
- **AC-13 (FR-17)** Given a home variant, When I locate the technical wireframe section,
  Then it uses monospaced annotation labels and the `--blueprint` accent, and no other
  section on the page uses `--blueprint`.
- **AC-14 (FR-18)** Given the home body, When I click a featured project, Then I navigate to
  that project's `/projects/[slug]` page and it returns HTTP 200.
- **AC-15 (FR-19)** Given N published projects in Strapi, When I load `/projects`, Then
  exactly N project cards are rendered and 0 draft/unpublished projects appear.
- **AC-16 (FR-20)** Given `/projects` with projects in categories {A, B}, When I apply the
  filter for category A, Then only category-A projects remain visible and the count matches
  the number of published category-A projects.
- **AC-17 (FR-21, FR-22)** Given a published project with slug `s`, When I navigate to
  `/projects/s`, Then the case-study page renders that project's title, media, and body
  content from Strapi.
- **AC-18 (FR-23)** Given no project has slug `nope`, When I request `/projects/nope`, Then
  I receive HTTP 404 with the site 404 page.
- **AC-19 (FR-24)** Given services defined in Strapi, When I load `/services`, Then all
  published service offerings render, and the set matches the Services mega-menu groupings.
- **AC-20 (FR-25)** Given about content in Strapi, When I load `/about`, Then the about
  content from Strapi is rendered.
- **AC-21 (FR-26, FR-27)** Given M published journal posts, When I load `/journal`, Then M
  post items render ordered newest-first, and each links to its `/journal/[slug]`.
- **AC-22 (FR-28)** Given a published post with slug `p`, When I navigate to `/journal/p`,
  Then the post content from Strapi renders and returns HTTP 200.
- **AC-23 (FR-29)** Given no post has slug `nope`, When I request `/journal/nope`, Then I
  receive HTTP 404.
- **AC-24 (FR-30)** Given zero published journal posts, When I load `/journal`, Then the
  defined empty-state copy is shown and no error or blank body appears.
- **AC-25 (FR-31, FR-32)** Given `/contact`, When I submit the form with a required field
  empty, Then submission is blocked and a field-level error appears next to that field, and
  no network request is sent.
- **AC-26 (FR-33)** Given the contact form, When I enter `not-an-email` in the Email field
  and attempt submit, Then a field-level email-format error appears and submission is
  blocked.
- **AC-27 (FR-34, FR-36)** Given all required fields valid, When I submit, Then the studio
  inbox receives an email containing the submitted values, and the form shows a success
  confirmation within 10 seconds.
- **AC-28 (FR-35)** Given a valid submit in progress, When I attempt to click submit again,
  Then the control is disabled and only one request/email results.
- **AC-29 (FR-37)** Given the server returns an error (or the network fails), When I submit,
  Then an error state is shown, all entered values remain in their fields, and a retry is
  possible.
- **AC-30 (FR-38)** Given the contact endpoint, When more than the allowed number of
  submissions arrive from one source within the defined window, Then further submissions in
  that window are rejected with a defined error and no email is sent for the rejected ones.
- **AC-31 (FR-39, FR-40)** Given an editor sets a project to "draft" in Strapi, When the
  public `/projects` page is requested after cache expiry, Then that project no longer
  appears; When set back to "published", Then it reappears.
- **AC-32 (FR-41)** Given a published project is unpublished, When its `/projects/[slug]` is
  requested after cache expiry, Then it returns HTTP 404.
- **AC-33 (FR-8)** Given any page, When I inspect it, Then there is no language switcher and
  `<html lang>` is `en`.
- **AC-34 (FR-43)** Given a valid contact submission, When it is submitted, Then a
  `ContactSubmission` record is created in Strapi with `status = new`, the submitted
  name/email/message (and company/projectType when provided), an `ipHash` (not the raw IP),
  a `userAgent`, and a `createdAt`; And the studio inbox also receives the email (AC-27);
  And the write is made with a server-only token such that no write credential is present in
  the client bundle or network response.
- **AC-35 (FR-44)** Given the contact form with all other fields valid but the consent
  checkbox unchecked, When I attempt to submit, Then submission is blocked with a field-level
  error next to the checkbox, no network request that would create a record/email is completed
  successfully, and no `ContactSubmission` is written; When I check the consent box and submit,
  Then submission proceeds; And the "privacy policy" text in the label links to `/privacy`.
- **AC-36 (FR-45)** Given the deployed site, When I request `/privacy`, Then it returns HTTP
  200 and renders the privacy policy content stating what data the contact form collects, that
  submissions are stored for 180 days, and how to request deletion.
- **AC-37 (FR-46)** Given a `ContactSubmission` whose `createdAt` is more than 180 days in the
  past, When the purge mechanism runs, Then that record no longer appears in the Strapi admin
  or in any query; Given a record younger than 180 days, When the purge runs, Then it is
  retained.
- **AC-38 (FR-47)** Given `/home-2`, When I inspect the rendered `<head>`, Then it emits
  `<meta name="robots" content="noindex, follow">` and `<link rel="canonical" href="/">`;
  When I inspect `sitemap.xml`, Then `/home-2` is absent; When I inspect the top nav and mobile
  menu, Then `/home-2` is not a listed destination.
- **AC-39 (FR-48)** Given `/` and `/home-2`, When I measure the hero poster's transferred
  bytes, Then each is ≤ 60KB and served as AVIF or WebP with explicit width/height and
  `priority`; When I inspect the scrub frame manifest, Then desktop has ≤ 120 frames at
  ≤ 1440px and mobile has ≤ 48 frames at ≤ 720px; When more than 40 frames are buffered during
  scrub, Then only a bounded window of decoded frames is retained in memory (no decode-all).
- **AC-40 (FR-49)** Given `/` on a connection where frame buffering never reaches 25% within
  4 seconds, When I load the page, Then the poster is shown immediately and the enter
  affordance becomes enabled at the 4-second timeout, allowing entry; Given some frames 404
  while others load, When I enter, Then the page renders on the poster and enhances as frames
  arrive, and if the scrub cannot run it falls back to the static poster with no console error
  or unhandled rejection.

---

## 7. EDGE CASES (minimum 5; includes all mandatory categories)

- **EC-1 — Empty state:** `/journal` and `/projects` with zero published entries. Expected:
  a defined empty state renders (FR-30), not a blank page or a crash. Also: a project detail
  with no media, or a journal post with an empty body.
- **EC-2 — Max scale:** `/projects` with 10,000 published projects and `/journal` with
  10,000 posts. Expected: the list is paginated or virtualized so initial render does not
  block, and no single request returns all 10,000 rows unbounded (pagination policy owned by
  API Designer / Frontend; §8 R-1). Also: a case study containing 200 high-resolution
  images.
- **EC-3 — Concurrent access:** Two editors edit the same Strapi entry simultaneously; and a
  visitor loads a project detail page at the exact moment an editor unpublishes it. Expected:
  Strapi's own concurrency/version handling governs editors (§9 A-8); the visitor either sees
  the last cached published version until cache expiry or a 404 after expiry — never a
  server error.
- **EC-4 — Permission denied:** A non-authenticated user attempts to reach the Strapi admin
  or to call a Strapi write endpoint directly. Expected: Strapi rejects with its
  authentication/authorization error; the public site never exposes a write capability
  (NG-2). A malformed direct API read for a draft entry must not return draft content
  (FR-40).
- **EC-5 — Network failure:** The contact submission request fails mid-flight (timeout,
  offline, 5xx). Expected: the form shows an error state, preserves input, and allows retry
  (FR-37 / AC-29). Separately: Strapi is unreachable when a content page is requested —
  expected behavior (serve stale cache, show a defined error page, or fail the build for
  static routes) must be defined by Architect (§9 Q-5) and must never render a raw stack
  trace to the visitor.
- **EC-6 — Slow network / heavy media:** A mobile visitor on a throttled connection loads
  `/` (image-sequence hero) or `/home-2` (video hero). Expected: the hero does not block
  first paint of the page body; a poster/first-frame shows immediately; the scrub/video
  loads progressively (degradation policy owned by SEO/Perf + UI/UX; §8 R-4). Respect
  `prefers-reduced-motion`: when set, the scrub animation and looping video autoplay are
  reduced to a static frame/poster.
- **EC-7 — Long / unusual content:** A project title of 150 characters, a slug with mixed
  case or spaces, a journal post title containing emoji or non-Latin characters. Expected:
  layout does not overflow the page (no horizontal scroll), slugs are normalized to
  URL-safe form by Strapi, and long titles truncate or wrap per a defined rule (owned by
  UI/UX).
- **EC-8 — Malformed input to contact form:** Extremely long message (e.g. 100,000
  characters), script tags in the name field, or a spoofed content-type. Expected: server
  enforces a max length, rejects oversized payloads with a defined error, and never renders
  submitted content unescaped anywhere (XSS guard owned by Security review).

---

## 8. DEPENDENCIES & RISKS

### Dependencies (must exist first)

- **D-1** Strapi v5 instance with content types defined for Project, Journal-post, and
  Service, plus the Home/About singletons, on MySQL 8.x / MariaDB
  (`docs/PROJECT-BRIEF.md:16-18`). Content model is owned by Architect/CMS (see R-1).
- **D-2** Next.js App Router + TypeScript project scaffold (`docs/PROJECT-BRIEF.md:17`).
- **D-3** GSAP + ScrollTrigger available to the frontend (`docs/PROJECT-BRIEF.md:20`).
- **D-4** An email delivery path for the contact form (SMTP credentials or an email API)
  wired into the chosen submission endpoint (`docs/PROJECT-BRIEF.md:80`).
- **D-5** Hosting: assumed Vercel (Next.js) + a Node host/container for Strapi + managed
  MySQL, until told otherwise (`docs/PROJECT-BRIEF.md:81-83`). Unconfirmed — see Q-1.

### Risks

- **R-1 (design/spec boundary)** This SRS deliberately does not define the Strapi content
  model, the REST-vs-GraphQL choice, pagination policy, contact-endpoint implementation, or
  caching/revalidation strategy — those are Architect / API Designer / DB decisions. If they
  are not produced before Frontend/Backend build, this spec is under-constrained and build
  will guess. **Escalate to Orchestrator.**
- **R-2 (missing hero assets)** Home 1 image-sequence frames and Home 2 hero video are not
  yet provided (`docs/PROJECT-BRIEF.md:72-74`). Placeholders are acceptable for build, but
  final hero polish is BLOCKED until real assets land. Frame count, resolution, and format
  directly affect FR-9/FR-10 and performance (G-7).
- **R-3 (brand assets)** Logo and final font licenses are to be produced in Figma
  (`docs/PROJECT-BRIEF.md:75-77`). Figma writes only work in the "Dependopolis 2" team
  (`docs/PROJECT-BRIEF.md:77`). Typography pairing is not finalized
  (`docs/PROJECT-BRIEF.md:58-59`) — final pairing set by UI/UX. Note: the Figma MCP
  connector is not authorized in this session; brand asset production is out of this
  document's scope regardless.
- **R-4 (performance vs cinematic media)** The cinematic, media-heavy direction
  (`docs/PROJECT-BRIEF.md:11-12,61-70`) directly tensions the LCP/CLS targets (G-7). Image
  sequences and looping video are large. The degradation and loading strategy (EC-6) must be
  designed by SEO/Perf + UI/UX or G-7 will fail.
- **R-5 (spam on contact form)** With no accounts and a public form, the contact endpoint is
  an abuse target. The chosen spam mitigation (FR-38) must avoid solving CAPTCHAs on the
  visitor's behalf and must not degrade AC-27 timing.
- **R-6 (content editor error)** Editors can unpublish or malform content in Strapi that
  breaks a page's expected structure (e.g., a project with no images). The empty/partial
  states (EC-1) must be designed or pages will render broken.

---

## 9. OPEN QUESTIONS / ASSUMPTIONS

### Open questions (blocking or clarifying — escalate to Orchestrator/user)

- **Q-1** What is the confirmed hosting target for Next.js and for Strapi + MySQL? The brief
  only assumes Vercel + a Node host (`docs/PROJECT-BRIEF.md:81-83`).
- **Q-2** What is the exact section list and content of the shared home body below the hero?
  The brief gives reference sites (`docs/PROJECT-BRIEF.md:61-70`) but does not enumerate the
  studio's own sections. UI/UX must define; PM cannot invent (GLOBAL CONTRACT §1).
- **Q-3** What is the exact contact-form field set and which fields are required? Assumed in
  FR-31; needs confirmation.
- **Q-4** What spam-mitigation mechanism is acceptable for the contact form (honeypot, rate
  limit, third-party anti-abuse), given the no-CAPTCHA-solving constraint?
- **Q-5** What is the required behavior when Strapi is unreachable at request/build time
  (serve stale, error page, or fail build)? Affects EC-5 and the render strategy.
- **Q-6** What is the studio destination email address for contact submissions, and should
  the submitter receive an auto-acknowledgement email? (If an auto-reply is wanted, that is
  a new FR and needs Content copy.)
- **Q-7 (RESOLVED by R2 — `docs/PROJECT-BRIEF.md:85-89,115`)** A `/privacy` Privacy Policy page
  is now required and specified (FR-45), because contact submissions are persisted as PII at
  rest (FR-43) with a 180-day retention policy (FR-46) and a required consent checkbox (FR-44).
  A cookie notice / Imprint remains out of scope unless separately requested.
- **Q-8** What are the project taxonomy values (categories/types) used by both the Projects
  gallery filter (FR-20) and the Projects mega-menu (FR-3)? And the Services offering set for
  FR-24 / the Services mega-menu?

### Assumptions (correct these if wrong)

- **A-1** Single-tenant, no auth on the public site, no payments — carried directly from
  `docs/PROJECT-BRIEF.md:79-80`.
- **A-2** Mobile breakpoint for nav collapse is <768px (industry-standard tablet boundary);
  exact breakpoints are a UI/UX decision.
- **A-3** Footer contains at least wordmark + all top-level links + contact link; exact
  footer content (social links, address, copyright) is a UI/UX + Content decision.
- **A-4** The shared home body is CMS-driven for editorial sections (featured projects,
  headline/intro copy) and static for structural/decorative sections; exact split pending
  Q-2.
- **A-5** Journal list order is newest-first by publish date (FR-26); confirm if a manual
  ordering or featured-post concept is wanted.
- **A-6** Published content changes appear on the public site within 60 seconds of the next
  request (assumes a revalidation/cache TTL on the order of ≤60s). Actual TTL is an
  Architect decision; G-3 depends on it.
- **A-7** Contact fields are Name, Email, Message (required) + optional Company and
  Project-type (FR-31); pending Q-3.
- **A-8** Concurrent Strapi editing conflicts are handled by Strapi's built-in behavior; no
  custom locking is in scope (EC-3).
- **A-9** No site-wide search in v1 (NG-7); the brief does not mention search.
- **A-10** No newsletter/subscription capture in v1 (NG-8); not in the brief.
- **A-11** The `--blueprint` accent appears in exactly one section (the technical/wireframe
  section) per home variant; the brief says "section only" (`docs/PROJECT-BRIEF.md:47,56`)
  and I read that as a single section, not multiple.

---

## ASSUMPTIONS

See §9 "Assumptions" (A-1 … A-11) above. This section is not empty: eleven assumptions are
declared there, and eight open questions (Q-1 … Q-8) are escalated for the Orchestrator/user
to resolve. No requirement in this SRS was invented beyond what `docs/PROJECT-BRIEF.md`
states; every gap is surfaced as a question or an explicitly labeled assumption per the
GLOBAL CONTRACT.
