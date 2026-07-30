# Studiodota.net — Remaining Work Plan

Written 2026-07-24, last updated 2026-07-30. This is a forward-looking
execution plan, not a session log.

## Current state

- `origin/master` = `ca894c4`. Everything below "shipped" is live on master.
- **Live in production on Hostinger**: `https://studiodota.net`, deployed via
  hPanel's Node.js app (Business/Cloud hosting, GitHub-connected — redeploy
  by triggering it again in hPanel, it pulls from `muradwp99/Studiodota.net`).
  Real MySQL database (`u781705420_dota` on `srv1859.hstgr.io`), schema
  pushed, fully seeded, confirmed working end-to-end (Journal posts render,
  project SEO renders, admin login works).
- Also deployed to Vercel (`https://studiodota.vercel.app`) earlier in the
  session, but that one has **no production database connected** (zero env
  vars in Vercel's dashboard) — it runs in a degraded fallback mode. Hostinger
  is the real, working deployment; Vercel is effectively stale/parked unless
  someone wants to finish wiring a database there too.
- `npx tsc --noEmit` clean, project-wide `npx eslint .` clean (down to the
  same small pre-existing baseline noted below), `npm run build` clean.
- Two build-only gotchas fixed along the way, worth knowing if a future
  deploy fails mysteriously: (1) `@tailwindcss/postcss`/`typescript`/`@types/*`/
  `prisma` had to move from `devDependencies` to `dependencies` — Hostinger's
  (and potentially other platforms') production install skips devDependencies,
  but Next's build itself needs these. (2) `vitest.config.ts` and all
  `**/*.test.ts` files under `src/` are excluded from the app's `tsconfig.json`
  — they import from `vitest`, intentionally still a devDependency.

## Admin↔frontend wiring audit (2026-07-30)

Systematically compared every content field that renders on the public site
against what the admin's form system actually exposes for editing — all 13
home.* blocks, all 8 page.* blocks, site-wide blocks, Projects, Posts, and
every other admin section (Settings/Users/Redirects/Appearance/Menus/Plugins).

**Two real bugs found and fixed** (both verified end-to-end through the real
admin UI + a direct DB query afterward, not just type-checked):

1. `home.faq`'s `description`/`supportLabel`/`supportBody`/`supportCta`
   (added earlier this session) were never registered in `pageRegistry.ts`.
   Worse than just "not editable" — the save action drops any unregistered
   key and replaces the whole block, so the next Save Draft/Publish on FAQ
   would have **silently and permanently wiped those 4 fields** back to the
   hardcoded defaults, with no error. Fixed and verified.
2. `writeCategories()` (add/rename/delete post category) wrote a bare
   `{ postCategories }` into the shared `taxonomies` block, silently
   discarding `projectCategories`/`galleryCategories` on every save. Fixed
   to merge instead of replace. Verified by adding a category from a fresh
   (no DB row yet) state and confirming both other lists survived.

Also fixed: `home.about`'s stats list was missing `addable: true` — could
delete stat cards down to zero but not add a 5th without deleting all
existing ones first.

**Everything else checked out clean** — the other 12 home.* blocks, all 8
page.* blocks (SEO panel confirmed present on all of them), and the
Project/Post edit forms (every Prisma column covered, SEO panel present with
full context on both) all have complete, correct admin coverage.

**Known gaps, not bugs, build on request:**
- No admin UI exists to add/rename/delete **project or gallery categories**
  (only post categories have one, at `/admin/posts/categories`) — this was
  already on the optional-backlog list below; the audit just confirmed
  exactly what's missing and fixed the data-loss risk hiding under it.
- The SEO panel on page.* blocks (Services/Projects/Gallery/etc.) gets less
  context than the one on Projects/Posts — missing `slug`/`path`/`content`,
  so the Google preview shows no path and the keyword-in-content/keyword-
  density checks are silently skipped. Data still saves correctly; the score
  is just weaker than it could be.
- SMTP credentials are server-env-only by design, no admin field (expected).
- Redirects' "convert 404 to redirect" only pre-fills the "From" field, not
  fully one-click as a code comment implies — cosmetic.
- Admin can change another user's role or remove them, but not edit their
  name/email or force-reset their password — possibly intentional, stood out
  during the audit.

## What shipped this round

- **Homepage redesign**: About/"Who We Are" section rebuilt (the old inline-
  image-in-heading technique crowded two photos together by construction;
  replaced with a clean heading + a bronze-gradient stats band anchored by a
  Three.js glossy gem). Testimonials rebuilt as a ruled-grid layout with real
  stock portraits (replacing abstract avatar placeholders) and a fixed
  portrait-crop bug. FAQ rebuilt with a gold-gradient system, new SVG icons,
  and a "Need more help" row.
- **Site-wide dash cleanup**: every em-dash/en-dash replaced with a plain
  hyphen across `defaults.ts`, the live DB, and ~20 hardcoded UI strings.
- **SEO content populated**: real focus-keyword/title/description written
  for all 16 published projects, all 6 posts, and all 7 built-in pages
  (Who We Are excluded per the client's request) — the RankMath-style panel
  existed but had never actually been filled in. Every entry verified
  against the real scoring function, not eyeballed.
- **Build fix**: `package.json`'s build script now runs `prisma generate`
  before `next build` — Vercel was restoring a cached `node_modules` with a
  stale Prisma Client (missing the `seo` column), which broke the production
  build. Also excluded `scripts/` from the TypeScript project so a one-off
  maintenance script can't break the app build again.

## Vercel deployment — now live, but not fully working yet

The site builds and loads with no errors, but `vercel env ls production`
shows **zero environment variables configured** — there is no production
`DATABASE_URL` at all. The app degrades gracefully instead of crashing, which
makes this easy to miss: confirmed on the live site right now —

- Homepage/Services/Gallery/Contact/Terms/Privacy look normal (they fall back
  to hardcoded `defaults.ts` content when the DB is unreachable).
- Projects show basic info from that same fallback, but are missing all the
  SEO work above (project-level SEO is DB-only, no fallback).
- **Journal is completely empty** ("No articles published yet") — posts have
  no fallback path at all.
- Admin login almost certainly doesn't work — no database to check
  credentials against.

**This is the top-priority remaining item.** Needs: a real, internet-
reachable production MySQL (the local dev instance on `127.0.0.1:3307` can
never work here) with its connection string added as `DATABASE_URL` in
Vercel's project settings, then a redeploy.

Two smaller, related gaps:
- **No auto-deploy on push.** No GitHub↔Vercel integration installed, so
  every future change needs a manual `vercel --prod` from a machine with CLI
  access. Connecting the repo in Vercel's dashboard (Settings → Git) would
  fix this.
- **Media uploads write to local disk** (`lib/actions/media.ts` →
  `public/uploads/...` via `fs/promises`). Vercel's serverless filesystem is
  read-only outside `/tmp`, so uploads will silently fail once a real
  database makes the admin usable. Needs an object-storage backend (Vercel
  Blob, S3, etc.) before that becomes usable in production.

## Phase 1 — content the client must still supply (unchanged, not a dev task)

| Item | Where to fix | Current placeholder |
|---|---|---|
| Studio phone + address | Settings → General | `+1 (310) 555-0148` / `1420 Sepulveda Blvd, Suite 310, Los Angeles, CA 90025` |
| Project years | Projects → each project | Random 2021–2025 (weighted toward founding year) — correctable per-project with revert-to-previous-version |
| Testimonial names/quotes | Pages → Homepage → Testimonials | Fictional names/quotes; portraits are now real stock photos (placeholder people, not the actual clients) |
| Client logo wall | Pages → Homepage → Clients | Generic big-name placeholders |
| 13 draft projects | Projects (unpublished) | Waiting on real renders |
| SMTP credentials | Server env | Unset — enquiries still save to Messages + CSV export |
| Social links | Settings → General | All `#` placeholders |

## What's left (genuinely optional now — build on request only)

- Per-content-type SEO title templates; breadcrumb schema (FAQ schema is a
  reasonable add now that the FAQ section has real content).
- Redirect/404 analytics beyond hit-count (e.g. referrer tracking).
- Deeper roles (more than admin/editor) if the client ever needs them.
- A dedicated Project/Gallery "Categories" management page (the taxonomies
  are editable via the block system today, just no bespoke UI like Posts has).

## Small housekeeping, never actioned

- `src/content/site.ts` — confirmed dead code (zero importers, leftover from
  an unrelated template this repo was bootstrapped from). Flagged twice now,
  still not deleted.
- `src/components/hero/VideoHero.tsx` — also confirmed dead code (leftover
  from the removed `/home-2` route, zero importers).
- Pre-existing lint errors in `VideoPlayer.tsx` (2, react-hooks/set-state-in-
  effect) and `InlineText.tsx` (1, react-hooks/refs) — real but pre-existing,
  never touched by any session's actual task scope.
