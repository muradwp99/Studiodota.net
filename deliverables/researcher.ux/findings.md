# Admin CMS — UX Research Findings

> Agent: researcher.ux · Phase 1 (feeds Phase 2 Design) · persisted by orchestrator.
> Scope: the admin CMS experience only. Sourced from the full admin source tree
> (routes/components/lib/plugins/schema) + repo docs, cited throughout.

## 1. What exists now

**IA / chrome** (`app/admin/(panel)/layout.tsx`): `AdminBar.tsx` (site link, "+ New", "Howdy" menu) + `AdminNav.tsx` (dark WP-style sidebar; submenus render only when parent is active). **Mobile** uses a separate hardcoded top-level-only pill nav — a distinct model, not a responsive collapse.

**Screens:** Dashboard (At a Glance / Quick Draft / Activity / Edit-the-site); Pages = **two systems under one entry** — custom Pages via `PageBuilder.tsx` (Gutenberg canvas, 17 block types) and template pages via `BlockEditor.tsx` (section-by-section forms, home = 14 sections); Posts (+ Categories manager); Projects; Gallery; Media (library + `MediaPicker` modal); Messages; Appearance (Themes/Customize/Menus); Plugins; Users→Profile; Settings→General.

**Genuinely STRONG (must-keep):**
1. **One FieldSpec engine** drives forms + server validation (`pageRegistry.ts`, `pageBlocks.ts`, `FieldsRenderer.tsx`, `validateFields.ts`) — admin UI and validation cannot drift. This is the foundation config-driven content types would formalize.
2. **WordPress-literal IA & voice**, executed consistently — the biggest trust decision for the ICP.
3. **Solid security defaults** (bcrypt, httpOnly/sameSite sessions, per-IP login limit, magic-byte upload sniff, reserved-slug protection, honeypot+zod contact).
4. **Minimal, safe plugin architecture** (folder + manifest + one registry line).
5. **Best-in-class destructive-action copy** in Media & Categories (states the real consequence) — a pattern to propagate.
6. **Consistent, accessible save feedback** via one shared `Notice` (`role=status`/`role=alert`).

## 2. UX friction audit (P0 loses work/trust · P1 missing WP parity · P2 polish)

**The 4 P0s — all converge on a missing safety net (§G):**
- **P0** No autosave and **no unsaved-changes guard** anywhere (`PageBuilder`/`BlockEditor`/`PostForm`/`ProjectForm`/`GalleryManager` hold edits in local state, persist only on explicit save; "← All Pages" is a plain link). Navigating away / tab close / session timeout silently discards edits.
- **P0** PageBuilder block **"✕ Remove" has no confirmation** (fires instantly) while page-level Delete two rows above *does* confirm.
- **P0** Template-page **`BlockEditor` sections are independent silently-saved islands** — home stacks 14, each with its own Save; nothing tracks "N sections have unsaved edits," so editing several and saving one loses the rest.
- **P0** Template-page **"Save section" = instant publish** (`actions/blocks.ts` upsert → `revalidatePath` immediately). Only custom Pages have draft/published; the homepage + 7 template pages have no staging step.

**Sidebar/IA:** P1 Settings and Appearance→Customize edit the **identical `site` block** from two destinations. P1 **Mobile nav dead ends** — Appearance always lands on Themes with no link onward, so Customize/Menus (and Posts→Categories) are unreachable below `md`. P2 no admin search/command palette.

**Block editor:** P1 canvas is **not truly WYSIWYG** (preview is `pointer-events-none`; editing is sidebar-only) — name the trade-off. P1 reorder is adjacent-swap only (1→10 = 9 clicks), no drag. P2 no keyboard shortcuts; P2 SEO fields have no character-count/snippet preview.

**Forms:** P1 **no field-level errors** (`FieldsRenderer` has no error UI; all issues collapse to one banner — on a 6-item list, "which Title?"). P1 concrete copy bug: doubled slug message `"slug: Slug: lowercase…"` (`collections.ts`, `pages.ts`). P1 **`FieldSpec.help` is typed but never rendered** — forcing guidance into labels. P1 **three reorder patterns** for one action (↑/↓ buttons vs. a raw numeric "Order" field in Project/Gallery). P2 slug auto-derive on new Post/Page but not new Project. P2 lists silently cap at 48 with no UI cue.

**Media:** P1 **no search/filter/sort** anywhere media appears (library or picker). P1 **no multi/drag-drop upload** (bare single `<input type=file>`). P1 **alt text auto-set once from filename, never editable**. P1 **no usage check before delete** (honest warning, but no way to see what breaks). P2 fetched `size`/`mime` never shown; P2 no resize/optimization; P2 no self-serve `.mp4` upload (YouTube ID only).

**States:** P1 **zero `loading.tsx`/`error.tsx`/`not-found.tsx` under `app/admin/**`**. P1 **Projects/Gallery/Media/Messages list queries lack `.catch`** — a DB hiccup shows Next's default unstyled error page (and the dev DB is documented as fragile). Strength: existing empty-state copy is good.

**Mobile:** P1 PageBuilder settings panel lands below the entire canvas on small screens. P1 the mobile IA dead ends (above). P2 28×28px toolbar targets on the irreversible-action row.

**§G Safety-net synthesis (schema-confirmed):** no `deletedAt`, no revision/history table on any model. A mouse-slip permanently discards content; every template save is instantly live; a wrongly deleted row is unrecoverable without a DB restore.

## 3. Competitor teardown (specific learns for this ICP)

- **WordPress+Gutenberg:** autosave + one-click-restorable revision on every save (the load-bearing trust mechanism we lack); Trash-with-restore by default. We beat it on a flat, purpose-named 17-block list (less overwhelming) and a curated plugin registry (no security lottery).
- **Webflow Editor (2026 Edit Mode):** a content-editor role structurally barred from layout — **we already achieve this by construction** (typed fields only); state it as a strength. True in-canvas text editing is what our sidebar loop trades away.
- **Framer CMS 3.0:** spreadsheet/table view + bulk actions + search + frictionless "add row" — directly fixes our Projects/Gallery/Posts (no bulk view, silent 48-cap). We beat it on strict content/presentation separation.
- **Ghost:** one-click shareable **preview URL before publish** + simple post history/restore — exactly our template-page gap. We beat it on page-building vocabulary (17 blocks vs. post-shaped pages).
- **Sanity:** nested "where am I" panes + a dedicated Presentation/preview tool. We beat it on being pre-shaped & WP-styled out of the box (a dev tool by default vs. our product wedge).
- **Squarespace:** onboarding-questions → pre-populated site (the model for our installer wizard) + true drag-drop = sub-30-min learning. We beat it on bespoke identity (the whole reason clients don't just use Squarespace).

## 4. ICP & pain-point map

**End-client editor** — JTBD: keep site current, answer enquiries, occasionally build a page, and *never fear breaking the site*. Trust: WP-familiar chrome, specific save confirmation, best delete warnings, plain-English block names. "Call the agency" triggers (all map to §2): an edit vanishes after navigating away; a click deletes with no undo; a typo goes instantly live; a deleted photo breaks something unseen; categories/second-login aren't self-serve; an error reads like a bug report.

**Agency owner** — JTBD: stand up a client fast, reconfigure content types/branding per client (today code-level), install plugins without touching core, hand off confidently, diagnose remote breakage. Erosion: no content-type config layer yet; no activity/audit log to diagnose; no multi-user/invite (ties to single-admin bus-factor risk).

## 5. Prioritized recommendations

**Quick wins:** (1) global unsaved-changes guard — every editor already has a dirty signal; (2) confirm on PageBuilder "✕" + FieldsRenderer "Remove"; (3) normalize delete copy to the Media/Categories consequence-stating pattern; (4) render `FieldSpec.help`; (5) unify reorder to ↑/↓ everywhere (drop raw "Order" fields); (6) add Posts' search/filter to Projects/Gallery/Media; (7) editable alt-text in Media (`alt` column already exists).

**Bigger bets:** (8) **staging/preview step for template-page saves** (highest trust impact); (9) minimal single-snapshot "last saved version" per Block/Page/Post/Project; (10) soft-delete (Trash+restore) across all 7 hard-delete sites at once; (11) field-level errors + scroll-to-first-error; (12) bundle multi/drag-drop upload + resize + "used-in" check (all touch `media.ts`); (13) resolve Settings↔Customize duplication; (14) full mobile nav hierarchy; (15) `loading.tsx`/`error.tsx` + close `.catch` gaps.

## 6. Open issues for the human owner

- **Fabricated trust content (ROADMAP G1), exact locations:** clients marquee + invented named testimonials in `web/src/content/defaults.ts` (~L166-185) — editable in admin (flagged, not replaced).
- **New finding — a fabricated rating the CMS cannot reach:** a hardcoded **"4.9/5 ★★★★★"** in `web/src/components/home/Sections.tsx` (`rating` prop, ~L238/249) is NOT in any field spec — so despite "every page editable at /admin," a client cannot find/remove it. Needs an owner/dev decision.
- **Secrets:** `handoff.md` states the admin password in plaintext in the repo (ROADMAP G3) — relevant to any "share your login" design proposal.
- **Settings vs Appearance→Customize** edit the same block — a naming/ownership call.
- **Project image model caps at two images**, no gallery array (schema) — data-model decision.
- **Project category is a hardcoded 4-value enum** with no taxonomy manager (unlike Posts) — extend?
- **No second-admin/invite flow** exists — single-admin bus factor.

**Headline:** the admin's safety net is entirely absent (no autosave/guard, no draft-preview for template edits, no Trash, no revisions) — 4 P0s converging on one theme that will read as broken trust to a WP-trained client the first time it bites.
