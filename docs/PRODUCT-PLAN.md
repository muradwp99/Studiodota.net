# Product Plan — turning the CMS into a sellable product

> Status date: 2026-07-19. Context: the custom WP-style CMS built for Studiodota.net
> (Next.js 16 + MySQL/Prisma, block editor, plugins, menus, WP-anatomy admin) is to be
> productized and sold to multiple clients. Studiodota is customer #1 and the living demo.

## 1. Vision & positioning

**Product:** a WordPress-familiar admin on a modern stack (Next.js + MySQL), paired with
bespoke premium themes, delivered per client.

**Who buys:** small firms with a design-led brand (architects, interior designers,
studios, boutiques) whose staff know WordPress but whose brands deserve better than a
template.

**Why we win:** (1) admins feel like WordPress on day one — zero retraining;
(2) bespoke theme quality at template speed (Claude Code authors themes/plugins);
(3) modern performance/security baseline WP installs rarely reach.

**What we do NOT claim:** a general-purpose website builder competing head-on with
WordPress.com/Webflow/Framer. The wedge is productized agency delivery.

## 2. Business model path

- **Model A — Agency Product (NOW):** one deployment per client (their DB, their theme).
  Revenue: setup fee + monthly care plan (hosting, updates, backups, support) + premium
  plugins. Lowest lift; validates demand.
- **Model B — Hosted SaaS (LATER, demand-gated):** multi-tenant platform. Requires
  tenancy on every query/cache/file path, billing, domain automation, isolation. Do not
  start until ≥5 care-plan clients ask for it.
- **Model C — Open-core (OPTIONAL endgame):** open-source engine, monetize hosting +
  premium plugins/themes + support. One-way door; decide deliberately.

License now: proprietary. Revisit at v2.0.

## 3. Productization backbone (engineering)

1. **Engine / Theme / Content separation** — monorepo: `packages/cms-core` (admin,
   auth, blocks engine, plugin system, media, messages), `themes/<client>` (tokens,
   templates, block styles), `sites/<client>` (config + content DB). Core updates flow
   to all clients without touching themes.
2. **Config-driven content types (CPT equivalent)** — `site.config.ts` declares content
   types (fields via the existing FieldSpec engine), and the admin sidebar, list tables,
   forms, and public routes generate from it. Studiodota's Project/Gallery become config,
   not code.
3. **Theme packs** — design tokens + font choices + block render variants per client;
   Appearance → Themes switches packs with live preview.
4. **Installer** — `npx create-<brand>` wizard: client name, brand tokens, content
   types, admin credentials → scaffolded site with demo content in minutes.
5. **White-label admin** — client logo on login + sidebar, "Powered by <product>"
   footer, optional custom admin path.
6. **Update channel** — versioned core package + per-site `npm update` path; changelog
   surfaced in the admin dashboard.
7. **Docs as product** — (a) end-client user guide (in-admin help + printable),
   (b) developer guide: theme anatomy, plugin SDK, "author a plugin with Claude Code"
   recipe.
8. **Per-client ops kit** — env templates, backup scripts, health endpoint, restore
   runbook (exists in handoff; formalize per site).

## 4. Client-experience layer ("amazing" defined)

**First run:** guided tour tooltips; demo content pre-loaded (never blank screens);
Dashboard "Launch checklist" widget (logo, contact details, first page, menu, plugin).

**Safety net:** autosave + unsaved-changes guard; draft preview; Trash + restore;
revisions with one-click rollback. (Promoted from bug-list to product features.)

**Editing joy:** inline text editing on canvas; block patterns (pre-designed section
combos); reusable blocks; ⌘K command palette; keyboard shortcuts.

**Communication:** enquiry email notifications + weekly digest (leads, views once
analytics lands); in-admin help beacon.

**Trust:** activity log; one-click backup download; site-health widget (DB, disk,
last backup, version).

## 5. Release plan

### v1.0 — "Client-Ready" (~1–1.5 weeks)
Safety net (autosave, preview, trash, revisions) · media pipeline (sharp resize/WebP,
drag-drop multi-upload, search/filter, alt editing, usage warnings) · menus drag-order ·
per-page SEO for template pages · messages workflow (statuses, notes, CSV) · enquiry
email notifications · admin pinned color scheme · bulk actions on posts.
**Exit test:** the architect client uses the admin for a week with zero confused questions.

### v1.5 — "Product" (~2–3 weeks)
Backbone items 1–8 above (extraction, config CPTs, theme packs, installer, white-label,
update channel, docs, licensing) · onboarding tour + demo-content seeds ·
launch-checklist widget.
**Exit test:** a second, unrelated client site stood up in under one day without
touching core code.

### v2.0 — "Ecosystem" (demand-driven)
Plugin/theme catalogue (curated, not open marketplace at first) · multi-user roles
(Admin/Editor) + activity log · inline editing + patterns polish · analytics dashboard
widget · optional hosted multi-tenant tier (Model B) when justified · evaluate
open-core (Model C).

## 6. Plugin/theme SDK (the ecosystem seed)

- Formalize the existing contract: manifest (id, version, FieldSpec settings, slots)
  + registry line. Add: per-plugin admin pages, custom blocks contributed by plugins,
  scheduled hooks (cron), upgrade/migration hooks.
- First-party plugin line-up (each also a sellable add-on): WhatsApp chat (exists),
  booking/Calendly, Instagram feed, newsletter (Resend/Mailchimp), announcement bar,
  FAQ-schema SEO, gallery pro (lightbox/filters), multilingual (later).
- Theme SDK: token pack + block style overrides + template slots; two internal packs
  (Studiodota light, a dark serif variant) prove the interface.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Competing with WordPress/Webflow head-on | Position as productized agency delivery, not a builder |
| Core/theme extraction breaks Studiodota | Studiodota is the regression suite; extract behind green builds |
| 10 clients = 10 divergent codebases | Update channel (backbone #6) is non-negotiable before client #2 |
| Single-developer bus factor | Docs (#7) + installer (#4) reduce tribal knowledge |
| Premature SaaS build | Model B is demand-gated (≥5 care-plan clients) |
| Open-sourcing too early | Model C is a one-way door; defer to v2.0 review |

## 8. Immediate next actions

1. Ship v1.0 scope on Studiodota (safety net first: autosave, preview, trash).
2. Name the product; reserve domain/npm scope (needed for installer + white-label).
3. Draft the care-plan offer (pricing page copy) while v1.0 lands.
4. Start the end-client user guide as screens stabilize.
