# Feature & Extension Roadmap — Admin CMS as a Product

> Agent: researcher.features · Phase 1 · persisted by orchestrator. Scope: reusable
> agency product (Model A). Brand fixed. Grounded in code reads + pressure-testing
> docs/PRODUCT-PLAN.md & docs/ROADMAP.md (agreements/disagreements called out).

## 1. Current feature inventory (solid / thin / scaffolded / missing)

- **Content:** template pages (solid, but each hand-declared in TS — a 9th needs a dev); custom pages (solid); Projects/Gallery (solid but hardcoded model+schema+form per type); Posts+Categories (solid but flat, no tags/hierarchy); Messages (thin — read/unread + hard delete only).
- **Editing/Blocks:** 17 block types (solid); `BlockRenderer` renders BOTH public + admin canvas (solid, genuine strength); FieldSpec engine — 8 kinds (solid engine but **no select/enum, rich-text, relation, color, or date kind; video = YouTube-ID text only**); reorder = arrows only, no drag; **patterns/reusable blocks missing; inline canvas editing missing; autosave/draft-preview missing** (a draft literally 404s for the signed-in editor — `app/(site)/[slug]/page.tsx` filters `status:published`); **revisions/trash missing** (unconditional `db.delete` behind `window.confirm`; no soft-delete/history in schema).
- **Media:** upload solid security (magic-byte, 10MB), thin capability — flat grid caps at 300 rows, no pagination/folders/search/filter/bulk/alt-edit/usage-check; **no `sharp`/optimization**.
- **Plugins:** architecture solid (folder+manifest+registry line); only **3 slots** (`site.floating`, `site.beforeFooter`, `home.end`) — a plugin can't appear mid-page, contribute a block, add an admin screen, or run on a schedule.
- **Appearance:** Themes = UI shell only (hardcoded "Studiodota 1.0"; **no theme registry/type/dir; `appearance.activeTheme` read by nothing**); Menus solid one-level (mega-panels hardcoded).
- **Users:** auth solid for one operator; **roles/multi-user missing entirely** (`User` has no `role`; no add-user/invite/list screen).
- **Settings:** general only; **no SEO tab**.
- **Public outputs:** SSG + instant publish (solid); per-page SEO only on custom Pages, **not the 8 template pages**; **sitemap/robots/JSON-LD missing**; contact-form **email notification missing** (no email lib).

## 2. Competitive gap analysis

**Table-stakes we're missing** (client notices week one): draft preview, Trash+restore, revisions, autosave, image optimization, XML sitemap+robots, structured data/Schema, contact-form email notification, backups, uniform per-page SEO. (All WP-core or default-plugin baseline.)

**Differentiators we could own:** (1) admin canvas that can't drift from live (`BlockRenderer` renders both — WP's admin/theme paths chronically drift); (2) config-driven content types as the real CPT answer (Sanity/Payload validate the FieldSpec approach); (3) a plugin SDK that out-*develops* WP per-client rather than out-*catalogues* it; (4) no PHP attack surface (the entire Wordfence category fights PHP+plugin problems this stack doesn't have).

**Named, not chased:** Elementor-style visual building (contradicts our positioning); Webflow million-item collections (we never approach that scale); Ghost paid newsletters (wrong ICP); Sanity real-time multi-editor (single-editor ICP); ACF's 30+ field types (we need ~4 new kinds, not 30).

## 3. Feature roadmap (S=part-day · M=few days · L=week+)

**a) Blocks:** reusable blocks/synced patterns (M, High); form-builder block generalizing the one hardcoded `contactForm` (M–L, High); new elements — logo strip, pricing, team grid, **generic embed/iframe** (S each, embed=High — turns Calendly/Instagram/Maps into paste-a-URL); inline canvas editing (L, Med — sidebar flow isn't broken, polish).

**b) Plugins:** SDK extensions first — plugin-contributed admin pages (M, High) + block types (M, High) + cron hooks (M, Med, needs external cron). Plugins shippable on current SDK: booking/Calendly (S, High, ships today), announcement bar (S, Med), Instagram feed (M, best after block-SDK), newsletter (don't build proactively). FAQ-schema → build into `BlockRenderer` as core.

**c) Themes:** token-pack format + `themes/registry.ts` mirroring plugins (M, High — feasible without touching components since colors already flow through CSS vars); live preview (S once format exists, high wow); 2 proof packs (content, not code — look is a Phase 2 call).

**d) Content-type portability — the v1.5 core.** Today 3 separate models+schemas+forms; a 4th needs a migration — fails PRODUCT-PLAN §5's "without touching core" exit test. The reusable 90% exists (FieldSpec/FieldsRenderer/validateFields, proven 3×); missing 10% = generic storage+list-table+routing. **Path A (recommended):** one generic `Entry{id,typeId,slug,data:Json,published,sort}` (what `Page` already is, generalized) + a `ContentTypeConfig` like `BlockSpec` + ONE generic admin CRUD shell; trades native SQL-column filtering (fine at this ICP's row volumes — flag to architect). **Path B:** codegen a model per type (keeps columns, still needs a migration per type — fails the exit test). Effort L; real regression risk against Project/Post/Gallery. **Value High — the v1.5 unlock.**

**e) Client-experience & safety** (validates ROADMAP; all confirmed genuinely absent): draft preview (S — **sequence first**, remove the status gate); autosave+unsaved-guard (S–M); trash+restore (M); media pipeline — sharp + alt-edit + search/filter (M); revisions+rollback (L — **sequence last**, after §d, built once generically); messages workflow+CSV+**email notification** (S email/M workflow — confirmed "highest value per hour"); sitemap/robots/JSON-LD/canonical (S — closes SEO table-stakes in a day).

**f) Power features:** command palette (M, standalone, no scaffold exists); **roles Admin/Editor (M, Med-High — I'd rate ABOVE PRODUCT-PLAN's v2.0 placement**, since the ICP implies two logins/site and there's no add-user screen); activity log (M — after roles); **one-click manual backup download (M, High — zero backup mechanism exists today; under-weighted by its "power feature" label**); site-health widget (S–M, low value until backups exist).

## 4. Recommended sequence

- **Iteration 1 (~1–1.5 wk, v1.0):** draft preview → autosave → trash/restore (parallel) · media pipeline · messages workflow + **email notification** · sitemap/robots/JSON-LD · **+ addition: one-click manual backup download** · **+ addition: command palette** (cheap, standalone).
- **Iteration 2 (~2–3 wk, v1.5):** content-type portability (Path A) FIRST · migrate Project/Post/Gallery onto it (dogfood) · theme token-packs + 2 packs + live preview · plugin SDK (admin pages + contributed blocks) · **roles + the missing Users screen (earlier than PRODUCT-PLAN)** since the v1.5 exit test implies a non-owner login · revisions (built once on the generic shape).
- **Iteration 3 (demand-gated v2.0):** reusable blocks/patterns + form-builder · booking/announcement/Instagram plugins · activity log · nightly-backup cron + site-health · cron SDK + digest-email plugin.

**Dependencies:** revisions after content-types · activity log after roles · Instagram-grade plugins after block-SDK · theme live-preview after token-pack format.

## 5. Open issues for the human owner

1. What content types does the first real client need (Properties? Cases? Menu items?) — scopes §3d. No signed client in repo (flagged, not guessed).
2. Real second client + timeline? — determines whether v1.5 portability is worth investing in soon vs. more Studiodota polish.
3. Roles: is "client editor + agency owner" (two logins) a real near-term need, or does the agency keep the only login? — flips roles urgency.
4. Which plugins are one-off client features vs. monetized add-ons — packaging/pricing call.
5. Manual backup-download (this doc) vs. DevOps automated-nightly (ROADMAP §B) — one unified piece?
6. Second theme pack's actual look is a Phase 2 decision; only the mechanism is this phase's concern.
7. No `LICENSE` file exists — PRODUCT-PLAN defers licensing to v2.0, but confirm a proprietary notice before an actual client contract.

**Top 3 to ship first:** (1) draft preview (S — remove one status gate; closes the most embarrassing gap); (2) media pipeline (sharp + alt-edit; invisible until a phone-photo upload tanks page speed); (3) config-driven content-type portability (§3d — largest, but the one change that makes "sold to multiple clients" real; FieldSpec already does 90%).
