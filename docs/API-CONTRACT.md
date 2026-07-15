# Studiodota.net — API Contract

> Role: API Designer (`AGENTS.md` §4). Contract-first. This document is the single source of
> truth that prevents the Next.js frontend and the Strapi backend from drifting.
> Sources of truth: `docs/PROJECT-BRIEF.md` (incl. §9b RESOLVED DECISIONS R1–R15), `docs/SRS.md`,
> `docs/ARCHITECTURE.md`.
> Governed by `AGENTS.md` GLOBAL CONTRACT. **Spec only — no production code.**
> Version: 1.1 — 2026-07-14 (critique iteration 1: applied R1, R2, R3, R4, R5, R8, R9, R10, R11)

---

## 0. SCOPE, TENANCY & VERSIONING (read first)

### 0.1 Two contract layers

This system has **two** HTTP surfaces. Both are specified here.

| Layer | Caller → callee | Protocol | Who calls it |
|---|---|---|---|
| **A. Content read API** | Next.js server → Strapi v5 | Strapi REST Content API (`/api/*`) | Server-side only (RSC, `generateStaticParams`, ISR, preview). **Never the browser.** |
| **B. Public route handlers** | Browser / Strapi webhook → Next.js | Next.js Route Handlers (`/api/*`) | `POST /api/contact` (visitor), `POST /api/revalidate` (Strapi webhook), `GET /api/preview` / `GET /api/exit-preview` (editor) |

The protocol decision (REST over GraphQL) is fixed by `docs/ARCHITECTURE.md:104-116` (§2.3) and
`docs/ARCHITECTURE.md:446-453` (§5-A). This contract does **not** re-open it.

### 0.2 Tenancy — read endpoints are public + cached, NOT tenant-scoped

Per `AGENTS.md:216-218`, an API Designer normally states how the tenant is resolved on every
endpoint. **This project overrides that rule.** `docs/PROJECT-BRIEF.md:79`, `docs/SRS.md:59-63`
(NG-1/NG-2), and `docs/ARCHITECTURE.md:11-29` (§0, governance conflict already surfaced and
resolved pending Orchestrator confirmation) establish a **single-tenant public marketing site**.

Therefore, in place of tenant scoping, every read endpoint below states explicitly:

- **Content is public.** All Layer-A responses render on public, unauthenticated pages.
- **Delivery is CDN-cached.** The browser never reads Strapi. Next.js reads Strapi server-side,
  caches the response with a **named cache tag** (`docs/ARCHITECTURE.md:134-146`, §2.4), and
  serves the rendered page from the Vercel CDN. Strapi sees roughly one request per route per
  revalidate window, not one per visitor.
- **The Strapi API itself is token-gated and server-only** (see §0.3). It is not exposed to the
  public internet as an anonymous read API — this is defense-in-depth, not tenant isolation.

There is exactly one logical tenant. Slug uniqueness is **global** (`docs/ARCHITECTURE.md:384-385`).
If a second tenant is ever introduced, this contract must be revisited (`docs/ARCHITECTURE.md:513`).

### 0.3 Authentication model

| Layer | Auth |
|---|---|
| Layer A (Strapi reads) | **Read-only Strapi API Token**, `Authorization: Bearer <STRAPI_API_TOKEN>`. Server-only env var, never in the client bundle (`docs/ARCHITECTURE.md:181-183`, FE rule 10). Strapi's **public role has `find`/`findOne` disabled** on all content types, so anonymous callers cannot hit Strapi directly. |
| Layer B `/api/contact` | Caller (browser)→Next: **none** (public form; abuse-controlled by honeypot + rate limit, §3.1). Next→Strapi write of the `ContactSubmission` row (R2): a **server-only, write-scoped Strapi API token** (`CONTACT_WRITE_TOKEN`), never in the client bundle. The browser never writes to Strapi. |
| Layer B `/api/revalidate` | **Shared-secret HMAC** in `x-strapi-signature`, verified with a timing-safe compare (`docs/ARCHITECTURE.md:414-417`). |
| Layer B `/api/preview` / `/api/exit-preview` | **Shared secret** query param (`PREVIEW_SECRET`), timing-safe compare (`docs/ARCHITECTURE.md:419-421`). |

"Read-only token" and "public form" are the scopes. No end-user roles exist (NG-2). This satisfies
`AGENTS.md:216` ("'Authenticated' is not enough") by naming the exact credential per endpoint.

### 0.4 Versioning

- **This contract is v1.** Greenfield; no prior contract, so nothing here is a breaking change yet.
- Strapi's Content API lives at the unversioned `/api` base by Strapi convention. Our *contract*
  version is tracked by this document's version header. A content-model change that **drops or
  renames a field** a route depends on is a **breaking change** and requires: (a) bumping this
  document, (b) the two-phase deploy in `docs/ARCHITECTURE.md:540-542`.
- Next.js Layer-B routes are internal to this one frontend (only the contact form and the Strapi
  webhook call them). A breaking change to `/api/contact`'s request shape requires shipping the
  form and the handler together (same deploy) — no external consumer to version for.

### 0.5 Explicitly deferred (owned by other roles — not invented here)

- **Field-level content model** (column types, nullability, constraints, rich-text block schema)
  → **DB / Data Architect** (`AGENTS.md` §5; `docs/ARCHITECTURE.md:52-54`). This contract defines
  the **response DTO shape** each route consumes; where a field's exact type is a DB decision it is
  marked `⟨DB⟩` and listed under §8 ASSUMPTIONS, not fixed here.
- **Home body section list** → **UI/UX** (`docs/SRS.md` Q-2). The `Home` DTO below has a typed
  envelope plus an open `sections` slot flagged `⟨UI/UX Q-2⟩`.
- **"Pages" content type** — the task lists a "Pages" content type, but **no generic Pages
  collection exists** in `docs/PROJECT-BRIEF.md`, `docs/SRS.md`, or `docs/ARCHITECTURE.md`. The
  only page-level singletons are **Home** and **About** (`docs/ARCHITECTURE.md:375-379`, §4.2). I
  interpret "Pages" as the **page-level singletons (Home + About)** and contract them as such (§2.4,
  §2.5). A CMS-authored arbitrary-page builder beyond the fixed 7-route sitemap (`docs/SRS.md:114-116`
  FR-1) would be a **new requirement** — escalated in §8, not invented.

---

## 1. SHARED COMPONENTS (referenced by every endpoint)

### 1.1 Envelope (Strapi v5 REST)

No endpoint returns a bare array (`AGENTS.md:229`). Strapi v5 always envelopes:

```jsonc
// Collection (list) response
{
  "data": [ /* array of entity objects (v5: fields flattened, NOT nested under "attributes") */ ],
  "meta": { "pagination": { "page": 1, "pageSize": 12, "pageCount": 9, "total": 103 } }
}

// Single entity or single-type response
{
  "data": { /* one entity object */ },
  "meta": {}
}
```

> **Strapi v5 note:** v5 **flattened** the response — entity fields sit at the top level of each
> `data` item alongside `id` and `documentId`; there is no `attributes` wrapper (this was a v4
> shape). Relations and media are still nested objects/arrays. The Next.js read layer
> (`lib/strapi/queries.ts`) unwraps `data`/`meta` into the typed DTOs below; the **wire shape is
> always enveloped**.

### 1.2 Internal `Paginated<T>` (Next.js read-layer return)

The read layer normalizes Strapi's `meta.pagination` into a stable internal envelope so route
components never touch Strapi's raw meta:

```ts
type Paginated<T> = {
  items: T[];
  page: number;        // 1-based
  pageSize: number;
  pageCount: number;
  total: number;
};
```

### 1.3 `Media` object (Strapi v5 upload)

```ts
type Media = {
  id: number;
  documentId: string;
  url: string;               // absolute CDN URL (S3/R2 + CDN, docs/ARCHITECTURE.md:186-192)
  alternativeText: string | null;  // → next/image alt; null ⇒ decorative
  width: number | null;      // present for images; drives explicit width/height (CLS guard, G-7)
  height: number | null;
  mime: string;              // e.g. "image/webp", "video/mp4"
  size: number;              // KB
  formats?: {                // responsive derivatives (images only)
    thumbnail?: MediaFormat; small?: MediaFormat; medium?: MediaFormat; large?: MediaFormat;
  } | null;
};
type MediaFormat = { url: string; width: number; height: number; mime: string; size: number };
```

### 1.4 `Seo` component (shared, per-page)

Serves FR-6 / AC-6 (unique title, description, canonical, OG per route) and US-13.

```ts
type Seo = {
  metaTitle: string;              // required; unique per route (AC-6)
  metaDescription: string;        // required; unique per route (AC-6)
  canonicalURL: string | null;    // absolute; null ⇒ frontend derives from route
  metaImage: Media | null;        // OG/Twitter image
  ogTitle: string | null;         // falls back to metaTitle
  ogDescription: string | null;   // falls back to metaDescription
  metaRobots: string | null;      // e.g. "index,follow"; null ⇒ default index,follow
  structuredData: object | null;  // JSON-LD; ⟨DB⟩ exact schema per type owned by SEO/Perf role
};
```

### 1.5 Strapi error object (Layer A)

Every non-2xx Strapi response uses this shape. The read layer maps it to a typed `StrapiError`
and **never leaks the raw body** to the caller (`docs/ARCHITECTURE.md:344`).

```jsonc
{ "data": null,
  "error": { "status": 404, "name": "NotFoundError", "message": "Not Found", "details": {} } }
```

### 1.6 Layer-B error object (Next.js route handlers)

```ts
type ApiError = { ok: false; code: string; message?: string; /* + code-specific fields */ };
```

Machine `code` values are enumerated per endpoint. `message` is a safe, generic human string — it
**never** echoes submitted content and never leaks internals (`AGENTS.md:230`, `docs/SRS.md:376-377`).

### 1.7 Common query parameters (Layer A, all Strapi reads)

| Param | Purpose | Contract rule |
|---|---|---|
| `status` | `published` (default) or `draft` | Public routes **omit** it (⇒ published). Draft only in preview mode + token (`docs/ARCHITECTURE.md:172-180`). Public reads **must never** send `status=draft` (FR-40/AC-31, EC-4). |
| `fields[n]` | select scalar fields | Every read selects an **explicit field list** (no over-fetch). |
| `populate` | expand relations/media/components | Every read declares an **explicit populate tree** — never `populate=*` (N+1 & over-fetch guard, `docs/ARCHITECTURE.md:118-124`). |
| `filters[...]` | filter (e.g. by slug, category) | Parameterized by Strapi (no injection surface). |
| `sort[n]` | ordering | e.g. `sort[0]=publishedAt:desc`. |
| `pagination[page]` / `pagination[pageSize]` / `pagination[withCount]` | offset pagination | See §1.8. |
| `locale` | **not used** — English only (FR-8, NG-4) | Never sent. |

### 1.8 Pagination policy (applies to every list endpoint — `AGENTS.md:231`)

- **Style:** **offset / page-based** (Strapi v5 default). `pagination[page]` (1-based) +
  `pagination[pageSize]`, `pagination[withCount]=true` so `meta.pagination.total`/`pageCount`
  are returned.
- **Rejected alternative:** cursor pagination — unnecessary here (small, stable, admin-curated
  collections; `/projects` and `/journal` are browsed, not infinitely streamed). Offset is
  simpler and Strapi-native. Revisit only if a collection grows past ~10k with hot deep paging.
- **Defaults & maxes** (frontend-facing; enforced by Strapi config `api.rest.maxPageSize` **and**
  clamped in `lib/strapi/queries.ts` so a crafted `pageSize` can't force an unbounded scan —
  addresses `docs/SRS.md:343-346` EC-2, 10k rows):

  | List | Default `pageSize` | Max `pageSize` | Default sort |
  |---|---|---|---|
  | `/projects` | 12 | 48 | `sort[0]=order:asc` then `sort[1]=publishedAt:desc` (R1 — `Project.order` scalar exists) |
  | `/journal` | 10 | 48 | `sort[0]=publishedAt:desc` (A-5) |
  | slug harvest (`generateStaticParams`) | 100 | 100 | n/a — loops pages until `page > pageCount` |

- **Out-of-range page** (`page > pageCount`): Strapi returns `200` with `data: []`. The frontend
  renders the list empty state, **not** a 404 (a paginated list page itself always exists).

---

## 2. LAYER A — CONTENT READ ENDPOINTS (Next.js server → Strapi v5)

> For **every** endpoint in this section:
> - **Auth:** `Authorization: Bearer <STRAPI_API_TOKEN>` (read-only, server-only, §0.3).
> - **Tenant scoping:** N/A — single-tenant. **Content is public; delivery is CDN-cached** (§0.2).
> - **Idempotency:** GET, safe & idempotent. No side effects on Strapi.
> - **Rate limit:** N/A to public callers (server-only, token-gated). Strapi sees ~1 request per
>   route per ISR revalidate window because Next caches responses by tag. Recommend a coarse
>   global limit at Strapi (e.g. `koa-ratelimit`) as defense-in-depth; not part of the hot path.
> - **Side effects:** **None** at Strapi. On the Next.js side each read attaches Next cache
>   **tags** (named per `docs/ARCHITECTURE.md:134-146`) and an ISR `revalidate` floor — listed per
>   endpoint. Cache-tag attachment is a client-of-Strapi caching concern, not a server mutation.
> - **Breaking change:** none (v1). Dropping/renaming a consumed field is breaking (§0.4).

Common failure responses for Layer-A GETs (enumerated once; per-endpoint notes add only deviations):

| `error.name` | HTTP | When it fires | Read-layer handling |
|---|---|---|---|
| `ValidationError` | 400 | malformed query (bad `filters`/`populate`) — a bug in `queries.ts` | throw `StrapiError`; fail loudly in dev/build |
| `UnauthorizedError` | 401 | missing/invalid API token | throw `StrapiError`; **P0 config error** — surfaces at build |
| `ForbiddenError` | 403 | token lacks `find`/`findOne` on the type | throw `StrapiError`; P0 config error |
| `NotFoundError` | 404 | single type not created yet, or `/:documentId` miss | see per-endpoint 404 semantics |
| (transport) | 502 / 503 / timeout | Strapi down/unreachable | throw `StrapiError` → **build fails** (`generateStaticParams`, A-10) **or** ISR serves last-good page at runtime (`docs/ARCHITECTURE.md:456-461`, EC-5). Never renders a raw stack trace to the visitor (`docs/SRS.md:360-362`). **Q-5 still open.** |

### 2.1 Projects

#### 2.1.1 `GET /api/projects` — project gallery (list, paginated)

Serves FR-19, FR-20, AC-15, AC-16, and the featured-projects source on Home (FR-18).

- **Request query** (list of cards; category filter optional):

  ```
  GET /api/projects
    ?fields[0]=title&fields[1]=slug&fields[2]=excerpt&fields[3]=order
    &populate[cover][fields][0]=url&populate[cover][fields][1]=alternativeText
      &populate[cover][fields][2]=width&populate[cover][fields][3]=height&populate[cover][fields][4]=formats
    &populate[category][fields][0]=name&populate[category][fields][1]=slug
    &sort[0]=order:asc&sort[1]=publishedAt:desc
    &pagination[page]=1&pagination[pageSize]=12&pagination[withCount]=true
    [ &filters[category][slug][$eq]=<categorySlug> ]        // FR-20 filter (AC-16)
  ```

  | Field | Type | Required | Constraint / notes |
  |---|---|---|---|
  | `page` | integer | no | ≥1, default 1 |
  | `pageSize` | integer | no | 1..48, default 12 (§1.8); clamped server-side |
  | `filters[category][slug][$eq]` | string | no | one of the published Category slugs (§2.6). Unknown slug ⇒ empty `data`, `total:0` (not an error) |

- **2xx response** `200` — `Paginated<ProjectCard>` (Strapi envelope → normalized):

  ```ts
  type ProjectCard = {
    documentId: string;
    title: string;
    slug: string;                 // URL-safe uid (EC-7); unique globally
    excerpt: string | null;       // ⟨DB⟩ short summary for the card
    cover: Media | null;          // gallery thumbnail (may be null ⇒ frontend placeholder, EC-1/R-6)
    category: { name: string; slug: string } | null;
    order: number | null;         // R1: `Project.order` — integer, nullable, default null; manual
                                  //   sort weight. Gallery sorts order:asc then publishedAt:desc.
  };
  ```

  Example (wire, before normalization):

  ```jsonc
  { "data": [ { "id": 42, "documentId": "a1b2", "title": "Loft Thirty One", "slug": "loft-thirty-one",
      "excerpt": "Aerial CGI…", "order": 1,
      "cover": { "id": 7, "documentId": "c3", "url": "https://cdn.studiodota.net/uploads/loft.webp",
        "alternativeText": "Aerial render of a hillside villa", "width": 1600, "height": 900,
        "mime": "image/webp", "size": 210.4, "formats": { "small": { "url": "…", "width": 500, "height": 281, "mime": "image/webp", "size": 42.1 } } },
      "category": { "name": "Residential", "slug": "residential" } } ],
    "meta": { "pagination": { "page": 1, "pageSize": 12, "pageCount": 9, "total": 103 } } }
  ```

- **4xx/5xx:** common table (§2). No endpoint-specific errors.
- **Next cache:** tags `['projects','nav']`; ISR `revalidate: 300` (`docs/ARCHITECTURE.md:152`).

#### 2.1.2 `GET /api/projects` (by slug) — case-study detail

Serves FR-21, FR-22, FR-23, AC-17, AC-18. **Fetched via slug filter, not `/:documentId`**, because
the public URL key is the slug and Strapi v5's record key is `documentId`.

- **Request query:**

  ```
  GET /api/projects
    ?filters[slug][$eq]=<slug>
    &fields[0]=title&fields[1]=slug&fields[2]=excerpt&fields[3]=year&fields[4]=client&fields[5]=location&fields[6]=technique
    &populate[cover][populate]=*                         // scalar-limited in practice; explicit in queries.ts
    &populate[gallery][fields][0]=url&…                   // gallery media[]
    &populate[category][fields][0]=name&populate[category][fields][1]=slug
    &populate[body]=true                                  // rich text / blocks ⟨DB⟩
    &populate[seo][populate][metaImage]=true
    &pagination[pageSize]=1
  ```

  | Field | Type | Required | Constraint |
  |---|---|---|---|
  | `filters[slug][$eq]` | string | **yes** | the `[slug]` route segment; URL-safe |

- **2xx response** `200` — `{ data: Project[], meta }`. The read layer takes `data[0]`:
  - **match found** → returns `Project`.
  - **no match** (`data: []`) → returns **`null`** → the route calls `notFound()` → **HTTP 404**
    with the site 404 page (FR-23 / AC-18). Note Strapi returns `200` with empty array here — the
    **404 is produced by Next.js**, not Strapi.

  ```ts
  type Project = {
    documentId: string;
    title: string;                 // may be long (EC-7) — layout truncates/wraps per UI/UX
    slug: string;
    excerpt: string | null;
    cover: Media | null;
    gallery: Media[];              // may be empty (EC-1); lazy-loaded below fold (EC-2, 200 imgs)
    body: unknown;                 // ⟨DB⟩ rich-text/blocks JSON — schema owned by DB Architect
    category: { name: string; slug: string } | null;
    year: number | null;          // ⟨DB⟩ representative metadata (FR-22 "fields defined by the type")
    client: string | null;        // ⟨DB⟩
    location: string | null;      // ⟨DB⟩
    technique: string | null;     // ⟨DB⟩ e.g. "image-sequence CGI"
    seo: Seo;
  };
  ```

  > `year`/`client`/`location`/`technique` are a **representative** metadata set (FR-22 delegates the
  > exact field set to the content model). Marked `⟨DB⟩`; escalated in §8, not fixed here.

- **4xx/5xx:** common table (§2). A published-only read of a **draft** slug returns empty `data`
  ⇒ 404 — a draft never renders publicly (FR-40 / EC-4).
- **Next cache:** tags `['project:<slug>','nav']`; ISR `revalidate: 3600` (`docs/ARCHITECTURE.md:153`).

#### 2.1.3 `GET /api/projects` (slug harvest) — `generateStaticParams`

- **Request:** `?fields[0]=slug&pagination[pageSize]=100&pagination[page]=N` — loop pages until
  `page > meta.pagination.pageCount`. Published only.
- **2xx:** `{ data: [{ slug }], meta }` → read layer returns `string[]`.
- **Cache:** runs at build; `dynamicParams=true` so slugs published later render on first hit via
  ISR (`docs/ARCHITECTURE.md:153`).

### 2.2 Services

#### 2.2.1 `GET /api/services` — service offerings + Services mega-menu source

Serves FR-24, AC-19, and the Services mega-menu groupings (FR-3).

- **Request query:**

  ```
  GET /api/services
    ?fields[0]=title&fields[1]=slug&fields[2]=summary&fields[3]=order
    &populate[body]=true
    &populate[icon][fields][0]=url&populate[icon][fields][1]=alternativeText
    &populate[seo][populate][metaImage]=true
    &sort[0]=order:asc
    &pagination[pageSize]=48&pagination[withCount]=true
  ```

- **2xx response** `200` — `{ data: Service[], meta }` → normalized to `Service[]`:

  ```ts
  type Service = {
    documentId: string;
    title: string;
    slug: string;
    summary: string | null;    // ⟨DB⟩ one-line offering summary (mega-menu + card)
    body: unknown;             // ⟨DB⟩ rich text
    icon: Media | null;        // ⟨DB⟩ optional
    order: number | null;
  };
  ```

  Bare-array rule (`AGENTS.md:229`): the **wire** is enveloped `{data,meta}`; the read layer's
  unwrap to `Service[]` is internal to the server, never a wire response.

- **Pagination:** the collection is small (offerings), one page suffices, but the endpoint is still
  paginated (`pageSize=48`) — no unbounded fetch (`AGENTS.md:231`).
- **4xx/5xx:** common table (§2).
- **Next cache:** tags `['services','nav']`; ISR `revalidate: 3600` (`docs/ARCHITECTURE.md:155`).

### 2.3 Categories (Projects taxonomy — powers filter + Projects mega-menu)

#### 2.3.1 `GET /api/categories`

Serves FR-3 (Projects mega-menu groupings) and FR-20 (gallery filter taxonomy). The nav taxonomy is
**derived** from this collection + Services (`docs/ARCHITECTURE.md:380-382`, §4.2; A-6).

- **Request query:**

  ```
  GET /api/categories?fields[0]=name&fields[1]=slug&fields[2]=order&sort[0]=order:asc&pagination[pageSize]=100
  ```

- **2xx response** `200` — `{ data: Category[], meta }`:

  ```ts
  type Category = { documentId: string; name: string; slug: string; order: number | null };
  ```

- **4xx/5xx:** common table (§2).
- **Next cache:** tag `['nav']`; ISR `revalidate: 3600`. (`nav` tag dirtied by taxonomy change,
  `docs/ARCHITECTURE.md:146`.)

### 2.4 Pages — Home singleton (`/` and `/home-2`)

> **"Pages" interpretation (§0.5):** the Home single type is the page-level content driving both
> home variants. It is contracted here; About is §2.5. No generic Pages collection exists —
> escalated in §8.

#### 2.4.1 `GET /api/home` — home page content (single type)

Serves FR-9…FR-18, AC-8…AC-14. Both `/` and `/home-2` read the **same** Home singleton; only the
hero slot differs (FR-13 / AC-10): `/` binds `heroFrameManifestUrl` + `heroPosterH1`; `/home-2` binds
`heroVideoUrl` + `heroPosterH2` (R5).

> **R4 — `/home-2` head (resolves the duplicate-content defect).** Because both routes share the one
> Home `seo` component, the frontend **must not** emit identical index metadata on both. `/home-2` is a
> demo/AB variant, **not** a canonical page. On `/home-2` the frontend emits, regardless of the shared
> `seo` values: `<meta name="robots" content="noindex, follow">` **and** `<link rel="canonical"
> href="https://studiodota.net/">` (canonical → `/`). `/home-2` is **excluded from the nav** (it is not
> a nav destination — nav is derived, R11/§2.7) and **excluded from `sitemap.xml`**. `/` emits the
> Home `seo` normally (`index,follow`, self-canonical). This head divergence is a frontend render rule,
> not a second Strapi field — the singleton is unchanged.

- **Request query:**

  ```
  GET /api/home
    ?fields[0]=heroFrameManifestUrl&fields[1]=heroVideoUrl   // R5: scalar refs (see below)
    &populate[heroPosterH1][fields][0]=url&populate[heroPosterH1][fields][1]=alternativeText
      &populate[heroPosterH1][fields][2]=width&populate[heroPosterH1][fields][3]=height&populate[heroPosterH1][fields][4]=formats
    &populate[heroPosterH2][fields][0]=url&populate[heroPosterH2][fields][1]=alternativeText
      &populate[heroPosterH2][fields][2]=width&populate[heroPosterH2][fields][3]=height&populate[heroPosterH2][fields][4]=formats
    &populate[featuredProjects][fields][0]=title&populate[featuredProjects][fields][1]=slug
      &populate[featuredProjects][populate][cover][fields][0]=url&…
    &populate[wireframe][populate]=*         // technical/blueprint section content (FR-17, R14)
    &populate[sections][populate]=*          // ⟨UI/UX Q-2⟩ editorial section slots
    &populate[seo][populate][metaImage]=true
  ```

  > Single types have **no `id`/slug** in the path — `GET /api/home` returns the one entry.

- **2xx response** `200` — `{ data: Home, meta }`:

  ```ts
  type Home = {
    documentId: string;
    // Hero 1 (image-sequence scrub) — R5 canonical fields. Scalar URL to the frame manifest on the CDN.
    heroFrameManifestUrl: string | null;  // URL of the FrameManifest JSON (docs/ARCHITECTURE.md:427-431);
                                          //   null ⇒ frontend uses placeholder frames (FR-11/AC-9)
    heroPosterH1: Media | null;      // R5: Home 1 LCP still (the scrub-hero poster). ≤60KB budget (R6, R13 alt)
    // Hero 2 (looping video, /home-2) — R5 canonical fields.
    heroVideoUrl: string | null;     // R5: resolvable URL to the looping .mp4/.webm; null ⇒ placeholder
                                     //   (FR-15/AC-12). ⟨DB⟩ Media vs URL-string is a CMS modeling detail;
                                     //   frontend needs a resolvable url (+ mime for <source>) either way (A-13).
    heroPosterH2: Media | null;      // R5: Home 2 LCP still (video poster) — a SECOND, distinct poster
    featuredProjects: ProjectCard[]; // FR-18; each links to /projects/[slug] (AC-14)
    wireframe: unknown;              // ⟨DB⟩ technical/blueprint section content (FR-17, R14) — the ONLY
                                     //   place --blueprint is used (FR-7/AC-7/AC-13)
    sections: unknown;              // ⟨UI/UX Q-2⟩ ordered editorial section slots; shape pending Q-2
    seo: Seo;
  };
  ```

  > **R5 — two posters, canonical names.** `heroPosterH1` is the LCP still for Home 1 (`/`, scrub hero);
  > `heroPosterH2` is the distinct LCP still for Home 2 (`/home-2`, video hero). `heroFrameManifestUrl`
  > is a **reference**, not the frames: the client hero runtime fetches the manifest + frames from the
  > CDN directly (`docs/ARCHITECTURE.md:198-206`, §2.6-2), **not** through this API. The `FrameManifest`
  > JSON shape is the hero-runtime contract (§4).

- **404 semantics:** if the Home single type has **never been created/published** in Strapi, Strapi
  returns `404 NotFoundError` (single-type miss). The read layer treats this as a **build/config
  error** (the singleton must exist) — it does **not** render a public 404 for `/`. Escalated as a
  seeding prerequisite (`docs/ARCHITECTURE.md:530` step 2).
- **4xx/5xx:** common table (§2).
- **Next cache:** tags `['home','projects','nav']`; ISR `revalidate: 3600`
  (`docs/ARCHITECTURE.md:150-151`). `/` and `/home-2` share this fetch.

### 2.5 About singleton (`/about`)

#### 2.5.1 `GET /api/about`

Serves FR-25, AC-20.

- **Request query:**

  ```
  GET /api/about?populate[body]=true&populate[cover][populate]=*&populate[seo][populate][metaImage]=true
  ```

- **2xx response** `200` — `{ data: About, meta }`:

  ```ts
  type About = {
    documentId: string;
    body: unknown;            // ⟨DB⟩ rich text / blocks — the about narrative
    cover: Media | null;      // ⟨DB⟩ optional hero/studio image
    seo: Seo;
  };
  ```

- **404 semantics:** same as Home — a missing About singleton is a **seeding/config error**, not a
  public 404 (the `/about` route always exists).
- **4xx/5xx:** common table (§2).
- **Next cache:** tags `['about','nav']`; ISR `revalidate: 3600` (`docs/ARCHITECTURE.md:156`).

### 2.6 Journal / Posts (`/journal`, `/journal/[slug]`)

#### 2.6.1 `GET /api/posts` — journal list (paginated, newest-first)

Serves FR-26, FR-27, FR-30, AC-21, AC-24.

- **Request query:**

  ```
  GET /api/posts
    ?fields[0]=title&fields[1]=slug&fields[2]=excerpt&fields[3]=publishedAt&fields[4]=readingTime
    &populate[cover][fields][0]=url&populate[cover][fields][1]=alternativeText&…
    &sort[0]=publishedAt:desc                             // newest-first (A-5)
    &pagination[page]=1&pagination[pageSize]=10&pagination[withCount]=true
  ```

- **2xx response** `200` — `Paginated<PostCard>`:

  ```ts
  type PostCard = {
    documentId: string;
    title: string;
    slug: string;
    excerpt: string | null;   // ⟨DB⟩
    cover: Media | null;
    publishedAt: string;      // ISO 8601, timezone-aware
    readingTime: number;      // R10: whole minutes, computed server-side on save; renders
                              //   "{n} min read" (COPY-DECK journal.card.readtime.tpl)
  };
  ```

  - **Zero published posts** (FR-30 / AC-24): Strapi returns `200` with `data: []`, `total: 0`. The
    `/journal` route renders the **defined empty state** (copy owned by Content) — **not** a 404,
    not a blank page.

- **4xx/5xx:** common table (§2).
- **Next cache:** tags `['journal','nav']`; ISR `revalidate: 300` (`docs/ARCHITECTURE.md:156`).

#### 2.6.2 `GET /api/posts` (by slug) — post detail

Serves FR-28, FR-29, AC-22, AC-23. Same slug-filter pattern as §2.1.2.

- **Request query:**

  ```
  GET /api/posts
    ?filters[slug][$eq]=<slug>
    &fields[0]=title&fields[1]=slug&fields[2]=publishedAt&fields[3]=readingTime
    &populate[cover][populate]=*
    &populate[body]=true
    &populate[seo][populate][metaImage]=true
    &pagination[pageSize]=1
  ```

- **2xx response** `200` — `{ data: Post[], meta }`; read layer takes `data[0]`:
  - match → `Post`; no match (`data: []`) → **`null`** → `notFound()` → **HTTP 404** (FR-29/AC-23),
    produced by Next.js. A draft slug read published-only ⇒ empty ⇒ 404 (FR-40/EC-4).

  ```ts
  type Post = {
    documentId: string;
    title: string;            // may contain emoji / non-Latin (EC-7)
    slug: string;
    body: unknown;            // ⟨DB⟩ rich text / blocks; may be empty (EC-1)
    cover: Media | null;
    publishedAt: string;      // ISO 8601
    readingTime: number;      // R10: whole minutes, computed server-side on save
    seo: Seo;
  };
  ```

- **4xx/5xx:** common table (§2).
- **Next cache:** tags `['post:<slug>','nav']`; ISR `revalidate: 3600` (`docs/ARCHITECTURE.md:157`).

#### 2.6.3 `GET /api/posts` (slug harvest) — `generateStaticParams`

As §2.1.3: `?fields[0]=slug&pagination[pageSize]=100&pagination[page]=N`, loop to `pageCount`.
Published only. `dynamicParams=true`.

### 2.7 Global / Nav settings

**R11 — nav is DERIVED (authoritative, no longer conditional).** The nav taxonomy is derived from
Categories (§2.3, Projects mega-menu) + Services (§2.2, Services mega-menu). The editable `Navigation`
single type is **removed** — there is **no `GET /api/navigation` endpoint** and no separate editable
nav tree. The read layer composes the two existing reads into one `NavTaxonomy` DTO; **no new Strapi
endpoint is required for nav.** (`/home-2` is never a nav destination — R4.)

```ts
// Composed server-side from GET /api/categories + GET /api/services (no extra Strapi call type).
type NavTaxonomy = {
  projectCategories: Category[];           // Projects mega-menu groupings + filter (FR-3, FR-20)
  services: { title: string; slug: string }[];  // Services mega-menu groupings (FR-3)
};
```

- **Cache:** both underlying reads carry the `nav` tag; a taxonomy change dirties `nav`, which
  revalidates the nav/mega-menu on every page (`docs/ARCHITECTURE.md:146`).

#### 2.7.1 `GET /api/global` — site-global settings (⚠ UNCONFIRMED — flagged, not built)

A `Global` single type for **footer content, social links, and default/fallback SEO** (FR-5 footer;
FR-6 default OG) is **not confirmed** to exist. `docs/ARCHITECTURE.md:380-382` flags it (A-6):
footer contents beyond wordmark+links+contact are a UI/UX+Content decision (`docs/SRS.md:457-458`
A-3), and the default OG image source is unspecified. **This contract does not invent it.**

**Proposed (pending confirmation — see §8 escalation):** if adopted,

- `GET /api/global?populate[defaultSeo][populate][metaImage]=true&populate[social][populate]=*&populate[footer][populate]=*`
- Returns `{ data: Global, meta }` with `{ social: {label,url}[], footer: {...}, defaultSeo: Seo }`.
- Cache tag `['nav']` (or a dedicated `global` tag), `revalidate: 3600`.

Until confirmed, footer renders from the fixed sitemap + wordmark (FR-5 minimum) with no CMS call,
and default OG falls back to a static asset.

---

## 3. LAYER B — PUBLIC ROUTE HANDLERS (browser / webhook → Next.js)

### 3.1 `POST /api/contact` — contact form submission

Serves FR-31…FR-38, AC-25…AC-30, EC-8, R-5. This is the one write-shaped endpoint on the public site
(`docs/ARCHITECTURE.md:389-410`, §4.3).

- **Method + path:** `POST /api/contact`
- **Auth / scope:** **none** (public form). Abuse-controlled by honeypot + rate limit (below).
- **Tenant scoping:** N/A (single-tenant). Endpoint is public by design.
- **Content-Type:** `application/json` **only** (R8 — the urlencoded / no-JS progressive-enhancement
  path is removed; no artifact defined the no-JS success/error render, so it was half-specified). Any
  other content-type ⇒ `400 BAD_REQUEST` (EC-8).

- **Request schema** (`ContactRequest`):

  | Field | Type | Required | Constraint (server-enforced — client mirrors, FR-32/33) | Example |
  |---|---|---|---|---|
  | `name` | string | **yes** | trimmed; length **1..120**; control chars stripped | `"Ava Chen"` |
  | `email` | string | **yes** | trimmed; **RFC 5322**-validated; length ≤254 | `"ava@studio.co"` |
  | `message` | string | **yes** | trimmed; length **1..5000** (cap enforced client **and** server; >5000 ⇒ `422 VALIDATION` field-level, R8/EC-8) | `"We're planning…"` |
  | `company` | string | no | length **≤120** (R9 — client + server) | `"Chen Developments"` |
  | `projectType` | string | no | length ≤80; free text or one of a defined set ⟨Q-3/Q-8⟩ | `"Residential CGI"` |
  | `consent` | boolean | **yes** | R2 — must be `true`; the "I agree to the privacy policy" checkbox (links `/privacy`). `false`/absent ⇒ `422 VALIDATION`. **No email sent, no row persisted.** | `true` |
  | `hp` | string | no | **honeypot — MUST be empty.** Hidden field; humans never fill it (FR-38, Q-4) | `""` |

  > **R2 — consent is required.** The submitter must tick the privacy-policy consent box; the server
  > re-checks `consent === true` before any email or DB write. See the `/privacy` Privacy Policy page
  > (PROJECT-BRIEF §9b R2) and the 180-day retention policy under Side effects.
  > **Q-3 open:** the exact field set / which are required is assumed from A-7 (`docs/SRS.md:467-468`).
  > **Q-8 open:** whether `projectType` is a controlled vocabulary (tied to the offering taxonomy).
  > Both escalated in §8 — not invented.

- **Validation (server re-validates even though client validated — never trust the client):**
  1. Parse JSON. Malformed / non-JSON content-type ⇒ `400 BAD_REQUEST`.
  2. Enforce required fields + formats + lengths above, **including `consent === true` (R2) and
     `message` ≤ 5000 chars (R8 — oversize is a field-level `422`, not a `413`)**. Any failure ⇒
     `422 VALIDATION` with a per-field map. **No email is sent; no row is persisted.**
  3. **Sanitize/escape** all fields before they enter the email body and the persisted row; the
     endpoint **never** renders or reflects submitted content unescaped anywhere (XSS guard,
     `docs/SRS.md:376-377`, EC-8).

- **Spam / abuse control (FR-38, R-5 — no visitor-solved CAPTCHA):**
  1. **Honeypot:** if `hp` is non-empty ⇒ respond `200 { ok: true }` **silently and send no email**
     (do not reveal the trap to the bot). This is a deliberate exception to "never lie success" — the
     caller is a bot; no legitimate submission is dropped.
  2. **Rate limit:** atomic per-source counter in the KV store (Vercel KV / Upstash,
     `docs/ARCHITECTURE.md:222,578-580`). Key = `hash(clientIp) + fixed window`. **This is the guard
     against the check-then-act race** (`AGENTS.md:296-297`) — the limit is enforced by an atomic
     `INCR`, not an application-code check.
     - **Limits (proposed — tune with Security/DevOps):** **5 submissions per 10-minute window per
       IP**, plus a soft **1 per 30 s** burst guard. Over limit ⇒ `429 RATE_LIMITED`, `retryAfter`
       seconds, `Retry-After` header set. No email sent for rejected requests (AC-30).
  - Client IP is derived from the platform's trusted forwarding header (Vercel) — never from a
    user-supplied header. `hash(clientIp)` is stored, **not raw PII** (`docs/ARCHITECTURE.md:103`).

- **2xx response** `200`:

  ```jsonc
  { "ok": true }        // success signal (AC-27, shown within ≤10 s); form clears/locks (FR-36)
  ```

- **4xx/5xx responses** (every code this endpoint can emit):

  | `code` | HTTP | Human message (safe, generic) | When it fires | Side effect |
  |---|---|---|---|---|
  | `BAD_REQUEST` | 400 | "We couldn't read your submission. Please try again." | malformed JSON / non-JSON content-type | none |
  | `VALIDATION` | 422 | (field-level; see below) | a required/format/length rule failed — **incl. `message` > 5000 (R8) and missing `consent` (R2)** | none — **no email, no row** |
  | `RATE_LIMITED` | 429 | "Too many messages. Please try again shortly." | over the per-IP window (AC-30) | none — **no email, no row** |
  | `MAIL_FAILED` | 502 | "We couldn't send your message. Please try again." | email transport failed (AC-29) | row **may** be persisted (see Side effects); **no success claimed** — form keeps input, allows retry (FR-37) |
  | (method) | 405 | — | non-POST verb | none; `Allow: POST` header |

  `VALIDATION` body:

  ```jsonc
  { "ok": false, "code": "VALIDATION",
    "fields": { "email": "Enter a valid email address.",
                "message": "Please shorten your message to 5000 characters or fewer.",
                "consent": "Please agree to the privacy policy to continue." } }
  ```

  `RATE_LIMITED` body: `{ "ok": false, "code": "RATE_LIMITED", "retryAfter": 420 }` (+ `Retry-After`).

  > **No tenant/internal leakage** (`AGENTS.md:230`): error messages are generic; they never echo
  > the submitted values and never expose the transport, inbox address, or a stack trace.

- **Pagination:** N/A (single resource create).
- **Idempotency:** **NOT idempotent** — a successful POST persists a `ContactSubmission` row and sends
  an email (real-world side effects). Why that is acceptable: (a) the client disables submit while in
  flight and prevents double-submit (FR-35 / AC-28); (b) the rate limit caps repeats; (c) the worst
  case of a retry is a **duplicate inquiry row + email**, never data corruption, money, or
  provisioning — so a strict idempotency key is not warranted for v1. **Optional hardening (flagged,
  not required):** a short dedupe on `hash(ip+email+message)` within a 60 s window to swallow
  accidental resubmits (suppresses both the duplicate row and the duplicate email).
- **Rate limit:** **yes** — per IP (above). This is the primary abuse control.
- **Side effects** (in this order — persist first so a mail-transport failure never loses the inquiry):
  1. **Submission persisted (R2).** The Next route handler writes one `ContactSubmission` row to
     Strapi via a **server-only, write-scoped Strapi API token** (`CONTACT_WRITE_TOKEN`, distinct from
     the read token; never in the client bundle). The browser still cannot write to Strapi — only the
     Next server can, with this token (this satisfies `docs/ARCHITECTURE.md:389-410`: anonymous writes
     stay closed). Fields written: `name`, `email`, `message`, `company?`, `projectType?`,
     `status` (enum `new|read|archived`, default `new`), `ipHash` (`hash(clientIp)` — **not** raw IP),
     `userAgent`, `createdAt`. **PII at rest** ⇒ governed by the consent gate (R2) and a **180-day
     auto-purge retention policy** (rows older than 180 days are deleted by a scheduled job — owner:
     DevOps/DB). The `/privacy` page discloses this.
  2. **Email sent** to the studio inbox (`STUDIO_INBOX`, **Q-6 open**) via the configured transport
     (Strapi email plugin **or** a Next route-handler transport — Resend/SES/SendGrid/SMTP;
     mechanism is a DevOps/Security choice, `docs/ARCHITECTURE.md:223,581-582`, D-4). Exactly one
     email per accepted submission. If the write (1) succeeds but transport fails ⇒ `502 MAIL_FAILED`;
     the row persists with `status:new` so the studio still sees the inquiry, and the visitor may retry.
  3. **KV counter incremented** (rate-limit window). Stores a hashed key + count, **no PII**.
- **Breaking change:** none (v1). Request-shape changes ship with the form (§0.4).

### 3.2 `POST /api/revalidate` — Strapi publish webhook sink

Serves the on-demand cache invalidation backbone (`docs/ARCHITECTURE.md:159-160,412-417`, §2.4).

- **Method + path:** `POST /api/revalidate`
- **Auth / scope:** **shared-secret HMAC** in `x-strapi-signature`, verified with a **timing-safe
  compare** (`docs/ARCHITECTURE.md:414-416`). Missing/invalid ⇒ `401`.
- **Tenant scoping:** N/A.
- **Request schema** (`RevalidateRequest` — Strapi webhook payload subset):

  | Field | Type | Required | Notes |
  |---|---|---|---|
  | `model` | string | yes | e.g. `"project"`, `"post"`, `"service"`, `"category"`, `"home"`, `"about"` |
  | `event` | string | yes | e.g. `"entry.publish"`, `"entry.unpublish"`, `"entry.update"`, `"entry.delete"` |
  | `entry` | object | no | `{ slug?: string, ... }` — slug used to build `project:<slug>` / `post:<slug>` tags |

- **2xx response** `200`: `{ "revalidated": ["projects", "project:loft-thirty-one", "home"] }`
  — the list of tags invalidated. Tag mapping per `docs/ARCHITECTURE.md:416`:
  Project→`['projects','project:<slug>','home']`; Post→`['journal','post:<slug>']`;
  Service→`['services','nav']`; Category→`['nav']`; Home→`['home']`; About→`['about']`.
- **4xx/5xx:**

  | HTTP | When |
  |---|---|
  | `400` | unrecognized `model`/`event`, or missing `slug` where the tag needs it |
  | `401` | bad/missing signature |
  | `405` | non-POST (`Allow: POST`) |

- **Pagination:** N/A.
- **Idempotency:** **idempotent** — `revalidateTag` twice marks a tag stale twice = a no-op;
  concurrent deliveries need no lock (`docs/ARCHITECTURE.md:164-167`). Safe to retry.
- **Rate limit:** none required (secret-gated, low volume, idempotent). A coarse cap is optional.
- **Side effects:** invalidates the named Next cache tags (content-freshness only — no data write, no
  email, no user-visible mutation). Bounds staleness to the ISR floor even if a webhook is missed.

### 3.3 `GET /api/preview` — Strapi Preview → Next.js Draft Mode

Serves the editor draft-preview path (`docs/ARCHITECTURE.md:172-182,419-421`, §2.5). Only editors
reach it (via a link in the Strapi admin).

- **Method + path:** `GET /api/preview`
- **Auth / scope:** **shared secret** query param, timing-safe compare. Invalid ⇒ `401`.
- **Request query:**

  | Param | Type | Required | Notes |
  |---|---|---|---|
  | `secret` | string | **yes** | must equal `PREVIEW_SECRET` (server env) |
  | `type` | string | yes | `"project"` \| `"post"` \| `"home"` \| `"about"` \| `"service"` |
  | `slug` | string | for collection types | drives the redirect target |
  | `status` | string | no | `"draft"` (default in preview) |

- **2xx / redirect:** `307`/`302` redirect to the target route (`/projects/<slug>`, `/journal/<slug>`,
  `/`, `/about`, …) after `draftMode().enable()`. In draft mode the read layer switches to
  `cache: 'no-store'` and requests `status=draft` with the token (`docs/ARCHITECTURE.md:178-180`).
- **4xx:** `401` (bad secret); `400` (missing `type`, or missing `slug` for a collection type).
- **Idempotency:** idempotent (sets the draft-mode cookie; repeat = same state).
- **Rate limit:** none (secret-gated, editor-only, low volume).
- **Side effects:** sets the Next.js Draft Mode cookie for the editor's session. **Never** touches
  the public CDN cache; the preview/read tokens are server-only (never shipped to the client,
  `docs/ARCHITECTURE.md:181-183`, `docs/ARCHITECTURE.md:512` — a leak is a P0).

### 3.4 `GET /api/exit-preview` — leave Draft Mode

- **Method + path:** `GET /api/exit-preview`. **Auth:** none needed (only disables the caller's own
  draft cookie). **Response:** redirect to `/` after `draftMode().disable()`. **Idempotent.**
  **Side effect:** clears the draft-mode cookie.

---

## 4. HERO RUNTIME MANIFEST (client asset contract — not an HTTP API)

The Home-1 hero fetches a static **manifest JSON** from the CDN, referenced by `Home.heroFrameManifestUrl` (R5)
(§2.4). It is a static asset contract, not a server endpoint (`docs/ARCHITECTURE.md:198-206,424-440`):

```ts
type FrameManifest = {
  frameCount: number;      // total frames
  urlPattern: string;      // e.g. "/hero/desktop/frame_{n:4}.webp"  ({n:4} ⇒ zero-padded index)
  width: number; height: number;   // intrinsic frame dimensions
  poster: string;          // LCP still URL (painted before frames decode)
  tiers?: { mobile?: Partial<FrameManifest> };   // fewer/smaller frames on mobile (§3.1 A-3)
};
```

- Fetched **once** by the client hero runtime (`useImageSequenceHero`), then frames are fetched as
  blobs and decoded off-thread. **Not** served through this contract's API and **not** through
  `next/image` (`docs/ARCHITECTURE.md:200-202`). Missing/404 manifest ⇒ hero degrades to the
  placeholder poster, no console error (FR-11 / AC-9).

---

## 5. CONTRACT-WIDE INVARIANTS (checklist against `AGENTS.md` §4 rules)

- ✅ **No bare top-level array.** Strapi envelopes every read as `{data, meta}`; Layer-B returns
  objects (`{ok:...}`, `{revalidated:[...]}`). Internal `T[]`/`Paginated<T>` unwraps are server-side
  only, never a wire shape.
- ✅ **No tenant-ID leak in errors.** Single-tenant; error bodies are generic and never echo
  submitted content or internals (§1.6, §3.1).
- ✅ **Every list endpoint paginated.** `/projects`, `/journal`, `/services`, `/categories`, slug
  harvests — all offset-paginated with declared defaults/maxes (§1.8).
- ✅ **Breaking changes require a version.** v1 baseline; drop/rename of a consumed field is breaking
  and follows §0.4 + the two-phase deploy (`docs/ARCHITECTURE.md:540-542`).
- ✅ **Explicit `populate`/`fields` on every read** — no `populate=*` on the hot path; N+1 avoided by
  one request per route (`docs/ARCHITECTURE.md:118-124`).
- ✅ **Published-only on public routes**; drafts require token + preview mode (FR-40 / EC-4).
- ✅ **Side effects, idempotency, rate limit stated per endpoint** (§2 header block for reads; §3 per
  handler).

---

## 6. ASSUMPTIONS

- **A-1** REST (not GraphQL) is fixed by `docs/ARCHITECTURE.md:104-116`; this contract does not
  re-open it. Carried, not assumed anew.
- **A-2** Single-tenant; read content is public + CDN-cached; no tenant scoping — carried from
  `docs/PROJECT-BRIEF.md:79`, `docs/SRS.md:59-63`, `docs/ARCHITECTURE.md:11-29`. The AGENTS.md
  tenant-scoping rule is deliberately overridden per §0 (already escalated by the Architect).
- **A-3** Strapi's **public role has read permissions disabled**; all Layer-A reads use a read-only
  API token server-side. This is a security recommendation consistent with `docs/ARCHITECTURE.md:98,181-183`
  (no write token to client) but the exact Strapi role config is a DevOps/Backend setup step — flagged.
- **A-4** Response **DTO field sets** (e.g. `excerpt`, `year`, `client`, `location`, `technique`,
  `summary`, `order`, `icon`) are marked `⟨DB⟩`; they are the shape the frontend needs, but the
  authoritative field types/nullability/constraints are **owned by the DB/Data Architect**
  (`docs/ARCHITECTURE.md:52-54,364-365`, FR-22). Not invented here — DB must confirm/adjust.
- **A-5** Rich-text `body` fields are typed `unknown` because the block/rich-text schema is a DB
  decision. The frontend renders via a shared block renderer once DB fixes the schema.
- **A-6** Pagination defaults/maxes (`/projects` 12/48, `/journal` 10/48) and the max clamp are a
  frontend UX choice; confirm with UI/UX. Style is offset (Strapi-native), cursor rejected (§1.8).
- **A-7** Journal newest-first by `publishedAt` — carried from `docs/SRS.md:462-463` (A-5).
- **A-8** Contact fields = Name, Email, Message, **`consent` (required, R2)** + optional Company,
  Project-type + honeypot — carried from A-7 (`docs/SRS.md:467-468`) plus the R2 consent gate. Field
  lengths: name ≤120, email ≤254, message ≤5000, **company ≤120 (R9)**, projectType ≤80 — enforced
  client **and** server. Oversize `message` is a field-level `422` (R8), not a `413`.
- **A-9** Contact rate limit = 5 / 10 min + 1 / 30 s per IP (proposed). Exact numbers are a
  Security/DevOps tuning decision (`docs/ARCHITECTURE.md:222`).
- **A-10** Email transport (Strapi plugin vs Next route-handler transport; provider) is a
  DevOps/Security decision (D-4); this contract only fixes the **request/response shape and the
  "exactly one email on success"** side effect.
- **A-11** The nav taxonomy is **derived** from Categories + Services, not a separate editable nav
  tree. **Ratified by R11** — the editable `Navigation` single type is removed; no `GET /api/navigation`.
- **A-12** "Pages" = the Home + About singletons (§0.5). No generic Pages collection exists in any
  source doc; not invented.
- **A-13** The Home hero fields use the **R5 canonical names**: `heroFrameManifestUrl` (scalar URL),
  `heroVideoUrl` (scalar URL), `heroPosterH1` (Media, Home 1 LCP), `heroPosterH2` (Media, Home 2 LCP —
  a **second, distinct** poster). `heroFrameManifestUrl`/`heroVideoUrl` are editorial **references** to
  CDN assets; whether `heroVideoUrl` is stored as a Strapi media field or a plain URL string is a
  DB/CMS modeling detail ⟨DB⟩ — the frontend needs a resolvable URL (+ mime for the video) either way.

## 7. OPEN QUESTIONS / ESCALATIONS (to Orchestrator/user — not resolved here)

- **Q-3 (contact fields):** confirm the exact contact field set and required flags (A-8). Affects
  the `ContactRequest` schema (§3.1).
- **Q-4 (spam mitigation):** confirm honeypot + rate-limit is the accepted mechanism, and the limit
  numbers (A-9). No visitor-solved CAPTCHA (R-5).
- **Q-6 (contact destination + auto-reply):** the `STUDIO_INBOX` address is unknown, and whether the
  submitter gets an auto-acknowledgement email is undecided. An auto-reply is a **new side effect**
  (second email) + a **new content requirement** — not built. (Submission **persistence** is no longer
  open — resolved by R2; see below.)
- **Q-8 (taxonomy values):** the Category (Projects) and Service offering slugs are undefined
  (`docs/SRS.md` Q-8). They drive `filters[category][slug][$eq]` (§2.1.1), the mega-menu (§2.7), and
  possibly `projectType` (§3.1). The contract is shaped for them; the values must be supplied.
- **`Global` single type (§2.7.1):** UNCONFIRMED. A footer/social/default-SEO singleton is flagged by
  the Architect (A-6) but not confirmed. Decide whether to add it; until then footer uses the fixed
  sitemap + wordmark and OG falls back to a static asset.
- **Submission persistence — RESOLVED (R2):** `/api/contact` now **persists** a `ContactSubmission`
  row (via the server-only `CONTACT_WRITE_TOKEN`) **and** emails the studio. Required consent checkbox
  + `/privacy` page + 180-day auto-purge retention. The `ContactSubmission` field set is owned by the
  DB/Data Architect; the retention job + `/privacy` copy are owned by DevOps/DB + Content. No longer an
  open question.
- **Generic "Pages" builder:** if the studio wants CMS-authored pages beyond the fixed 7-route
  sitemap (FR-1), that is a **new requirement** (new collection + dynamic routing) — escalated, not
  invented (§0.5).
- **Conflict carried forward (no silent reconciliation, `AGENTS.md:18`):** the single-tenant override
  of `AGENTS.md:216-218` tenant-scoping originates in `docs/ARCHITECTURE.md:11-29` §0 and remains
  **pending Orchestrator confirmation**. This contract builds on that resolution but does not
  independently ratify it.

---

**Completion note (`AGENTS.md:13`):** This is spec only; no code was written and nothing was
executed. I did **not** verify these endpoints against a running Strapi instance (none exists yet —
greenfield, `docs/ARCHITECTURE.md:37-39`). Query-string syntax follows Strapi v5 REST conventions but
must be validated against the actual content model once the DB/Data Architect fixes fields and the
Strapi project is stood up (`docs/ARCHITECTURE.md:528-529`). Every field marked `⟨DB⟩` or `⟨UI/UX⟩`
is a boundary I did not cross.
