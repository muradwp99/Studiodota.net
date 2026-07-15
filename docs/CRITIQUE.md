# Studiodota.net — Red-Team Critique

> Role: The Critic / Red Team (`AGENTS.md` §18). Zero code; findings only.
> Reviewed: `docs/PROJECT-BRIEF.md`, `docs/SRS.md`, `docs/ARCHITECTURE.md`,
> `docs/UX-SPEC.md`, `docs/API-CONTRACT.md`, `docs/DATA-MODEL.md`, `docs/COPY-DECK.md`.
> Governed by the GLOBAL CONTRACT. This is an attack, not a review. No praise, no padding.
> Version: 1.0 — 2026-07-14

---

## 1. THE STRONGEST ARGUMENT THAT THIS IS WRONG

This package reads as five well-written documents that were never diffed against each
other. Each artifact is internally disciplined — but the moment you trace one field or one
status code across artifacts, they diverge. The API contract sorts `/projects` by a column
the data model never defines. The data model persists contact submissions to MySQL while
the API contract and architecture both say submissions are *never* persisted. The data
model invents a `Tag` content type and cites two source lines (`SRS:38`, `BRIEF:38`) that
say nothing about tags — a fabricated citation, which is exactly what GLOBAL CONTRACT §3
exists to prevent. The copy deck tells users to "fix the fields marked in red" on a form
whose own UI spec says there is no red — errors are gold. These are not taste
disagreements; they are the frontend and backend being told two different things by two
"single sources of truth."

Second, the marquee feature — the image-sequence scrub hero — is the one place the package
is asked to defend a hard number (LCP ≤ 2.5s on throttled 3G, G-7) and it does not. The
LCP element on both home routes is a full-bleed cinematic poster with **no byte budget
anywhere in the package**. The memory math for the stated frame target (≤150 desktop frames
at ≤1600px) is ~860MB decoded if the "decode-all-and-keep is simpler" path is taken — and
the architecture explicitly permits that path. And the preloader gate that fronts Home 1
has **no stall timeout**: on a flaky connection that never reaches the 25% buffer threshold,
the "START HERE" button never enables and the visitor cannot enter the site. The cinematic
hero is the reason this site exists, and its performance/mobile story is asserted, not
demonstrated.

If I were paid to kill this, I would say: the design *phase* looks complete, but the
*package* is not build-ready — a developer who reads API-CONTRACT and a developer who reads
DATA-MODEL will build two incompatible systems, and neither will hit the one measurable
performance goal.

---

## 2. FINDINGS — `SEVERITY | WHAT | WHY IT MATTERS | WHAT SHOULD HAVE HAPPENED`

### P1 — `/projects` sorts by a `Project.order` field that the data model does not define
- **WHAT:** `API-CONTRACT.md:250,254,276` selects `fields[3]=order` and sorts
  `sort[0]=order:asc` on Project, and `ProjectCard.order` is typed `number | null`. But
  `DATA-MODEL.md §4.4` (the Project field spec) and the `projects` DDL (`DATA-MODEL.md:349-374`)
  define **no `order` column** — only `Category` (`:181`) and `Service` (`:197`) have `order`.
  Project ordering is instead meant to live in link-table `project_ord` columns
  (`DATA-MODEL.md:394,424`), and `DATA-MODEL.md:595-596` openly flags that the gallery's
  ordering is unresolved.
- **WHY:** A Strapi REST `sort[0]=order:asc` against a nonexistent attribute either errors
  or is silently ignored — the gallery order (AC-15/AC-16) is undefined. Frontend and backend
  will disagree the first time `/projects` renders.
- **SHOULD HAVE:** The API Designer and DB Architect should have reconciled the ordering
  key. Either add a scalar `order` to `Project`, or change the contract to sort by
  `publishedAt` / the link `project_ord`. Pick one and make both docs say it.

### P1 — `ContactSubmission` persistence contradicts two other artifacts (PII at rest, unratified)
- **WHAT:** `DATA-MODEL.md §4.9 / C-1` models a `contact_submissions` table written by
  `/api/contact` via a server-side Strapi token, storing name/email/message. But
  `API-CONTRACT.md:711-714` states "**No persistence of the submission** in Strapi/DB in v1,"
  and `ARCHITECTURE.md:99,389-410` states Strapi "must NOT be reachable for writes by
  anonymous users" and the contact path only sends email.
- **WHY:** Three "sources of truth" disagree on whether inquiries are stored. This is not a
  cosmetic gap: it introduces **PII at rest** with no retention/deletion policy, and there is
  no privacy page in the sitemap (SRS Q-7). A builder reading DATA-MODEL builds a write path +
  admin triage + a compliance obligation; a builder reading API-CONTRACT builds email-only.
- **SHOULD HAVE:** The Orchestrator must resolve C-1 before build. DATA-MODEL flagging it is
  correct process, but the contradiction was left live across artifacts rather than routed
  back and reconciled. If persistence is wanted, a retention policy + privacy notice become
  new requirements.

### P1 — `Tag` content type is invented and its citations are false
- **WHAT:** `DATA-MODEL.md §3` and `§4.3` add a `Tag` collection + `posts_tags_lnk` m2m table
  + N+1 guidance, citing `docs/SRS.md:38 "slug, tags"` and `docs/PROJECT-BRIEF.md:38`.
  Verified: `SRS:38` is goal **G-2** (home variants); `BRIEF:38` is `/contact`. The string
  "tags" appears **nowhere** in the brief or SRS except unrelated "OG tags" / "script tags."
- **WHY:** This violates GLOBAL CONTRACT §1 (never invent requirements) and §3 (no claims
  from memory; cite real file:line). It also drifts from the API: `API-CONTRACT.md:525-533,563-571`
  defines `PostCard`/`Post` with **no `tags` field**, so the DB builds tables and indexes for a
  feature no source requires and no endpoint exposes.
- **SHOULD HAVE:** Either drop `Tag`, or escalate "should the Journal support tags?" as an
  open question — not smuggle it in behind a citation that doesn't support it.

### P1 — `/home-2` has no unique title/description/canonical; duplicate-content SEO unaddressed
- **WHAT:** `API-CONTRACT.md:427-428,475-476` states `/` and `/home-2` read the **same** Home
  singleton, which carries **one** `seo` component (`DATA-MODEL.md §4.6`). FR-6/AC-6 require a
  unique `<title>`, meta description, and canonical per route group, and the SEO checklist
  (`AGENTS.md §15`) forbids duplicate content across params.
- **WHY:** `/home-2` will emit the same title/description as `/` and either self-canonicalize
  (duplicate content) or canonicalize to `/` (then why index it). Nobody specified `noindex` on
  `/home-2`, a distinct canonical, or distinct SEO fields. This is a launch-visible SEO defect
  on a marketing site whose whole job is discovery.
- **SHOULD HAVE:** The API/UX/SEO owners should have decided `/home-2`'s indexing story
  (recommend: `noindex` + canonical → `/`, since UX-SPEC E-7 already flags it as a demo/AB URL,
  not a nav destination) and stated where its `<head>` differs from `/`.

### P1 — Image-sequence hero: LCP target unbudgeted, memory guidance self-contradictory
- **WHAT:** G-7 mandates LCP ≤ 2.5s on a 3G-class mobile profile for **every** route. On `/`
  and `/home-2` the LCP element is the full-bleed hero **poster** (`ARCHITECTURE.md:245-246,290`),
  but **no artifact sets a byte budget for that poster** (the Graphic Designer role that owns
  file-size budgets, `AGENTS.md §12`, produced no artifact here). Separately,
  `ARCHITECTURE.md:254-258` sets a target of ≤150 desktop frames at ≤1600px and says the LRU
  window is "optional" / "decode-all-and-keep is simpler if the budget comfortably fits" — but
  150 × 1600×900×4 bytes ≈ **860MB** decoded, which does not fit anything.
- **WHY:** The one measurable performance goal is asserted, not defended. A 250–300KB poster on
  ~400kbps effective 3G is ~5–6s to paint — LCP blows 2.5s on the two most important routes. And
  the permitted "decode-all" path OOM-crashes mid-range mobiles at the stated frame count.
- **SHOULD HAVE:** A poster byte budget (e.g. ≤ ~40–60KB, priority-preloaded, `next/image` with
  explicit dimensions), and the LRU sliding window made **mandatory** (not optional) above a
  stated frame/resolution threshold. SRS R-4 admits this tension; the design docs should have
  closed it with numbers, not deferred it.

### P1 — Preloader enter-gate has no stall/timeout fallback (Home 1 lockout)
- **WHAT:** The Home 1 preloader gates "START HERE" until a ~25% frame buffer is reached
  (`ARCHITECTURE.md:250-251`, `UX-SPEC.md §3.2` partial/loading). The full-404 degradation path
  is handled (poster + disable scrub, FR-11/AC-9), but **partial/stalled buffering is not**:
  if the connection is slow or some frames 404 while others load, the buffer may never reach the
  threshold and the gate never enables.
- **WHY:** A visitor on flaky mobile can be stuck at the preloader on `/` with no way into the
  site — a happy-path trap on the primary landing route. "Step 3 of 5 fails" (partial load) was
  not considered, only "all 5 fail."
- **SHOULD HAVE:** A timeout (e.g. enable the gate after N seconds regardless of buffer, or
  always allow immediate entry with the poster and let frames stream in). The gate must never be
  the only door.

### P2 — Oversize-message status code conflict: `413` (API) vs `422` (UX)
- **WHAT:** `API-CONTRACT.md:650,680` returns `413 PAYLOAD_TOO_LARGE` for `message` > 5000.
  `UX-SPEC.md:720` (EC-H) says oversize message → **422**. `UX-SPEC.md §7.4` maps 422→field
  errors, 429/502→banner, but never handles 413 at all.
- **WHY:** The frontend built to UX-SPEC will not have a branch for 413 and will fall through to
  a generic error, not the field-level "trim it" message the copy deck wrote
  (`COPY-DECK.md:443`). Two docs, two codes.
- **SHOULD HAVE:** One status code, handled explicitly in the UX state matrix.

### P2 — Copy says "marked in red"; the design has no red
- **WHAT:** `COPY-DECK.md:451` (`contact.err.form.invalid.body`): "Fix the ones marked in red
  above." But `UX-SPEC.md §0 conflict-2` and `§7.3` explicitly establish there is **no red/danger
  color** — errors are `--gold` + icon + text, "color never the sole signal," and `--danger` is
  escalated (E-1), not defined.
- **WHY:** The instruction points users at a color that does not exist; users scanning for red
  find gold, and it undercuts the WCAG-1.4.1 discipline the UX spec was careful about.
- **SHOULD HAVE:** Copy that references the icon/label, not a color ("fix the highlighted
  fields") — pending the E-1 decision.

### P2 — Contact `company` max length: 120 (UX) vs 160 (API)
- **WHAT:** `UX-SPEC.md:574` validates Company ≤ 120; `API-CONTRACT.md:638` allows ≤ 160.
- **WHY:** A 121–160 char company passes the server but the client blocks it — inconsistent
  validation surface. Low blast radius, but it is drift between the two validators.
- **SHOULD HAVE:** One agreed cap in both docs.

### P2 — Hero field names/shape drift across three docs
- **WHAT:** The Home-1 manifest reference is `heroFrames.manifestUrl` (object,
  `API-CONTRACT.md:452-454`) vs `heroFrameManifestUrl` (scalar, `DATA-MODEL.md:263`) vs
  `heroFrameManifestRef` (`ARCHITECTURE.md:376`). Posters: API has **one** shared `heroPoster`
  (`:457`) while DATA-MODEL has **two** (`heroPoster` + `heroVideoPoster`, `:264,266`).
- **WHY:** Marked `⟨DB⟩`, so partially excused — but the one-vs-two poster split is a real
  modeling divergence (Home 1 and Home 2 want different LCP stills), and the frontend can't bind
  to a field whose name it can't predict.
- **SHOULD HAVE:** One agreed field name and an explicit decision on one vs two posters.

### P2 — Blueprint/wireframe section: copy has fields the data model doesn't model
- **WHAT:** `COPY-DECK.md §4.5` needs eyebrow, headline, body, four annotations, **and** a
  caption (8 slots). `DATA-MODEL.md §4.6` models only `wireframeHeading` + `wireframeAnnotations[]`
  (no eyebrow, body, or caption). `API-CONTRACT.md:459` collapses it to `wireframe: unknown`.
- **WHY:** Content wrote copy for slots that have no home in the schema; the section can't be
  fully authored in the CMS as specified.
- **SHOULD HAVE:** The Home content model should enumerate the blueprint section's fields to
  match the copy deck (or the copy deck should trim to the modeled fields).

### P2 — `readingTime` needed by copy, stored by DB, absent from the API DTO
- **WHAT:** `COPY-DECK.md:373` (`journal.card.readtime.tpl` "{n} min read") and
  `DATA-MODEL.md:246` (`Post.readingTime`) both exist, but `API-CONTRACT.md:525-533` `PostCard`
  does not return `readingTime`.
- **WHY:** The journal card cannot render the reading-time string it was given copy for.
- **SHOULD HAVE:** Add `readingTime` to `PostCard`, or drop the copy/field.

### P2 — Editable `Navigation` (DATA-MODEL) vs derived nav (API/ARCH), unreconciled
- **WHAT:** `DATA-MODEL.md C-2/§4.8` adds an editable `Navigation` single type and declares it
  "supersedes Architect A-6." But `API-CONTRACT.md §2.7` still derives `NavTaxonomy` from
  Categories + Services and says "No new Strapi endpoint is required for nav."
- **WHY:** If Navigation is authoritative, the API is missing a `GET /api/navigation` endpoint
  and the mega-menu's data source is wrong. The docs contradict on which nav mechanism ships.
- **SHOULD HAVE:** Orchestrator picks one; the loser's doc gets updated. "Do not build both" is
  stated but the winner isn't chosen.

### P2 — `/api/contact` accepts `x-www-form-urlencoded` for a progressive-enhancement path nothing else supports
- **WHAT:** `API-CONTRACT.md:629` accepts urlencoded "from a progressively-enhanced form." No
  other artifact defines a no-JS flow; UX success/error/rate-limit states are all client-rendered
  from a JSON `{ok:...}` response.
- **WHY:** A true no-JS POST needs HTML redirects, not JSON, and needs server-rendered success/
  error states the UX spec never defines. The PE path is half-specified.
- **SHOULD HAVE:** Either make PE a real requirement (and have UX define the no-JS states) or drop
  the urlencoded acceptance.

### P2 — Filter URL param inconsistent within UX-SPEC (`?cat=` vs `?category=`)
- **WHAT:** `UX-SPEC.md:87` uses `/projects?cat=X`; `:107` and `:363` use `?category=<slug>`.
- **WHY:** The shareable/back-button-safe URL key isn't fixed; a trivial but real inconsistency
  that will produce a wrong link somewhere.
- **SHOULD HAVE:** One param name.

### P2 — No alt text for the Home-1 hero poster (LCP image), only Home-2
- **WHAT:** `COPY-DECK.md:73` provides `hero.h2.poster.alt` but there is no `hero.h1.poster.alt`,
  though the Home-1 poster is the LCP element and a meaningful image.
- **WHY:** Missing alt on a meaningful hero image is an A11y gap (`AGENTS.md §14`).
- **SHOULD HAVE:** Alt copy for the Home-1 poster too.

**No P0.** Nothing here is running code with a live security hole, data-loss path, or wrong-money
bug — this is a spec/design phase. The severe items are P1 build-blockers and cross-artifact
contradictions, not P0s. (Honest one-liner as required by §18: the closest thing to a P0 is the
ContactSubmission PII-at-rest conflict, but it is unbuilt and flagged, so it is P1.)

---

## 3. WHAT WAS SILENTLY ASSUMED (assumptions nobody declared)

- **That the hero poster is small enough to be the LCP.** Every doc leans on "poster paints
  first = LCP solved," but no one assumed, stated, or budgeted a poster weight. A cinematic
  full-bleed still is not automatically fast.
- **That `/home-2` is exempt from FR-6's unique-SEO rule.** No doc says so; it's silently assumed
  by sharing the Home singleton's single `seo`.
- **That the preloader buffer always reaches its threshold.** The "enter gate" logic assumes
  monotonic buffering to 25% and silently assumes it never stalls.
- **That the frontend and CMS agree on which nav mechanism (derived vs editable) is real.** Two
  docs assume opposite winners.
- **That Strapi's `sort` will tolerate a nonexistent `order` attribute on Project.** Assumed by
  the API, contradicted by the schema.
- **That "identical body" (AC-10) has no SEO/canonical consequence.** The variants' sameness was
  treated purely as a DOM property, never as a duplicate-content risk.
- **That one shared `heroPoster` serves both a scrub hero and a video hero equally well.** API
  assumes one; DATA-MODEL assumes two.
- **That the contact IP-based rate limit (5/10min per IP) won't false-block shared NATs** (offices,
  campuses, mobile carrier CGNAT). Stated as tunable, but the shared-IP failure mode isn't
  acknowledged.

---

## 4. WHAT WAS OMITTED (not in the package but should be)

- **A poster/hero-media byte budget and an LCP measurement plan for `/` and `/home-2`.** The
  headline feature's only hard number (G-7) has no supporting budget.
- **A `/home-2` indexing decision** (noindex + canonical, or distinct SEO fields).
- **A preloader stall/timeout escape** and a partial-frame-load (some 404, some OK) state — only
  all-or-nothing degradation is specified.
- **A resolution of C-1/C-2/C-3 inside the artifacts.** They are flagged (correct), but the API
  contract was not updated to reflect DATA-MODEL's superseding claims, so the package ships
  self-contradictory.
- **A privacy/cookie page and data-retention policy** — required the moment ContactSubmission
  (PII at rest) is on the table; SRS Q-7 flags it but nothing resolves it.
- **A canonical `Project` ordering field/decision** (`DATA-MODEL.md:595-596` explicitly leaves it
  open, and the API depends on it).
- **A no-JS contact fallback definition**, if the urlencoded acceptance is intentional.
- **Reading-time in the API DTO**, given both copy and DB expect it.
- **An acceptance-test mapping for the cross-artifact contracts** (e.g. a test that the field the
  API sorts by actually exists in the schema). The contradictions found here are exactly the ones
  a contract-consistency check would have caught.

---

## 5. IF I HAD TO SHIP THIS TONIGHT, THE ONE THING I'D FIX

**Reconcile the API contract against the data model, field by field, and fix the
`Project.order` sort mismatch first.** It is the single defect that will break the primary
gallery route (`/projects`) on day one regardless of anything else, it is trivially verifiable
(the field either exists or it doesn't — it doesn't), and the same 30-minute reconciliation pass
that fixes it will surface the `Tag`, `readingTime`, hero-poster, and wireframe-field drifts in
the same sitting. Everything else can survive a flag; a contract that sorts by a column that
doesn't exist cannot.

---

## ASSUMPTIONS (Critic's own)

- I reviewed the seven named artifacts as of the file contents on 2026-07-14. I did **not** run
  a Strapi instance, build the Next.js app, or measure real LCP/memory — the memory (~860MB) and
  3G LCP (~5–6s) figures are arithmetic estimates from the stated frame/resolution targets and a
  ~400kbps effective-3G assumption, offered to size the risk, not as measured results.
- Line references are to the files as read this session; if the docs are edited, re-verify.
- I treated the brief + SRS as the authoritative source when checking whether a requirement was
  invented (per GLOBAL CONTRACT §1); the `Tag` and `ContactSubmission` findings rest on that.
- Severity reflects a spec/design phase (no live code), so nothing is rated P0; the same defects
  would rate higher once shipped.
