# Studiodota.net — Data Model (Strapi v5 content-types + MySQL schema)

> Role: Database / Data Architect (`AGENTS.md` §5). Spec + design only — **no application/production code**.
> Sources of truth: `docs/PROJECT-BRIEF.md` (incl. **§9b RESOLVED DECISIONS R1–R15**,
> `docs/PROJECT-BRIEF.md:78-115` — authoritative), `docs/SRS.md`, `docs/ARCHITECTURE.md`. Governed
> by `AGENTS.md` GLOBAL CONTRACT. Every gap is surfaced under §11 ASSUMPTIONS or §0 CONFLICTS —
> never invented.
> Version: 2.0 — 2026-07-14 (Orchestrator rulings R1–R15 applied; critique iteration 1)

---

## 0. CONFLICTS RESOLVED (Orchestrator rulings R1–R15 — GLOBAL CONTRACT §7)

The three cross-document divergences this document surfaced in critique iteration 0 have been
**resolved by authoritative Orchestrator rulings** (`docs/PROJECT-BRIEF.md:78-115`). They are
applied literally throughout this document; no divergence remains live.

- **C-1 — `ContactSubmission` persistence → RESOLVED by R2 (`docs/PROJECT-BRIEF.md:83-88`).**
  Contact submissions **ARE persisted**: `/api/contact` writes a `ContactSubmission` row via a
  **server-only Strapi token** AND sends email. The earlier "no persistence / email-only" statement
  in `API-CONTRACT` is now **void** (R2). This introduces **PII at rest** (name, email, message,
  `ipHash`, `userAgent`), governed by a **180-day auto-purge retention policy** and — outside this
  document — a required consent checkbox ("I agree to the privacy policy") plus a **`/privacy`
  Privacy Policy page** (`docs/PROJECT-BRIEF.md:88,115`). Modeled in §4.9; retention/purge in §10.4.

- **C-2 — Editable `Navigation` → RESOLVED by R11 (`docs/PROJECT-BRIEF.md:105-107`).**
  Navigation is **DERIVED** from the `Category` (Projects) and `Service` (offerings) taxonomies in
  v1. The editable `Navigation` single type has been **removed** from this model — there is no
  `navigations` table, no `nav.*` components, and **no "supersedes Architect A-6" claim**. Mega-menu
  groups are Categories (Projects) and Services (offerings), served by `getNavTaxonomy()` (§11).

- **C-3 — `Page` collection → RETAINED; now backs a real route.** R2 adds a **`/privacy`** Privacy
  Policy page to the sitemap (`docs/PROJECT-BRIEF.md:88,115`). The additive `Page` collection type
  (§4.7) now backs that legal route; `About` stays a singleton (§4.6). C-3 is therefore no longer a
  divergence — the previously-unconsumed `Page` type has a consumer.

---

## 1. SCOPE, TENANCY & MONEY (mandated: state N/A explicitly)

- **TENANT ISOLATION — N/A (single-tenant).** This is a single-tenant public marketing site:
  `docs/PROJECT-BRIEF.md:79`, `docs/SRS.md:59-63` (NG-1/NG-2), and the Architect's resolved
  governance conflict `docs/ARCHITECTURE.md:11-29`. There is exactly **one logical tenant**, so
  **no table carries a `tenant_id`**, no row-level-security policy, and no schema-per-tenant.
  The AGENTS.md §5 rules that mandate a tenant column on every table
  (`AGENTS.md:246-248`) and tenant-scoped uniqueness (`AGENTS.md:266-269`) are the deliberate
  exception documented at `docs/ARCHITECTURE.md:11-29,384-385`. **Consequence:** all uniqueness
  constraints (slugs) are **global**, which is correct here. **Blast radius if wrong:** if a
  second tenant is ever introduced, every uniqueness constraint and every cache tag becomes
  unsafe — a cross-cutting redesign (`docs/ARCHITECTURE.md:513`).

- **MONEY — N/A.** No payments, pricing, e-commerce, or monetary values anywhere
  (`docs/SRS.md:64-65` NG-3, `docs/PROJECT-BRIEF.md:79`). The AGENTS.md rule "every money value
  is integer minor units or decimal — never float" (`AGENTS.md:266-267`) has **no applicable
  column** in this model. If a `year` or `order` integer is mistaken for money it is not — see
  §4 field notes.

- **AUDIT TRAIL — N/A for money/permissions.** AGENTS.md §5 forbids `CASCADE` on financial or
  audit tables (`AGENTS.md:263-264`); there are none. Strapi's own `admin_*` tables track who
  edited content (`created_by_id` / `updated_by_id`), which is the only audit surface and is
  framework-managed.

---

## 2. STRAPI v5 STORAGE MODEL — how content-types become tables (framework facts)

This model targets **Strapi v5 on MySQL 8.x / MariaDB** (`docs/PROJECT-BRIEF.md:16-19`). The
following are **framework behaviors of Strapi v5**, not choices — they determine the generated
DDL. Where a detail is version-sensitive I mark it as an assumption to **verify against the
actual generated schema** (§11 A-1), per GLOBAL CONTRACT §3 (no unverified claims presented as
fact).

1. **Naming.** Table and column names are `snake_case`; collection-type table names are
   pluralized (`Project` → `projects`, `Category` → `categories`). Single types are also stored
   as a table holding effectively one document (`Home` → `homes`).

2. **Every content-type row carries system columns** (Strapi-managed, not authored):
   - `id` — `INT UNSIGNED AUTO_INCREMENT PRIMARY KEY` (internal numeric key).
   - `document_id` — `VARCHAR(255)` — the **stable public identifier** shared across a
     document's draft and published rows and any locale (v5 "Documents" model). This — **not
     `id`** — is what the Document Service and API expose.
   - `created_at`, `updated_at`, `published_at` — `DATETIME(6)` (see §9 timezone note).
   - `created_by_id`, `updated_by_id` — `INT UNSIGNED` FK → `admin_users(id)`.
   - `locale` — `VARCHAR(255)` NULL. **N/A for this project** (English only,
     `docs/SRS.md:66-67` NG-4); the column exists but stays `NULL`/default. No i18n tables.

3. **Draft & Publish = two rows per document.** With D&P ON (all collection + the Home/About
   singletons per `docs/ARCHITECTURE.md:367-379`), a single document is stored as **two rows**
   sharing one `document_id`: the **draft** row (`published_at IS NULL`) and the **published**
   row (`published_at` set). This **doubles row counts** and is central to the uniqueness and
   query-plan discussion (§7, §8). Public reads request published only
   (`docs/ARCHITECTURE.md:170-174`).

4. **Relations are stored in link tables (`*_lnk`)** — a v5 change: even many-to-one and
   one-to-one relations use a dedicated join table rather than an inline FK column. Pattern:
   `<owner>_<field>_lnk` with `<owner>_id`, `<target>_id`, and an ordering column
   (`<field>_ord` / `<inv>_ord`). Example: `projects_category_lnk`.

5. **Media (upload plugin) uses one `files` table + one polymorphic morph link table**
   (`files_related_mph`). A content-type does **not** get a media FK column; instead each
   file-to-entry association is a row in `files_related_mph` keyed by `(related_id,
   related_type, field, order)`. Single media (`cover`) and multi media (`gallery`) differ only
   in how many morph rows exist and the `order` value (§6).

6. **Components live in their own tables** `components_<category>_<name>` (e.g.
   `components_shared_seos`), linked to the owning entry through a per-owner polymorphic table
   `<owner>_cmps` `(entity_id, cmp_id, component_type, field, order)`. Reusable `seo` and
   `nav` structures use this mechanism (§5).

7. **Schema is managed by Strapi, not hand-written SQL migrations.** Adding/removing a field =
   editing the content-type schema (`src/api/**/content-types/**/schema.json` /
   Content-Type Builder); Strapi runs the `ALTER TABLE` on boot. **Custom indexes** beyond what
   Strapi generates require a Strapi database migration file (`database/migrations/*.js`) or a
   manual DDL statement — this is the only DDL this project authors by hand (§7, §10).

---

## 3. ENTITY OVERVIEW & RELATION MAP

| Content type | Kind | D&P | Backing table | Public route(s) |
|---|---|---|---|---|
| `Project` | collection | ON | `projects` | `/projects`, `/projects/[slug]`, home featured |
| `Category` | collection | ON¹ | `categories` | Projects filter + mega-menu (`docs/SRS.md:174-180`) |
| `Service` | collection | ON | `services` | `/services` + mega-menu (`docs/SRS.md:186-190`) |
| `Post` (Journal) | collection | ON | `posts` | `/journal`, `/journal/[slug]` |
| `Page` | collection | ON | `pages` | `/privacy` (Privacy Policy, R2) + future legal/flex pages |
| `Home` | single | ON | `homes` | `/`, `/home-2` |
| `About` | single | ON | `abouts` | `/about` |
| `Global` | single | OFF | `globals` | site-wide (footer, default SEO, socials) |
| `ContactSubmission` | collection | OFF | `contact_submissions` | admin only — **PII at rest, R2** |

¹ The `Category` D&P choice is a design decision, flagged §11 A-3. **No `Tag` type** — removed per
R3 (`docs/PROJECT-BRIEF.md:89-91`). **No editable `Navigation` type** — nav is derived per R11
(`docs/PROJECT-BRIEF.md:105-107`).

**Relation graph:**

```
Project  ──many-to-one──▶  Category           (a project belongs to one category)
Project  ──media single──▶  files (cover)
Project  ──media multi───▶  files (gallery)
Project  ──has component──▶ shared.seo
Post     ──media single──▶  files (cover)      (no tags — R3)
Post     ──has component──▶ shared.seo
Service  ──media single──▶  files (icon)
Service  ──has component──▶ shared.seo
Home     ──many-to-many──▶  Project (featuredProjects, ordered)  [docs/ARCHITECTURE.md:376]
Home     ──media single──▶  files (heroPosterH1, heroPosterH2)   (TWO posters — R5)
Home     ──has component──▶ shared.annotation[] (wireframeAnnotations — R14)
Home/About/Page/Service ─▶  shared.seo
Global   ──media single──▶  files (logo, default OG image)
Global   ──component──────▶ shared.seo (defaultSeo), shared.social-link[]
```

> Nav is **derived** from `Category` + `Service` (R11) — no `Navigation` content type, no `nav.*`
> components. The Home-1 frame manifest (`heroFrameManifestUrl`) and Home-2 video (`heroVideoUrl`)
> are CDN URLs held as scalar strings, not `files` rows (§6).

---

## 4. CONTENT-TYPE FIELD DEFINITIONS (authoritative field spec)

> This is the authored spec (what goes in each `schema.json`): **type / nullability / default /
> constraints**. The generated MySQL column types follow in §6/§7. "Required" means Strapi
> validates non-null on save; note media/relation "required" is enforced by Strapi at the
> Document layer, **not** by a DB NOT NULL (media/relations live in separate tables — §2.4/2.5).

### 4.1 `Category` — `categories`

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `name` | string | yes | — | display name; unique (global) |
| `slug` | uid (target `name`) | yes | — | URL-safe, **unique**; drives filter + mega-menu group |
| `order` | integer | no | `0` | mega-menu / filter sort order (**not money**) |
| `description` | text | no | — | optional |

Taxonomy source for `docs/SRS.md:174-180` (Projects filter) and `docs/SRS.md:120-123`
(Projects mega-menu). Answers part of `docs/SRS.md:447-449` Q-8 structurally; **the actual
category values remain unknown → §11 A-6, Q-8 stays open.**

### 4.2 `Service` — `services`

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `title` | string | yes | — | |
| `slug` | uid (target `title`) | yes | — | **unique** |
| `summary` | text | no | — | card/short copy |
| `body` | blocks (rich text) | no | — | long copy |
| `icon` | media (single, images) | no | — | via `files_related_mph` |
| `order` | integer | no | `0` | mega-menu / page order |
| `seo` | component `shared.seo` | no | — | per-page SEO (FR-6) |

Serves `/services` (`docs/SRS.md:186-190` FR-24) and Services mega-menu grouping
(`docs/SRS.md:120-123`).

### 4.3 `Tag` — REMOVED (R3)

The `Tag` content type, the `posts_tags_lnk` m2m table, and all tag indexes/citations are
**removed** per R3 (`docs/PROJECT-BRIEF.md:89-91`). No source requires Journal tags: the previously
cited `docs/SRS.md:38` is goal **G-2** (home variants) and `docs/PROJECT-BRIEF.md:38` is the
`/contact` sitemap entry — neither mentions tags. The false citations are withdrawn.

### 4.4 `Project` — `projects`

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `title` | string | yes | — | |
| `slug` | uid (target `title`) | yes | — | **unique**; `[slug]` route key (FR-21) |
| `excerpt` | text | no | — | gallery-card summary |
| `cover` | media (single, images) | yes* | — | *required in UI; DB via morph (§6) — card + OG image |
| `gallery` | media (multiple, images) | no | — | case-study images (`docs/PROJECT-BRIEF.md`; EC-2 200-image guard §8) |
| `body` | blocks (rich text) | no | — | case-study body (FR-22) |
| `category` | relation m2o → `Category` | yes* | — | *required in UI; filter + mega-menu (FR-20) |
| `client` | string | no | — | metadata |
| `location` | string | no | — | metadata |
| `year` | integer | no | — | project year (**not money**; range check 1900–2100 in UI) |
| `order` | integer | **no** | `null` | **R1** — gallery manual sort key (**not money**). `/projects` sorts `order:asc` then `publishedAt:desc`; nullable so unset projects fall to the date tie-break. Backed by scalar column + `projects_order_idx` (§7.2). |
| `featured` | boolean | no | `false` | optional home-feature flag (see note) |
| `seo` | component `shared.seo` | no | — | FR-6 |

**Ordering note (R1):** the gallery sort key is the **scalar `Project.order`** above — a real
column on `projects`, sortable via Strapi REST `sort[0]=order:asc&sort[1]=publishedAt:desc`. This
replaces the earlier unresolved proposal to order by the `projects_category_lnk.project_ord` link
column; that link `*_ord` column still exists (Strapi-generated, §5.3) but is **not** the gallery
sort key. `/projects` and the API contract both sort by `order` then `publishedAt` (R1,
`docs/PROJECT-BRIEF.md:82`).

**Featured-project note:** `docs/ARCHITECTURE.md:376` sources home features from a
**`Home.featuredProjects` relation** (curated, ordered). I keep that relation (§4.6) as the
authoritative mechanism and add `featured` boolean only as an optional convenience flag; if the
Home relation is authoritative, `featured` is redundant — **flagged §11 A-4** (do not build
both without a decision).

### 4.5 `Post` (Journal) — `posts`

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `title` | string | yes | — | |
| `slug` | uid (target `title`) | yes | — | **unique**; `[slug]` route key (FR-27) |
| `excerpt` | text | no | — | list summary |
| `cover` | media (single, images) | no | — | list + OG image (the `coverImage` in R3's field list) |
| `body` | blocks (rich text) | no | — | post body (FR-28); empty body → empty-state (EC-1) |
| `author` | string | no | — | **R3** — optional byline (`author?`); plain display string, not a relation |
| `readingTime` | integer | no | — | **R10** — minutes; **computed server-side on save** (not hand-entered) and returned in both `PostCard` and `Post` DTOs (`docs/PROJECT-BRIEF.md:104`) |
| `seo` | component `shared.seo` | no | — | FR-6 |

**No `tags` field** — removed per R3 (`docs/PROJECT-BRIEF.md:89-91`); the canonical Post field set is
exactly `title, slug, excerpt, body, cover, author?, publishedAt, readingTime, seo` (`publishedAt`
is the Strapi system column, §2.2). Ordering is **newest-first by `published_at`**
(`docs/SRS.md:462-463` A-5); this is the >100k-row query-plan target (§8).

### 4.6 `Home` — `homes` (single type)

Editorial slots for the shared body are **not fully enumerable yet** — `docs/SRS.md:431-433`
Q-2 / `docs/ARCHITECTURE.md:592` Q-2 leave the section list to UI/UX. I model the **hero + known
structural** fields and a generic editorial container; final sections pend Q-2 (**§11 A-5**).

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `introHeading` | string | no | — | above-fold headline |
| `introBody` | text | no | — | |
| `featuredProjects` | relation m2m → `Project` | no | — | **ordered**; drives FR-18 home features |
| `heroFrameManifestUrl` | string | no | — | **R5** — Home-1 image-sequence: CDN URL of the FrameManifest **JSON** (`docs/ARCHITECTURE.md:198-202,427-431`). Scalar string, not a `files` row. |
| `heroPosterH1` | media (single, image) | no | — | **R5** — Home-1 LCP poster (`priority` preload, ≤60KB per R6; FR-11 placeholder ok). Alt copy = `hero.h1.poster.alt` (R13). |
| `heroVideoUrl` | string | no | — | **R5** — Home-2 looping video: CDN URL of the `.mp4`/`.webm`. Scalar string, not a `files` row (fixed CDN art asset; FR-14 placeholder ok). |
| `heroPosterH2` | media (single, image) | no | — | **R5** — Home-2 LCP poster / video poster (FR-15). **TWO posters** total (`heroPosterH1` + `heroPosterH2`) so each home variant gets its own LCP still. |
| `wireframeEyebrow` | string | no | — | **R14** — blueprint section eyebrow/kicker (FR-17) |
| `wireframeHeading` | string | no | — | **R14** — blueprint section heading (FR-17) |
| `wireframeBody` | text | no | — | **R14** — blueprint section intro body copy (FR-17) |
| `wireframeAnnotations` | component `shared.annotation[]` | no | — | **R14** — monospaced callouts; each annotation = `label` + `description` (`docs/SRS.md:283-285` AC-13) |
| `wireframeCaption` | string | no | — | **R14** — blueprint section caption/footnote (FR-17) |
| `seo` | component `shared.seo` | no | — | FR-6. `/` and `/home-2` share this Home singleton; `/home-2` is `noindex,follow` + canonical→`/` at the route layer (R4), so the shared single `seo` is intentional. |

> **R5 canonical hero fields.** The Home-1 frame manifest (`heroFrameManifestUrl`) and Home-2 video
> (`heroVideoUrl`) are **scalar string CDN URLs** — fixed art assets on the CDN
> (`docs/ARCHITECTURE.md:196-206`), **not** `files`/upload rows. The two posters (`heroPosterH1`,
> `heroPosterH2`) **are** `files` media rows (they are `next/image` LCP stills with intrinsic
> dimensions for the CLS/LCP budget, R6). All four are editable so placeholders can be swapped
> without a deploy (R-2). The Next hero runtime reads the manifest/video URL directly, not through
> `next/image` (`docs/ARCHITECTURE.md:200-202`).
>
> **R14 blueprint section.** The five `wireframe*` scalar fields plus the repeatable
> `shared.annotation[]` component fully model the blueprint/wireframe section copy deck
> (`docs/PROJECT-BRIEF.md:108-110`): eyebrow, heading, body, N annotations (label + description),
> and caption. This is the only place `--blueprint` is used (FR-7/AC-7/AC-13).

### 4.7 `Page` — `pages` (collection) — additive, see C-3

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `title` | string | yes | — | |
| `slug` | uid (target `title`) | yes | — | **unique** |
| `body` | blocks (rich text) | no | — | |
| `seo` | component `shared.seo` | no | — | FR-6 |

For legal/flex pages (Privacy etc., `docs/SRS.md:443-446` Q-7). **No sitemap route consumes it
yet** — needs an SRS/Architect follow-up before it renders anywhere.

### 4.8 `Navigation` — REMOVED (R11)

The editable `Navigation` single type, the `nav.top-item` / `nav.link` components, and the
`navigations` table are **removed** per R11 (`docs/PROJECT-BRIEF.md:105-107`). There is **no**
"supersedes Architect A-6" claim anymore — the ruling makes Architect A-6 authoritative.

Navigation is **DERIVED** from taxonomies in v1: the mega-menu groups are **Categories** (Projects)
and **Services** (offerings), composed by `getNavTaxonomy()` over the `categories` + `services`
reads (`docs/ARCHITECTURE.md:349,381-383,564-566`; §11 `getNavTaxonomy`). No new Strapi content
type or endpoint is required for nav. Editors change the menu by editing Categories/Services, whose
`order` field (§4.1, §4.2) controls mega-menu ordering.

### 4.9 `ContactSubmission` — `contact_submissions` (collection) — R2 (PII AT REST)

Persisted per **R2** (`docs/PROJECT-BRIEF.md:83-88`). `/api/contact` writes one row here via a
**server-only Strapi token** and also sends the notification email.

| Field | Strapi type | Req | Default | Constraint / notes |
|---|---|---|---|---|
| `name` | string | yes | — | 1..120 (`docs/ARCHITECTURE.md:392`) |
| `email` | email | yes | — | RFC-validated (FR-33) |
| `message` | text (long) | yes | — | **R8** — cap **5000** chars (client + server); oversize → 422 field-level |
| `company` | string | no | — | **R9** — cap **120** chars (client + server) |
| `projectType` | string | no | — | optional |
| `status` | enum(`new`,`read`,`archived`) | no | `new` | **R2** — admin triage (see §7.4 index) |
| `ipHash` | string | no | — | **R2** — salted **hash** of submitter IP (abuse forensics). Never the raw IP. |
| `userAgent` | string | no | — | **R2** — request User-Agent string (abuse forensics) |

`createdAt` is the Strapi system column (§2.2) and drives retention (§10.4) + the admin listing
index (§7.4).

**PII-at-rest posture (R2).** Name, email, message, `ipHash`, and `userAgent` are personal data at
rest. This is governed by:
- **180-day auto-purge** — rows are hard-deleted 180 days after `createdAt` (retention job, §10.4).
- A required **consent checkbox** ("I agree to the privacy policy") on the form and a **`/privacy`
  Privacy Policy page** (both outside this document — UX/Content/Page `Page` type §4.7,
  `docs/PROJECT-BRIEF.md:88,115`).
- **No secret** is ever stored here. **The `/api/contact` handler writes via a server-only Strapi
  token; the public never has write access** (`docs/ARCHITECTURE.md:99`, SRS NG-2, EC-4).

> `ipHash` is stored (hashed, not raw) here for abuse forensics per R2. The *ephemeral* rate-limit
> counter still lives in the KV store (`docs/ARCHITECTURE.md:102,408`); the persisted `ipHash` is a
> separate, hashed forensic record, not the rate-limit key.

### 4.10 `shared.seo` component (reused by Project, Post, Service, Home, About, Page, Global)

| Field | Strapi type | Req | Default | Notes |
|---|---|---|---|---|
| `metaTitle` | string | no | — | ≤60 chars (SEO) — FR-6 |
| `metaDescription` | text | no | — | ≤160 chars |
| `canonicalURL` | string | no | — | FR-6 canonical |
| `ogImage` | media (single, image) | no | — | Open Graph (FR-6) |
| `keywords` | string | no | — | optional |
| `noIndex` | boolean | no | `false` | for `Page`/legal |

---

## 5. GENERATED SCHEMA — DDL (representative of Strapi v5 output)

> **Framing (GLOBAL CONTRACT §3):** Strapi generates this DDL from the schemas above; it is not
> hand-authored. The DDL below is **representative** of Strapi v5's MySQL output and is provided
> so downstream roles can reason about types, nullability, indexes, and query plans. Exact
> engine-generated column widths/index names **must be verified against the real generated
> schema** once Strapi is stood up (`docs/ARCHITECTURE.md:528`, migration step 2) — §11 A-1.
> `ENGINE=InnoDB`, `utf8mb4` / `utf8mb4_unicode_ci` throughout (emoji-safe, EC-7
> `docs/SRS.md:369-373`).

### 5.1 `projects` (pattern representative of all collection types)

```sql
CREATE TABLE `projects` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id`   VARCHAR(255)     NULL,           -- v5 public id (shared draft/published)
  `title`         VARCHAR(255)     NULL,           -- app-required; DB nullable (Strapi validates)
  `slug`          VARCHAR(255)     NULL,           -- uid; uniqueness = see §7.1 (D&P caveat)
  `excerpt`       TEXT             NULL,
  `body`          LONGTEXT         NULL,           -- blocks/rich text stored as JSON-ish text
  `client`        VARCHAR(255)     NULL,
  `location`      VARCHAR(255)     NULL,
  `year`          INT              NULL,
  `order`         INT              NULL DEFAULT NULL, -- R1 gallery sort key (reserved word → backticked)
  `featured`      TINYINT(1)       NULL DEFAULT 0,
  `created_at`    DATETIME(6)      NULL,
  `updated_at`    DATETIME(6)      NULL,
  `published_at`  DATETIME(6)      NULL,           -- NULL = draft row (§2.3)
  `created_by_id` INT UNSIGNED     NULL,
  `updated_by_id` INT UNSIGNED     NULL,
  `locale`        VARCHAR(255)     NULL,           -- unused (English-only)
  PRIMARY KEY (`id`),
  KEY `projects_documents_idx` (`document_id`,`locale`,`published_at`),  -- Strapi-generated
  KEY `projects_created_by_id_fk` (`created_by_id`),
  KEY `projects_updated_by_id_fk` (`updated_by_id`),
  CONSTRAINT `projects_created_by_id_fk` FOREIGN KEY (`created_by_id`)
      REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_updated_by_id_fk` FOREIGN KEY (`updated_by_id`)
      REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`posts`, `services`, `categories`, `pages`, `contact_submissions` follow the **same
system-column pattern**; only the authored columns differ (per §4). There is **no `tags` table**
(R3) and **no `navigations` table** (R11). `contact_submissions` has **no
`published_at`-as-draft semantics** (D&P OFF), but Strapi still emits the column set.

### 5.2 `homes` / `abouts` / `globals` (single types)

Identical structure to a collection table; Strapi keeps effectively one document (a
draft + published pair when D&P ON). `homes` holds the scalar hero fields from §4.6
(`heroFrameManifestUrl`, `heroVideoUrl`, and the `wireframe*` blueprint fields are scalar columns;
`heroPosterH1`/`heroPosterH2` are media morph links). **No `navigations` table** — nav is derived
(R11). Relations/media/components use the shared mechanisms below.

### 5.3 Relation link table — `projects_category_lnk` (many-to-one)

```sql
CREATE TABLE `projects_category_lnk` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id`   INT UNSIGNED NULL,
  `category_id`  INT UNSIGNED NULL,
  `project_ord`  DOUBLE       NULL,               -- order of projects within a category
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_category_lnk_uq` (`project_id`),      -- m2o: one category per project
  KEY `projects_category_lnk_fk`  (`project_id`),
  KEY `projects_category_lnk_ifk` (`category_id`),           -- serves the /projects filter (§7.2)
  CONSTRAINT `projects_category_lnk_fk`  FOREIGN KEY (`project_id`)
      REFERENCES `projects` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `projects_category_lnk_ifk` FOREIGN KEY (`category_id`)
      REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.4 Many-to-many link table — `homes_featured_projects_lnk`

There is **no `posts_tags_lnk` table** — the `Tag` type and its m2m are removed per R3
(`docs/PROJECT-BRIEF.md:89-91`). The only authored m2m in this model is Home → Project:

```sql
CREATE TABLE `homes_featured_projects_lnk` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `home_id`     INT UNSIGNED NULL,
  `project_id`  INT UNSIGNED NULL,
  `project_ord` DOUBLE       NULL,            -- preserves the curated featured-project order
  PRIMARY KEY (`id`),
  KEY `homes_featured_projects_lnk_fk`  (`home_id`),
  KEY `homes_featured_projects_lnk_ifk` (`project_id`),
  CONSTRAINT `homes_featured_projects_lnk_fk`  FOREIGN KEY (`home_id`)    REFERENCES `homes`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `homes_featured_projects_lnk_ifk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.5 Media — `files` + `files_related_mph` (§6 covers strategy)

```sql
-- Strapi upload plugin (one row per uploaded asset)
CREATE TABLE `files` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id`       VARCHAR(255) NULL,
  `name`              VARCHAR(255) NULL,
  `alternative_text`  VARCHAR(255) NULL,          -- alt text (A11y; SRS §14 checklist)
  `caption`           VARCHAR(255) NULL,
  `width`             INT          NULL,          -- intrinsic dims → CLS guard (G-7)
  `height`            INT          NULL,
  `formats`           LONGTEXT     NULL,          -- JSON: thumbnail/small/medium/large variants
  `hash`              VARCHAR(255) NULL,
  `ext`               VARCHAR(255) NULL,
  `mime`              VARCHAR(255) NULL,
  `size`              DECIMAL(10,2) NULL,         -- KB (NOT money)
  `url`               VARCHAR(255) NULL,          -- CDN/object-storage URL
  `preview_url`       VARCHAR(255) NULL,
  `provider`          VARCHAR(255) NULL,          -- 's3'/'r2' provider key (§6)
  `provider_metadata` LONGTEXT     NULL,          -- JSON (bucket/key/etc.)
  `created_at`  DATETIME(6) NULL, `updated_at` DATETIME(6) NULL, `published_at` DATETIME(6) NULL,
  `created_by_id` INT UNSIGNED NULL, `updated_by_id` INT UNSIGNED NULL, `locale` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Polymorphic morph link: connects any entry+field to a file, ordered
CREATE TABLE `files_related_mph` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_id`       INT UNSIGNED NULL,
  `related_id`    INT UNSIGNED NULL,              -- e.g. projects.id
  `related_type`  VARCHAR(255) NULL,              -- e.g. 'api::project.project'
  `field`         VARCHAR(255) NULL,              -- 'cover' | 'gallery' | 'icon' | 'heroPosterH1' | 'heroPosterH2' ...
  `order`         DOUBLE       NULL,              -- gallery ordering
  PRIMARY KEY (`id`),
  KEY `files_related_mph_fk`  (`file_id`),
  KEY `files_related_mph_oidx` (`related_id`),
  KEY `files_related_mph_order_idx` (`order`),
  CONSTRAINT `files_related_mph_fk` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`cover`/`icon`/`heroPosterH1`/`heroPosterH2` = exactly one morph row (`order`=1); `gallery` = N
morph rows (`order`=1..N). This is why "media required" is a Strapi-layer validation, not a DB NOT
NULL. Note `heroFrameManifestUrl` and `heroVideoUrl` are **scalar string columns** on `homes`, not
media morph rows (R5).

### 5.6 Components — `components_shared_seos` + `<owner>_cmps`

```sql
CREATE TABLE `components_shared_seos` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `meta_title`       VARCHAR(255)  NULL,
  `meta_description` TEXT          NULL,
  `canonical_url`    VARCHAR(255)  NULL,
  `keywords`         VARCHAR(255)  NULL,
  `no_index`         TINYINT(1)    NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- (ogImage inside the component links through files_related_mph with related_type = the component)

-- Per-owner polymorphic component link (one such table per owning content-type)
CREATE TABLE `projects_cmps` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_id`      INT UNSIGNED NULL,             -- projects.id
  `cmp_id`         INT UNSIGNED NULL,             -- components_shared_seos.id
  `component_type` VARCHAR(255) NULL,             -- 'shared.seo'
  `field`          VARCHAR(255) NULL,             -- 'seo'
  `order`          DOUBLE       NULL,
  PRIMARY KEY (`id`),
  KEY `projects_cmps_entity_fk` (`entity_id`),
  KEY `projects_cmps_cmp_id_idx` (`cmp_id`),
  CONSTRAINT `projects_cmps_entity_fk` FOREIGN KEY (`entity_id`)
      REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`shared.social-link` (Global), `shared.annotation` (Home — the R14 `wireframeAnnotations[]`, each
row = `label` + `description`), `shared.team-member` (About, if used) each get a `components_*_*`
table and are linked via `globals_cmps` / `homes_cmps`. There are **no `nav.*` components** — the
editable Navigation type is removed (R11).

---

## 6. MEDIA / UPLOAD STRATEGY (mandated)

Aligns with `docs/ARCHITECTURE.md:184-211` (three media classes) and the DB tables in §5.5.

1. **Editorial media (Project cover/gallery, Post cover, Service icon, OG images, Global logo).**
   - Stored via a **Strapi v5 S3-compatible upload provider** (`@strapi/provider-upload-aws-s3`
     or R2 equivalent) into **object storage (S3 / Cloudflare R2)**, served through a **media
     CDN** (`docs/ARCHITECTURE.md:79,188-192,220`). MySQL stores only the **metadata row** in
     `files` (dimensions, mime, `formats` JSON of responsive variants, `url`, `provider`,
     `provider_metadata`) — **binaries never live in MySQL.**
   - Strapi generates responsive variants (`thumbnail`/`small`/`medium`/`large`) into the
     `formats` JSON on upload; Next renders with `next/image` + CDN host in
     `images.remotePatterns` for `srcset` + explicit width/height (CLS guard, G-7).
   - **Size/type governance is Strapi-side** (upload plugin `sizeLimit`, allowed mime); enforce
     an image mime allowlist and a per-file cap in Strapi config (Security review owns the
     content-sniffing requirement, `AGENTS.md:420-422`). Not a DB constraint.

2. **Home-1 hero image sequence** — **not** in `files`/`next/image`. A fixed art asset set +
   JSON manifest on the CDN; the DB holds only `homes.heroFrameManifestUrl` (a string). The
   client canvas runtime fetches raw frames (`docs/ARCHITECTURE.md:196-206,424-440`). Placeholder
   frames until real assets land (FR-11 / R-2).

3. **Home-2 hero video** — `homes.heroVideoUrl` (**R5**: a scalar CDN URL string, **not** a `files`
   row) + `homes.heroPosterH2` (a `files` media row, the LCP/video poster). Served via `<video>`
   (`docs/ARCHITECTURE.md:204-206,288-296`). Placeholder until real asset lands (FR-15 / R-2). Like
   the Home-1 manifest, the video is a fixed CDN art asset referenced by URL, not an editorial
   upload.

**Deletion behavior:** deleting a `files` row cascades its `files_related_mph` links (§5.5). The
**object-storage binary** is removed by the Strapi upload provider on file delete, **not** by
MySQL — orphaned CDN objects on provider failure are an operational concern for DevOps, not a DB
constraint.

**Origin allowlist (privacy/SSRF):** media URLs come only from Strapi responses / the hero
manifest, never visitor input (`docs/ARCHITECTURE.md:208-211`); no user-supplied URL is fetched.

---

## 7. INDEXES — every index tied to a named query

> **Strapi auto-generates:** the PK on `id`, the `(document_id, locale, published_at)` document
> index on every content table, FK indexes on every `*_lnk`/`_cmps`/morph FK, and the uid
> uniqueness for slugs (see §7.1 caveat). The indexes **this project adds by hand** (via a
> Strapi `database/migrations/*.js`) are only those below, each justified by a named query from
> `lib/strapi/queries.ts` (`docs/ARCHITECTURE.md:346-361`). **An index with no named query is
> removed** (`AGENTS.md:251-252`).

### 7.1 Slug uniqueness — CRITICAL D&P caveat (correctness)

`getProjectBySlug(slug)` / `getPostBySlug(slug)` (`docs/ARCHITECTURE.md:355,361`) look up one
row by slug. Slug is a `uid` field → Strapi enforces uniqueness. **But under Draft & Publish a
document has two rows (draft + published) sharing the same slug** (§2.3). Therefore a **naive
`UNIQUE(slug)` DB index would reject the published copy of an existing draft** and break
publishing.

- **Do NOT hand-add `UNIQUE(slug)`.** Rely on Strapi's uid uniqueness (enforced at the Document
  layer / scoped by publication state + locale). **Verify the exact generated index** before
  adding anything (§11 A-1). If a DB-level unique is desired for integrity, it **must be
  composite** including the publication dimension (e.g. `(slug, locale, published_at)`), never
  `slug` alone. This is the single most important correctness note in this document.
- The lookup itself is served by an index on `slug` for fast equality search:

  ```sql
  -- named query: getProjectBySlug / getPostBySlug  (equality on slug, published only)
  CREATE INDEX projects_slug_idx ON projects (slug);
  CREATE INDEX posts_slug_idx    ON posts   (slug);
  ```
  (Non-unique lookup index; uniqueness stays Strapi-enforced per the caveat above.)

### 7.2 Projects gallery — category filter + ordering (R1)

```sql
-- named query: getProjects({category})  → /projects filter (docs/SRS.md:290-292 AC-16)
-- Strapi already indexes the FK; ensure it exists:
CREATE INDEX projects_category_lnk_ifk ON projects_category_lnk (category_id);

-- named query: getProjects()  → /projects gallery ordering (R1, docs/PROJECT-BRIEF.md:82)
-- sort[0]=order:asc, sort[1]=publishedAt:desc  (nullable order falls to the date tie-break)
CREATE INDEX projects_order_idx ON projects (`order`, published_at);
```
The filter resolves category slug → `categories.id` → `projects_category_lnk.category_id` → join
`projects` (published). Index on `category_id` avoids a full scan of the link table.
`projects_order_idx` serves the **R1 gallery sort** `ORDER BY \`order\` ASC, published_at DESC`
without a filesort (`order` is a reserved word → backticked). This is the canonical gallery
ordering; the link-table `project_ord` column is **not** the gallery sort key (§4.4).

### 7.3 Journal ordering + pagination (the >100k target)

```sql
-- named query: getJournal({page,pageSize})  → newest-first (docs/SRS.md:462-463 A-5)
CREATE INDEX posts_published_at_idx ON posts (published_at DESC);
```
Serves `ORDER BY published_at DESC LIMIT ? OFFSET ?`. See §8 for the deep-offset caveat.
The `/projects` gallery ordering is **resolved by R1**: it sorts by the scalar `Project.order`
(asc) then `publishedAt` (desc), served by `projects_order_idx` (§7.2) — **not** by
`published_at` alone and **not** by the link `project_ord` column.

### 7.4 Contact submissions admin listing + retention (R2)

```sql
-- named query: Strapi admin list of inquiries, newest-first, filter by status
CREATE INDEX contact_submissions_created_at_idx ON contact_submissions (created_at DESC);
CREATE INDEX contact_submissions_status_idx     ON contact_submissions (status);
```
`created_at DESC` also serves the **180-day retention purge** (§10.4), whose delete predicate is
`created_at < NOW() - INTERVAL 180 DAY`.

### 7.5 No index needed

`Service`, `Category`, `Page`, `Home`, `About`, `Global` are **small, bounded sets** (tens of
rows). Their reads (`getServices`, `getNavTaxonomy`, singleton fetches) are full-table reads that
the optimizer handles without a secondary index; adding one would be unjustified
(`AGENTS.md:251-252`). Slug lookups on `Service`/`Page` are rare and small — no dedicated index.
(There is no `tags` or `navigations` table — R3, R11.)

---

## 8. QUERY PLANS FOR TABLES >100k ROWS (mandated: Journal)

**Reality check.** A studio marketing site realistically holds tens–hundreds of projects/posts,
not 100k. The 100k target is the AGENTS.md §5 threshold (`AGENTS.md:257-258`) and the SRS EC-2
stress case of **10,000 entries** (`docs/SRS.md:342-346`). **Remember D&P doubles rows** (§2.3):
10,000 published posts ≈ 20,000 rows; 100k published ≈ 200k rows. Plans below assume the large
case so the design is safe if the studio ever bulk-imports.

### 8.1 `getPostBySlug` (detail — the hot path)

```
SELECT ... FROM posts
WHERE slug = ? AND published_at IS NOT NULL   -- published-only (docs/ARCHITECTURE.md:170-174)
LIMIT 1;
```
- **Plan:** ref lookup on `posts_slug_idx` (§7.1) → 1–2 rows (draft+published share slug) →
  filter `published_at IS NOT NULL`. `type=ref`, `rows≈1–2`, no filesort. **Scales flat** at any
  table size. Same for `getProjectBySlug`.

### 8.2 `getJournal` list — newest-first, paginated

```
SELECT ... FROM posts
WHERE published_at IS NOT NULL
ORDER BY published_at DESC
LIMIT ? OFFSET ?;
```
- **Plan with `posts_published_at_idx`:** backward index scan on `published_at` — the `ORDER BY`
  is satisfied by the index (**no filesort**), reads `OFFSET+LIMIT` index entries.
- **Deep-offset caveat (the real scale risk):** Strapi's default pagination is `LIMIT/OFFSET`.
  At page 500 (`OFFSET 12000`) MySQL still walks 12,000 index rows before returning 24. On a
  100k-row table deep pages degrade. **Mitigations (owned jointly with API Designer, who sets
  pagination policy per `docs/SRS.md:344-346` / `docs/ARCHITECTURE.md`):**
  1. **Cap page depth** — the journal is browsed newest-first; deep archive pages are rarely
     requested (and each page is ISR-cached 300s, `docs/ARCHITECTURE.md:156`, so the DB is hit
     at most once per revalidation window, not per visitor). This alone makes offset pagination
     acceptable for realistic volumes.
  2. **Keyset (seek) pagination** if volume ever justifies it: `WHERE published_at < :cursor
     ORDER BY published_at DESC LIMIT n` — O(log n) per page regardless of depth. Requires the
     API to expose a cursor (API Designer). Recommended if EC-2's 10k is real.
  3. Ensure `pageSize` has a **server-enforced max** (API Designer) so no request can pull all
     rows unbounded (`docs/SRS.md:344-346`).
- **`published_at` tie-break:** if multiple posts share the same `published_at` (bulk import),
  add `id` as a secondary sort/cursor key to keep ordering deterministic across pages —
  otherwise keyset pagination can skip/repeat rows. **Flag for API Designer.**

### 8.3 `getProjects({category})` — filtered gallery at scale

```
SELECT p.* FROM projects p
JOIN projects_category_lnk l ON l.project_id = p.id
WHERE l.category_id = ? AND p.published_at IS NOT NULL
ORDER BY p.`order` ASC, p.published_at DESC   -- R1 canonical gallery order
LIMIT ? OFFSET ?;
```
- **Plan:** ref on `projects_category_lnk_ifk (category_id)` → nested-loop join to `projects` PK.
  Selective when categories partition the set. The `ORDER BY \`order\` ASC, published_at DESC`
  (R1) is served by `projects_order_idx` (§7.2); when a category filter is applied MySQL may still
  filesort the (bounded) filtered set, acceptable at gallery scale.
- Same ISR caching (300s) applies (`docs/ARCHITECTURE.md:155`), bounding DB load.

### 8.4 `generateStaticParams` — `getProjectSlugs` / `getPostSlugs`

```
SELECT slug FROM posts WHERE published_at IS NOT NULL;   -- all published slugs
```
- Full scan of published slugs at **build time** only. At 100k rows this is one bounded scan;
  covering it with an index on `(published_at, slug)` would let it be index-only. **Optional**
  (build-time, not request-time) — flagged, not mandated. If build time becomes a problem at
  scale, switch detail routes to pure on-demand ISR (`dynamicParams=true`,
  `docs/ARCHITECTURE.md:153`) and skip `generateStaticParams` for the long tail.

---

## 9. TIMEZONE & DATA-TYPE RULES (mandated: timestamps timezone-aware)

- **All timestamps are stored UTC and are timezone-aware at the API boundary.** Strapi stores
  `created_at`/`updated_at`/`published_at` as MySQL **`DATETIME(6)`**. **MySQL `DATETIME` has no
  intrinsic timezone**; Strapi enforces tz-awareness at the **application layer** by writing and
  reading **UTC** consistently and serializing **ISO-8601 with `Z`** over the REST API. This
  satisfies "timestamps timezone-aware" (`AGENTS.md:266`) in the only way the engine allows.
  **Honest limitation:** because the column itself is tz-naive, any tool writing to MySQL
  outside Strapi (a manual SQL edit, a raw import) must write UTC or it corrupts ordering. Do
  **not** hand-edit timestamps in SQL.
  - *Alternative considered:* MySQL `TIMESTAMP` (stored/normalized to UTC, tz-aware) instead of
    `DATETIME`. Rejected because Strapi v5 uses `DATETIME(6)` for these columns by default and
    overriding it fights the framework; `TIMESTAMP` also has the 2038 range limit. The
    app-enforced-UTC approach is Strapi's documented model.
- **No `FLOAT` for anything meaningful.** The only floating columns are Strapi-generated ordering
  columns (`*_ord DOUBLE`) and `files.size DECIMAL(10,2)` (KB) — neither is money (there is no
  money, §1). `year`/`order` are `INT`.
- **`utf8mb4`** everywhere so titles/slugs/messages tolerate emoji & non-Latin input (EC-7,
  `docs/SRS.md:369-373`) without truncation or mojibake.
- **Enums** (`ContactSubmission.status`) are stored as Strapi enumeration (string-backed);
  validated at the app layer.

---

## 10. MIGRATIONS — up / down (Strapi-managed + hand-authored index migrations)

Greenfield (`docs/ARCHITECTURE.md:37-39,523`): there is **no data to migrate**, so no backfill.
Two migration surfaces:

### 10.1 Content-type schema (Strapi-managed) — up/down = schema edits

- **Up:** define each content-type's `schema.json` (fields per §4) + components; Strapi runs the
  `CREATE TABLE` / `ALTER TABLE` on boot to reach the §5 shape. Order: create `Category`,
  `Service`, `Project`, `Post`, `Page`, `Home`, `About`, `Global`, `ContactSubmission`
  (relations resolve once both sides exist) (`docs/ARCHITECTURE.md:526-530`). **No `Tag`** (R3) and
  **no `Navigation`** (R11) content types are created.
- **Down:** remove the field/type from `schema.json`; Strapi drops the column/table on boot.
  **Reversible for additive changes.** **Destructive changes** (rename/drop a field holding
  data) are **breaking** and require the **two-phase pattern** (add-new → migrate data →
  remove-old) already flagged at `docs/ARCHITECTURE.md:540-542`. In this greenfield phase all
  changes are additive, so down = drop, no data loss.
- **Caveat:** Strapi's automatic column drop on field removal **destroys that column's data**.
  A real down migration in production must snapshot first. Not a concern pre-launch (no data).

### 10.2 Hand-authored index migrations (`database/migrations/*.js`)

Only the §7 custom indexes are hand-authored. Each must ship with a working **down**
(`AGENTS.md:253-254`):

```sql
-- UP
CREATE INDEX posts_slug_idx                    ON posts (slug);
CREATE INDEX projects_slug_idx                 ON projects (slug);
CREATE INDEX posts_published_at_idx            ON posts (published_at);
CREATE INDEX projects_order_idx                ON projects (`order`, published_at);   -- R1 gallery sort
CREATE INDEX projects_category_lnk_ifk         ON projects_category_lnk (category_id); -- if absent
CREATE INDEX contact_submissions_created_at_idx ON contact_submissions (created_at);   -- R2 (mandatory)
CREATE INDEX contact_submissions_status_idx    ON contact_submissions (status);        -- R2 (mandatory)

-- DOWN (must actually work — AGENTS.md:253)
DROP INDEX posts_slug_idx                     ON posts;
DROP INDEX projects_slug_idx                  ON projects;
DROP INDEX posts_published_at_idx             ON posts;
DROP INDEX projects_order_idx                 ON projects;
DROP INDEX projects_category_lnk_ifk          ON projects_category_lnk;
DROP INDEX contact_submissions_created_at_idx ON contact_submissions;
DROP INDEX contact_submissions_status_idx     ON contact_submissions;
```

- **Idempotency:** guard each `CREATE INDEX` with an existence check (query
  `information_schema.STATISTICS`) so re-running the migration on an environment where Strapi
  already generated an equivalent index does not error.
- **Lock avoidance (`AGENTS.md:261-262`):** all index adds are on **empty tables** at launch
  (greenfield) → no lock risk. **If any index is added later to a populated table >~10k rows**,
  use MySQL 8 online DDL (`ALGORITHM=INPLACE, LOCK=NONE`) or a percona/gh-ost-style tool, and
  run in a low-traffic window. Explicitly flagged because AGENTS.md §5 forbids unplanned locks
  on large tables.

### 10.3 Backfill — N/A

No existing rows (`docs/ARCHITECTURE.md:37-39`). Seed data (placeholder projects/posts, hero
placeholders, and the **R15 placeholder taxonomy** — Categories: Exterior, Interior,
Aerial/Masterplan, Animation; Services: Exterior CGI, Interior CGI, 3D Animation, Virtual Tours,
Masterplans, clearly marked as placeholders pending real values, `docs/PROJECT-BRIEF.md:111-113`)
is inserted via Strapi admin / a seed script, **not** a SQL backfill
(`docs/ARCHITECTURE.md:530-531`).

### 10.4 Retention / purge — `ContactSubmission` (R2, 180-day)

`ContactSubmission` holds PII (§4.9), so R2 (`docs/PROJECT-BRIEF.md:87`) mandates a **180-day
auto-purge**. Rows are **hard-deleted** 180 days after `created_at`:

```sql
-- retention job (scheduled daily; owned by Backend/DevOps, not a Strapi schema migration)
DELETE FROM contact_submissions
WHERE created_at < (NOW() - INTERVAL 180 DAY)
LIMIT 1000;   -- batched to avoid a long lock; repeat until 0 rows affected
```

- **Served by** `contact_submissions_created_at_idx` (§7.4) — the delete predicate is a range scan
  on `created_at`.
- **Both draft and published rows** (D&P OFF for this type, so effectively one row per submission)
  are removed; there is no soft-delete/`archived` grace beyond 180 days — `status='archived'` still
  purges at 180 days.
- **Batched delete** (`LIMIT 1000`, loop) avoids a long table lock on a large backlog
  (`AGENTS.md:261-262`).
- **Implementation surface:** a scheduled job (cron / Strapi lifecycle / DevOps scheduler), **not**
  a schema migration. Backend owns the job; this document specifies the predicate and cadence only.

---

## 11. N+1 AUDIT — every relation lazily loaded by the Next.js reads

Auditing each query in `lib/strapi/queries.ts` (`docs/ARCHITECTURE.md:346-361`). The Architect's
N+1 guard is at the **HTTP layer** (one REST call per page via `populate`,
`docs/ARCHITECTURE.md:118-124`). This section audits the **SQL layer inside Strapi**, because a
single populated REST call can still fan out into **multiple SQL queries** (Strapi loads each
relation/media/component level as a separate batched query — it does **not** emit one giant
JOIN). The risk is not per-row N+1 (Strapi batches with `WHERE ... IN`), but **populate depth**
turning into a fixed number of extra round-trips.

| Query (`lib/strapi/queries.ts`) | Relations populated | SQL fan-out | N+1 risk & fix |
|---|---|---|---|
| `getProjects({page,category})` | `cover` (media), `category` | ~3 queries: page of projects → 1 batched morph load of all covers (`WHERE related_id IN (…)`) → 1 batched category link load. | **No N+1.** Batched by page. **Fix already in place:** `populate=cover,category` + `fields` narrows columns; `pageSize` bounds the IN-list. Do **not** populate `gallery`/`body` on the list (over-fetch). |
| `getProjectBySlug(slug)` | `cover`, `gallery`, `category`, `seo`(+ogImage) | 1 project + 1 morph load (cover+gallery, batched) + 1 category + 1 component + 1 morph for ogImage ≈ **≤5 queries, constant.** | **No N+1** (single entity). **EC-2 200-image guard:** gallery returns up to N morph rows in ONE query; the **frontend** lazy-loads/paginates rendering (`docs/ARCHITECTURE.md:194-196`) — the DB read is one batched query regardless. |
| `getJournal({page})` | `cover` | page of posts → 1 batched cover morph. `readingTime`/`author` are scalar columns (no extra query). | **No N+1.** No `tags` populate (type removed, R3), so the m2m fan-out is gone entirely. Keep `fields` narrow (title, slug, excerpt, readingTime, author, publishedAt) + `cover`. |
| `getPostBySlug(slug)` | `cover`, `seo` | ≤3 queries, constant (no tags). | **No N+1.** |
| `getServices()` | `icon`, `seo` | small set → 1 services + 1 batched icon morph + components. | **No N+1** (bounded set). |
| `getNavTaxonomy()` | `Category` + `Service` lists | 2 small full reads. | **No N+1**; tiny tables. Nav is **derived** from Category + Service (R11) — there is no editable `Navigation` type/singleton to read. |
| `getHome()` | `featuredProjects`(+their `cover`), `heroPosterH1`/`heroPosterH2` media, `seo`, `wireframeAnnotations` | home singleton → 1 `homes_featured_projects_lnk` → 1 **batched** load of all featured projects → 1 **batched** cover morph for them → poster media morph → components. `heroFrameManifestUrl`/`heroVideoUrl`/`wireframe*` scalars add no query. | **Watch item:** `featuredProjects.cover` is a nested media populate. Strapi batches covers for all featured projects in **one** morph query (`WHERE related_id IN (…)`), so it is **not** N+1 — **provided** `populate` is written as `featuredProjects.cover` in one call, never a loop fetching each featured project. **Fix/guard:** keep this in the single `getHome` populate tree; cap `featuredProjects` to a small curated count (e.g. ≤12). |

**Cross-cutting fixes (already mandated by Architecture, restated for the DB layer):**
- All reads stay inside `lib/strapi/queries.ts` (`docs/ARCHITECTURE.md:122-124`) so no component
  can introduce a per-item fetch → no request-layer N+1.
- Every `populate` must be paired with `fields` to avoid pulling `LONGTEXT body`/`formats` JSON
  on list endpoints (bandwidth + memory).
- **Do not populate deep relation chains** (e.g. `featuredProjects.category.projects`) — each
  level is another batched query and can explode payload; keep populate trees ≤2 levels for
  lists, ≤3 for detail.

---

## 12. ASSUMPTIONS

- **A-1** The §5 DDL, index names, and D&P/uid uniqueness representation are **Strapi v5's
  generated behavior on MySQL as I understand it**, not a hand-written schema. Exact
  engine-generated column widths, index names, and the precise uid-uniqueness constraint
  **must be verified against the real generated schema** after Strapi is stood up
  (`docs/ARCHITECTURE.md:528`). The §7.1 slug/D&P caveat is the highest-risk item to verify.
- **A-2** Rich-text fields use Strapi v5 **blocks** (stored as JSON in `LONGTEXT`); if the team
  prefers Markdown or the CKEditor plugin the storage stays `LONGTEXT` but the payload shape
  changes. Flagged for API Designer / Frontend (render pipeline differs).
- **A-3** `Category` D&P: I set `Category` D&P **ON** (matching Architect
  `docs/ARCHITECTURE.md:367`). If taxonomy should never have drafts, set it OFF — a one-line schema
  flag. Not load-bearing; confirm with PM. (`Tag` removed per R3, so its D&P question is moot.)
- **A-4** `Project.featured` boolean vs `Home.featuredProjects` relation are **two mechanisms for
  the same goal**; `docs/ARCHITECTURE.md:376` uses the relation. **Pick one** — I recommend the
  Home relation (ordered, curated) and dropping `featured`. Do not build both.
- **A-5** Home editorial section fields (§4.6) are **partial** — the full shared-body section
  list is `docs/SRS.md:431-433` Q-2 / `docs/ARCHITECTURE.md:592` Q-2 (owned by UI/UX). The
  hero fields (R5) and the blueprint/wireframe section fields (R14) are now **fully modeled**;
  §4.6 still leaves the remaining generic editorial section slots pending Q-2.
- **A-6** Category and Service **values** (the taxonomy content) are unknown —
  `docs/SRS.md:447-449` Q-8 / `docs/ARCHITECTURE.md:600` Q-8. I modeled the **structure**, not
  the rows.
- **A-7** `Page` (C-3) now backs the **`/privacy`** Privacy Policy route added by R2
  (`docs/PROJECT-BRIEF.md:88,115`). It remains available for future legal/flex pages; a `/[slug]`
  catch-all for additional pages would be an SRS/Architect follow-up, but `/privacy` is a concrete
  consumer, so `Page` is no longer route-less. **Resolved (R2).**
- **A-8** **Resolved (R11).** Navigation is **derived** from Category + Service; the editable
  `Navigation` type is removed (§4.8). Architect A-6 stands. No "supersedes A-6" claim remains.
- **A-9** **Resolved (R2).** `ContactSubmission` **is persisted** (§4.9), introducing PII at rest.
  Q-7 is answered: (a) retention = **180-day auto-purge** (§10.4); (b) inquiries **do** persist
  (write via server-only token) **and** email is sent; (c) a required consent checkbox + `/privacy`
  page are mandated (outside this document). No longer an open escalation.
- **A-10** `Global` single type (site name, logo, default SEO, social links, footer, contact
  display email) is inferred from FR-5 (footer, `docs/SRS.md:128-130`) and FR-6 (SEO) as the
  "Global settings" my task names; its exact field set is a UI/UX + Content decision, not fully
  specified in the sources.
- **A-11** Deep-offset pagination is acceptable at realistic volumes given ISR caching (§8.2);
  keyset pagination is recommended **only if** EC-2's 10k+ scale is real. The pagination policy
  (page size cap, cursor vs offset) is the **API Designer's** to finalize
  (`docs/SRS.md:344-346`, `docs/ARCHITECTURE.md`).

**This section is not empty.** Eleven assumptions (A-1…A-11) are declared. The three cross-document
conflicts from iteration 0 (§0 C-1…C-3) are now **resolved** by Orchestrator rulings R1–R15
(`docs/PROJECT-BRIEF.md:78-115`) and applied literally: C-1 by R2 (persist + 180-day purge), C-2 by
R11 (derived nav), C-3 by R2 (`/privacy` consumes `Page`). Q-7 is closed (R2); Q-2 (remaining Home
editorial sections) and Q-8 (real taxonomy values, seeded as R15 placeholders) stay open and owned
by UI/UX + the user. No requirement or field was invented beyond the sources or the rulings without
being labeled here or in §0, per the GLOBAL CONTRACT.
