# Studiodota.net — Remaining Work Plan

Written 2026-07-24. This is a forward-looking execution plan, not a session log
(that's `handoff.md`). Read this to know what's left and in what order.

## Current state

- **`origin/master`** = `03ac7eb` (PR #1 merged: largo redesign, real Studio Dot A
  portfolio, CMS controls, RankMath-style SEO, cookie consent, redirects).
- **`feature/admin-v1-client-ready`** is **1 commit ahead**: `e56aa84` (Showreel
  stacks vertically on mobile). **→ Land this in master first** (see Phase 0).
- Site is client-presentable now. Everything below is additive.

## Phase 0 — Housekeeping (do first, ~5 min)

1. Merge/PR `e56aa84` (showreel mobile fix) into `master`.
2. Delete the now-fully-merged remote branch if the client doesn't need it kept
   around for review, or leave it — harmless either way.

## Phase 1 — Content the client must supply (not a dev task, but blocks "real launch")

Placeholder values were filled with **plausible random data** on 2026-07-24 so the
site never shows broken/foreign-country info; all editable from the admin, no code
changes needed to update:

| Item | Where to fix | Current placeholder |
|---|---|---|
| Studio phone + address | Settings → General | `+1 (310) 555-0148` / `1420 Sepulveda Blvd, Suite 310, Los Angeles, CA 90025` |
| Project years | Projects → each project | Random 2021–2025 (weighted toward founding year) |
| Testimonial names/quotes/portraits | Pages → Homepage → Testimonials | Fictional (Maya Chen etc.); portraits are abstract SVG busts, not photos |
| Client logo wall | Pages → Homepage → Clients | Generic big-name placeholders (Amazon, Disney, …) — swap for real clients or remove |
| 13 draft projects | Projects (unpublished) | Waiting on real renders before publishing |
| SMTP credentials | Server env (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`) | Unset — enquiry emails won't send yet (enquiries still save to Messages + CSV export works regardless) |
| Social links | Settings → General | All `#` placeholders |

## Phase 2 — High-value admin features (worth building)

1. **Draft / preview + revisions** — biggest win. `snapshot`/`draft` JSON columns
   already exist on `Block`/`Page`/`Project`/`Post`/`GalleryItem` but nothing
   writes to them; edits go live immediately with no preview/undo.
   - Add "Save draft" vs "Publish" to `BlockEditor`/`ProjectForm`/`PostForm`.
   - A shareable `?preview=token` route for draft pages before they're public.
   - "Revert to previous version" using the existing `snapshot`/`snapshotAt`.
2. **Breadcrumbs** — trail UI on project/post/inner pages + `BreadcrumbList`
   JSON-LD (SEO win, pairs naturally with the RankMath-style SEO panel already
   shipped).

## Phase 3 — CMS niceties (build if the client asks, otherwise skip — YAGNI)

- **Multi-user + roles** — currently single admin, no add-user/permissions.
- **Drag-reorder for Projects/Gallery** — numeric "Order" field works today;
  drag infra already exists in the page builder if this gets requested.
- **Nested / mega-menu builder** — menus are flat `{label, href}`; mega panels
  auto-build from Services/Gallery/Projects content rather than being
  structurally editable. Only worth it if the client wants a 4th mega item or
  sub-menus.
- **Editable Project/Gallery categories** — fixed code enums today (Post
  categories already are client-editable, so this would just match that pattern).
- **Redirect hit-count / 404 monitor** — the redirect manager works; no
  analytics on what's actually 404ing.

## Phase 4 — Frontend extras (all optional)

- **Terms & Conditions page** — footer link currently points at `/privacy`.
- **Journal search/pagination** — has category filter; shows everything else.
- **Site search** + `WebSite`/sitelinks-searchbox schema.
- Two pre-existing lint warnings (Navbar theme-init `set-state-in-effect`,
  HeroScrub `useEffect` deps) — cosmetic, left alone deliberately so far.

## Recommendation

Ship Phase 0 now. Phase 1 is the client's job (or hand them the table above
verbatim). Of Phase 2, **draft/preview+revisions** is the only item I'd build
proactively — it's the one real gap in an otherwise complete CMS. Phases 3–4
are genuinely optional; build on request, not speculatively.
