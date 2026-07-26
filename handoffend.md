# Studiodota.net — Remaining Work Plan

Written 2026-07-24, updated 2026-07-26 (Phases 0/2/3/4 shipped via 6 parallel
subagents + manual integration). This is a forward-looking execution plan,
not a session log (that's `handoff.md`).

## Current state

- `origin/master` = `03ac7eb` (PR #1: largo redesign, real portfolio, CMS,
  SEO, cookie consent, redirects).
- `feature/admin-v1-client-ready` is now well ahead of master — the showreel
  mobile fix, placeholder-data fill, and ALL of Phases 2–4 below. Not yet
  merged to master; say the word.
- Everything shipped this round: `npx tsc --noEmit` clean, project-wide
  `npx eslint .` clean (down from the pre-existing baseline — see below),
  full `npm run build` clean with the correct static/dynamic split restored.

## What shipped this round (Phases 2–4, via 6 parallel subagents)

1. **Draft/publish/revert for Blocks** (homepage sections + all built-in
   pages) — Save Draft vs Publish, a field-level diff preview, revert to the
   last published version.
2. **Revision revert + drag-reorder + editable categories** for
   Projects/Posts/Gallery — single-level undo everywhere, real drag-to-reorder
   admin lists, Project/Gallery categories now client-editable (Post
   categories already were).
3. **Multi-user roles** (admin/editor) — owner-gated Users/Settings/
   Appearance/Plugins/Redirects; content editing shared by both roles.
4. **Nested mega-menu** — any primary nav item can carry simple sub-links,
   editable via the existing generic form engine (no new UI code needed).
5. **Redirect hit-count + 404 monitor** — Settings → Redirects now shows hit
   counts per redirect and a "Recent 404s" panel with one-click "Add
   redirect →".
6. **Terms & Conditions page, Journal pagination, site search** (`/search`
   + `WebSite`/`SearchAction` JSON-LD), plus two pre-existing lint fixes.

## A real regression caught during integration (worth knowing)

The 404-monitor agent's `not-found.tsx` read `headers()` directly in the body
of Next's *shared global* not-found boundary. Since every route can fall back
to that one boundary, calling a Dynamic API there forced **the entire site**
to render on every request instead of statically — confirmed by isolating
the call (every public page flipped `○`→`ƒ` and back with it removed).
Fixed by decoupling the miss-logging from rendering entirely: `not-found.tsx`
is now a plain static component; a client-side `NotFoundLogger` reads
`window.location.pathname` on mount and calls a server action. `proxy.ts` no
longer needs to stamp a request header for this. Static generation is fully
restored (`/`, `/about`, `/services`, `/privacy`, `/terms`, `/contact`,
`/gallery`, `/journal` all back to `○`).

Also hardened both JSON-LD `dangerouslySetInnerHTML` sites (Organization +
WebSite schemas — both render admin-edited CMS strings) against a value
containing `</script>` breaking out of the tag. And deleted `Hero3D.tsx`/
`HomeHero.tsx`, a fully dead, pre-existing, unreferenced 3D-hero chain that
was the only other source of whole-project lint errors.

## Phase 1 — content the client must still supply (unchanged, not a dev task)

| Item | Where to fix | Current placeholder |
|---|---|---|
| Studio phone + address | Settings → General | `+1 (310) 555-0148` / `1420 Sepulveda Blvd, Suite 310, Los Angeles, CA 90025` |
| Project years | Projects → each project | Random 2021–2025 (weighted toward founding year) — now correctable per-project with revert-to-previous-version if needed |
| Testimonial names/quotes/portraits | Pages → Homepage → Testimonials | Fictional; portraits are abstract SVG busts |
| Client logo wall | Pages → Homepage → Clients | Generic big-name placeholders |
| 13 draft projects | Projects (unpublished) | Waiting on real renders |
| SMTP credentials | Server env | Unset — enquiries still save to Messages + CSV export |
| Social links | Settings → General | All `#` placeholders |

## What's left (genuinely optional now — build on request only)

- Per-content-type SEO title templates; breadcrumb/FAQ schema.
- Redirect/404 analytics beyond hit-count (e.g. referrer tracking).
- Deeper roles (more than admin/editor) if the client ever needs them.
- A dedicated Project/Gallery "Categories" management page (the taxonomies
  are editable via the block system today, just no bespoke UI like Posts has).

## Housekeeping

Feature branch is not yet merged to master this round — everything above is
verified but sitting on `feature/admin-v1-client-ready`, ready for a PR.
