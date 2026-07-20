# Studiodota.net — Session Handoff

> Read this first to continue work in a fresh session. Full detail also in
> `docs/PROJECT-BRIEF.md` and `docs/BUILD-NOTES.md`. Memory: `MEMORY.md` +
> `studiodota-project.md` (auto-loaded).

## Session update — 2026-07-20 (LATEST: A2.2 controls + drag-to-insert + full-screen chrome fix)

**Branch `feature/admin-v1-client-ready`. 9 new commits `b5c1f19..9c2d0a5`, NOT pushed / NOT merged (kept branch as-is). `npx tsc --noEmit` clean; 78 Vitest tests pass (6 files).** Subagent-driven build of a 3-part editor slice the client asked for (topbar overlap fix + "drag and drop not worked" + "more advanced controlling/styling"). Followed brainstorm→spec→plan→subagent-build with per-task reviews + a final whole-branch review.
- **Spec:** `docs/superpowers/specs/2026-07-20-live-editor-a2.2-controls-drag-insert-chrome-design.md`
- **Plan:** `docs/superpowers/plans/2026-07-20-live-editor-a2.2-controls-drag-insert-chrome.md`
- **Ledger (git-ignored):** `.superpowers/sdd/progress.md` — full task-by-task record + all Minor findings.

### What shipped (3 parts)
1. **Full-screen chrome fix** (`b5c1f19`): `PageBuilder.tsx` root `z-50`→`z-[100]` so the editor covers the admin bar (`AdminBar` is `z-[90]`, dropdowns `z-[95]`). Fixes the client screenshot where "Howdy, …" overlapped the editor header.
2. **Drag-and-drop** (`0f19223`,`357d1d4`,`25dc343`): new pure **`web/src/lib/nodes/dnd.ts`** (`insertIndexFor`/`reorderIndexFor`, unit-tested); reorder now uses the helper + sets `dataTransfer` (Firefox-reliable); **NEW palette drag-to-insert** — `ElementsPanel` items are `draggable` and report type via `onDragType`; `PageBuilder` gains a `dragType` state mirroring `dragIndex`; canvas reuses the gold drop-indicator to insert before/after the hovered block; blocks-container + empty-page act as append/empty dropzones (dashed "Drop block here"). Reorder handle (`⠿`) still works. Click-to-insert kept (keyboard path). **NOTE:** the client's "drag and drop not worked" was most likely (a) palette drag was never built (now is) and/or (b) the Turbopack cache wedge — recipe below starts with a clean `.next` wipe.
3. **A2.2 inspector controls** (`f937d80`,`9863486`,`658fc58`,`17c6050`): `css.ts` `styleToCss` now emits **typography** (font-size/weight/line-height/letter-spacing/text-transform — inherited, `display:contents`-safe, NOT box-generating), **width**, **border** (width/style/color; defaults style to `solid`), **box-shadow** (presets none/soft/medium/strong via a map), **position**. New Style groups: Typography, Border, Shadow, **Hover** (bg+text, dotted keys `hover.*`). New Advanced groups: **Position**, **Visibility** (hide desktop/tablet/mobile toggles), **Custom CSS** (textarea, HARDENED). New renderer kinds `toggle` + `textarea` and **dotted-key** path resolution in `StyleRenderer` (`c.key.split(".")` → get/set nested). Guard tests keep **control-key ↔ engine emission ↔ needsBox** in lockstep (`styleControls.test.ts`, `css.test.ts`).

### Final whole-branch review (opus) — verdict "ready to merge = YES", 3 Minor, fixed in `9c2d0a5`
- **#1 (real):** `boxShadow:"none"` forced an empty box (`needsBox` true but no CSS emitted) → `needsBox` now gates `boxShadow` through `shadowOf` (only real presets force a box); `boxShadow` removed from `STYLE_BOX_KEYS`, dedicated tests added.
- **#2 (defense-in-depth):** `</style>` escape only guarded `customCss`, but free-text color values reach the same `dangerouslySetInnerHTML` `<style>` sink → the `</style` neutralization is now applied ONCE over the whole assembled sheet in `nodeCss` (covers colors + any emission); `sanitizeCustomCss` reduced to the whole-word `selector` replace.
- **#3:** `StyleRenderer` switch got a `default:{const _exhaustive:never=c;…}` guard.

### ⚠️ STILL NEEDS CLIENT SPOT-CHECK (agent cannot log in — admin is `requireAdmin`-gated; entering a password is prohibited)
Everything above is verified by `tsc` + 78 Vitest + per-task/final review, but the **editor UI itself was NOT clicked through by the agent.** Client recipe (also in the plan's "Final verification"):
1. **Clean restart** (kills the Turbopack wedge that masquerades as "editor broken"): stop dev on :3000 → `rm -rf web/.next` → `cd web && npm run dev`.
2. Chrome: open a page editor → admin bar gone, Save/⚙/← fully clickable.
3. Drag-to-insert: drag "Heading" from the left panel between two blocks / onto an empty page / into the gutter below the last block.
4. Reorder: drag the `⠿` handle. 5. Controls: set Border+Shadow+Hover+Typography, toggle "Hide on mobile", try Position/Custom CSS → Save → View published page renders the styles.

### What REMAINS (next slices)
- **A3.2 — nested containers** (the big one): drop widgets INTO `columns`/containers; recursive drag/select/edit. TRAP (still true): `PageBuilder.updateBlockProp` + `duplicate` only handle TOP-LEVEL blocks — must recurse into `children`.
- **A2.2 phase 2** (deferred this slice): **gradient** background, **background-image** picker (media), **motion/animation** presets. When bg-image/gradient land, wire `background`/`backgroundImage` emission in `styleToCss` (they're still listed in `STYLE_BOX_KEYS` as DEAD placeholders — either emit them or prune).
- **A2.3 — ResponsiveField + device toggle** (TRAP unchanged): `needsBox` is one boolean applied as a fixed inline `display:contents`; once a box can be set at only tablet/mobile, move the box/contents decision INTO per-breakpoint CSS in `css.ts`.
- **Per-element typography targeting:** wrapper typography inherits through `display:contents` but a block's own type classes (e.g. `display-l`) override `font-size` — documented limitation; deeper targeting later.
- **Harmless deferred Minors:** palette `onDragEnd` leaves stale `overIndex` (confirmed no functional effect — indicator guard false once `dragType` null); `FieldsRenderer` lacks the same exhaustiveness guard (pre-existing pattern).
- **⚠️ PRE-EXISTING LINT (surfaced this session):** `npm run lint` has **9 errors + 3 warnings in UNRELATED files** (ContactForm/Navbar/VideoPlayer/InlineText/Hero3D/HeroScrub) — NOT from this slice (changed files are lint-clean). `tsc` is clean, but a production `npm run build` may trip on these — worth a dedicated lint-cleanup pass. (`npm run build` was NOT run this session; only `tsc` + Vitest.)
- **Push/merge:** branch is 44 commits ahead of `origin/master`, still unpushed — say the word.

## Session update — 2026-07-20 (Live Editor A2 inspector + A3 left panel + FULL-SCREEN Gutenberg-style editor)

**Branch `feature/admin-v1-client-ready`, all pushed to origin (through `d389e71`). `npx tsc --noEmit` clean; 54 Vitest tests pass.** Continued the Live Editor: A2.1 (inspector), A3.1 (left panel), then reworked the whole editor into a **full-screen Gutenberg-style** UI at the client's request.

### What the client wants (important context)
They want the page editor to look/behave **exactly like WordPress Gutenberg** — full-screen, left block inserter, right settings sidebar — and WP-style row actions on the Pages list. They provided the Gutenberg source zip (`D:\Realistic Projects\Aus Projects\Project 11\gutenberg.23.5.3.zip`) as the reference. **We do NOT embed `@wordpress/block-editor`** (it's a WP plugin tied to WP's data layer, doesn't fit Next/Prisma) — we **replicate its UI/UX** on our own block system.

### A2.1 — Content/Style/Advanced inspector (commits `319c81f..9d343aa`)
- `web/src/lib/nodes/styleControls.ts` — `StyleControl` spec + `STYLE_CONTROLS`/`ADVANCED_CONTROLS`.
- `web/src/components/admin/controls/` — ColorControl, DimensionControl, SliderControl, ButtonGroupControl.
- `web/src/components/admin/StyleRenderer.tsx` — renders StyleControl specs (parallel to FieldsRenderer).
- Controls write bg/color/align/maxWidth/minHeight/borderRadius (style) + padding/margin/zIndex/cssClasses/cssId (advanced) — **all already mapped by the A1 css engine**.
- **`needsBox(node)` in css.ts** → renderer wraps a node in `display:contents` UNLESS a box prop/children need a real box (so styling never shifts the page). Public-side verified.

### A3.1 — left elements panel + admin font (commit `7743659`)
- `web/src/components/admin/ElementsPanel.tsx` — categorized (Layout/Text/Media/Widgets/Embed), searchable, click-to-insert block library.
- Admin UI font switched Archivo → **Geist Sans** (`geist` pkg; applied in `app/admin/(panel)/layout.tsx`); admin `<main>` widened to 1440px.

### FULL-SCREEN editor rebuild + Pages row actions (commit `d389e71`)
- **`PageBuilder.tsx` fully rebuilt** as a `fixed inset-0 z-50` full-screen editor (theme-aware tokens, NOT the old embedded panel): header bar (`+` inserter toggle · title · Save/Update · ⚙ settings toggle · `←` exit), **slide-in left inserter** (ElementsPanel), centered **canvas "page"**, right sidebar with **Page / Block tabs** (Block = Content/Style/Advanced when a block is selected; Page = status/slug/SEO/Move-to-Trash). Block hover toolbar (move/dup/delete) kept.
- `app/admin/(panel)/pages/page.tsx` — **WP-style hover row actions** on live pages: Edit · View · Trash.
- The old between-block `+` popups were removed; insertion is via the left panel (inserts after the selected block, else at end).

### ⚠️ CRITICAL GOTCHA — Turbopack dev cache wedges after a machine restart
Symptom: the editor "doesn't work" / the `+` does nothing, and the browser console shows a **stale JSX/parse error that contradicts a clean `tsc`** (e.g. an old `</aside>` on a line that is actually `</div>` on disk). This is a wedged Turbopack cache, NOT a real code error. **Fix:** kill the dev server on :3000, `rm -rf web/.next`, restart `npm run dev`. Always do a clean restart after big edits or a machine reboot. (This was almost certainly the client's "+ not working" too.)

### Verification constraint (unchanged)
The admin is `requireAdmin`-gated; the agent **cannot log in** (entering a password is a prohibited action), so the editor UI is **verified by the client's spot-check**. The block-render/engine path is verified public-side by DB-injecting styled nodes into a published page. `tsc`/eslint/Vitest cover the pure logic.

### Next (roadmap)
Drag-between-blocks inserter; **true nested containers** (A3.2 — drop widgets into columns; recursive drag/select/edit — note `PageBuilder.updateBlockProp` + `duplicate` must recurse); deeper **A2.2** style controls (typography/border/shadow/gradient/hover/motion/custom-CSS); **A2.3** ResponsiveField + device toggle (TRAP: `needsBox` is one boolean applied as fixed inline `display:contents` — must move into per-breakpoint CSS when a box can be set at only tablet/mobile). Full A2/A3 trap list in the git-ignored `.superpowers/sdd/progress.md`.

## Session update — 2026-07-19 (Live Editor A1 foundation + scroll-scrub hero + homepage drift/drag)

**Branch `feature/admin-v1-client-ready` (NOT pushed to origin). `npx tsc --noEmit` clean; 35 Vitest tests pass; homepage verified live in-browser.** Two threads: (1) started the Elementor/Gutenberg-class **Live Editor** (sub-project A of the A→G roadmap) — **A1 foundation complete**; (2) built the **scroll-scrub hero** + **homepage horizontal-drift sections with manual drag**.

### Live Editor — roadmap A→G (client wants Gutenberg + Elementor-class editing)
Decomposed into sub-projects: **A** editor core → B widget catalog → C autosave/revisions → D saved patterns → E media upgrade → F onboarding → G settings polish. Full ambition (client picked max on every axis): true nested containers, full style parity, WP-matching catalog, left elements panel + right **Content/Style/Advanced** inspector. Followed superpowers brainstorm→spec→plan→subagent-build.
- **Spec:** `docs/superpowers/specs/2026-07-19-live-editor-core-design.md`
- **A1 plan:** `docs/superpowers/plans/2026-07-19-live-editor-core-a1-foundation.md`
- **Progress ledger (git-ignored):** `.superpowers/sdd/progress.md`

**A1 FOUNDATION — DONE** (commits `b91cbb8..c8cec9b` + doc `77bd2e6`); every task had a per-task review + a final whole-branch review ("ready to merge: YES"). Added:
- **Vitest** (`web/vitest.config.ts`, `npm test`, node env, `@` alias) — 35 tests.
- **`web/src/lib/nodes/`** (pure logic): `types.ts` (canonical `Node = {id,type,props,style?,advanced?,children?}`, `Responsive<T>`, `Breakpoint`), `walk.ts`, `normalize.ts` (read-path migration of old flat blocks), `css.ts` (style/advanced → `.n-{id}` scoped CSS: responsive tablet≤1024 / mobile≤767, hover, hide, custom-CSS), `validate.ts` (recursive server validation; caps depth 6 / 300 nodes / 20KB bag).
- `BlockRenderer.tsx` is now **recursive** (per-node `<style>`, NOT a single collectCss sheet — deliberate, spec §5). Backward-compat: a node with no style/advanced/children renders **byte-identical** (no wrapper). Verified `/our-studio-story` unchanged.
- `PageBlock` is now an alias of `Node`; `savePage` (`lib/actions/pages.ts`) uses a recursive zod schema + `validateTree`; both read paths run `normalizeTree`. `Page.blocks` is JSON — **no DB migration**.

**A2 IS NEXT — the Content/Style/Advanced tabbed inspector + control library. A2 PRE-WORK TRAPS (recorded here since the ledger is git-ignored):**
1. **BIGGEST:** the universal wrapper `<div class="n-{id}">` will SHIFT layout of existing shell-centered / full-bleed blocks the moment styling is applied → default the wrapper to `display:contents` until a box-model prop (padding/bg/border) needs a real box; audit full-bleed blocks. (Byte-identical today only because nothing sets style yet.)
2. `PageBuilder.updateBlockProp` only matches TOP-LEVEL blocks by id → make it recurse into `children` for nested inline edits.
3. `PageBuilder.duplicate()` drops style/advanced and needs child-id regeneration for cloned subtrees.
4. `nodeSchema` style/advanced/children are `.optional()` (reject explicit `null`) → omit them or use `.nullish()` when the style panel initializes a node.
5. Custom-CSS `selector` substitution is a naive `/selector/g` → needs token-aware replace + `</style>` escaping + user docs when the Custom CSS control ships (zero exposure now — no UI).
6. Add a render-level byte-identical test once a React component-test harness exists.

### Scroll-scrub hero (replaces the slider hero on `/`)
- **`web/src/components/home/HeroScrub.tsx`** — Apple-style `<canvas>` scrub via GSAP ScrollTrigger over a **sticky 3.5-screen track (NO gsap pin → Lenis-safe)**, progressive frame preload (nearest-loaded fallback, no blank flashes), reduced-motion = single static frame, restrained bottom-anchored text lockup (client feedback: footage must lead, not big text). Picks mobile vs desktop frame set at mount via `matchMedia`.
- **Frames** built by **`web/scripts/build-hero-frames.mjs`** (uses **sharp**): raw 340×4K 16-bit PNGs (**6.9GB, git-ignored `Homepage_ref/`**) → desktop **300 @1920px WebP q92 = 57MB** (`public/media/hero-seq/`) + mobile **150 @1080px = 9.7MB** (`public/media/hero-seq-mobile/`) — **both committed**. Re-run: `node scripts/build-hero-frames.mjs [desktop|mobile]`. NOTE: lossless WebP measured **424MB** (rejected); q92 lossy is visually identical — never use lossless for photographic/CGI frames. Commits `15621ea` (desktop) + `9cadcc8` (mobile).
- Old slider `home/Hero.tsx` was **DELETED** (orphaned). `home-2` still uses `VideoHero`; `hero/Hero3D.tsx` + `HomeHero.tsx` remain unused.

### Homepage horizontal-drift sections + manual drag (commits `bedf680` + `6439586`)
- **`web/src/components/Parallax.tsx` → new `ParallaxX`**: scroll-linked horizontal drift (full-overflow reveal, opposite directions) **+ manual pointer drag** (applied position = scroll `baseX` + drag `dragX`, clamped to overflow, rAF-smoothed). Grab cursor, click-suppression after a real drag (card links don't fire on drag), `touch-action: pan-y` (vertical page-scroll preserved), reduced-motion → native horizontal scroll.
- **Services** (`Sections.tsx` `ServicesSlider`): kept the **BIG cards**, now scroll-driven **drift LEFT** + drag (replaced the button carousel).
- **Inside/Outside** (`Featured`): **two rows drift OPPOSITE** each other (rowA left / rowB right) + drag; **added 2 project cards** (leafy-precinct, riverside-warehouse → 6 total, 3/row). NOTE: `home.featured` is **DB-backed** — items were updated in BOTH `content/defaults.ts` AND the live DB block (fresh seed uses defaults; the running DB was patched directly via a one-off script).

### Run / verify this session's work
- `cd web && npm run db:start` (project MySQL on 3307) → `npm run dev` (http://localhost:3000). `npm test` (Vitest, 35). `npx tsc --noEmit` clean.
- The dev MySQL + dev server die with the session — restart with `db:start` then `dev`.

## Session update — 2026-07-17 (LATEST 2: WordPress-style admin + block editor + plugins)
**`npm run build` CLEAN. All flows verified live in-browser.** The admin now mirrors WordPress so a non-technical client feels at home — same anatomy, Studiodota's colors/fonts (charcoal + bronze, Archivo).

- **WP shell:** dark left sidebar (Dashboard / Posts / Media / Pages / Projects / Gallery / Messages / Appearance / Plugins / Users / Settings, with submenus + unread badge; `AdminNav.tsx`) + top admin bar (site name ↗, "+ New" dropdown, "Howdy, {name}" menu with profile/sign-out; `AdminBar.tsx`).
- **Dashboard:** At a Glance, Activity, Quick Draft (creates draft posts; `actions/dashboard.ts`), Edit-the-site shortcuts.
- **Block editor (Gutenberg-style):** `Page` table + `/admin/pages/new` and `/admin/pages/block/[id]` (`PageBuilder.tsx`): WYSIWYG canvas rendering real site components, "+" inserter with 17 elements (`src/lib/pageBlocks.ts`: hero, heading, text, image, image&text, gallery, video, buttons, quote, stats, features, FAQ, CTA, divider, spacer, contact form, clients), per-block settings sidebar (same FieldSpec engine), reorder/duplicate/delete, draft/publish, slug + SEO. Public render at `/{slug}` via `app/(site)/[slug]/page.tsx` + `BlockRenderer.tsx` (SSG, reserved-slug protection). VERIFIED: created "Our Studio Story" (published, unlinked demo — delete from Pages if unwanted).
- **Menus (Appearance → Menus):** header + footer-pages menus are editable (`menus` block → Navbar/Footer). /services, /gallery, /projects keep mega panels automatically; any new page can be added as a plain item. VERIFIED add + remove.
- **Plugins:** real architecture — `src/plugins/<id>/` manifest (FieldSpec settings + slot components) + `registry.ts`; states in `plugins` block; `PluginSlot` renders active plugins into `site.floating` / `site.beforeFooter` / `home.end`. Admin Plugins screen: Activate/Deactivate + Settings. **WhatsApp Chat Button plugin installed** (phone/message/corner; currently DEACTIVATED — activate + set the real number in /admin/plugins). To add a plugin with Claude Code: create the folder, export a manifest, add one line to `registry.ts`.
- **Posts:** WP list-table (search + category filter), Categories manager (`taxonomies` block; rename propagates to posts; `actions/taxonomy.ts`), PostForm category select + "new" toggle.
- **Appearance:** Themes screen (Studiodota 1.0 active; themes = future token packs), Customize (site identity), Menus.
- **Users → Profile:** display name/email + change password (bcrypt verify; `actions/users.ts`). Settings → General (old /admin/settings redirects).
- **Structure notes:** shared form engine extracted to `FieldsRenderer.tsx` (+ `lib/validateFields.ts` used by blocks, plugins, and page-builder validation). Prisma migration `pages` added (note: MySQL forbids defaults on TEXT — seoDescription is VARCHAR).
- **Not done / known:** themes are a single-entry architecture stub (no alternate packs by design — colors stay); no Trash/revisions on pages; screenshots in the in-app pane were flaky (all verification DOM-based); demo artifacts left: "Our Studio Story" page (published, unlinked) + one dashboard draft post.

## Session update — 2026-07-17 (custom CMS + homepage polish + real video)
**`npm run build` CLEAN.** Everything below verified live in-browser (admin round trip included).

**Custom CMS (from scratch) — the site is now fully editable at `/admin`:**
- **Stack:** MySQL 8.4 + Prisma 6 (v7 has breaking config changes — stay on 6 unless migrating deliberately) + bcryptjs sessions + zod + server actions. No Strapi.
- **Database:** project-local MySQL instance on `127.0.0.1:3307`, data in `.mysql/data` (gitignored), binaries from the system MySQL 8.4 install. **Start it with `cd web && npm run db:start`** (script: `web/scripts/db.ps1`). The app + `npm run build` need it running. DB `studiodota`, user `studiodota` (password in `web/.env` DATABASE_URL). Re-initialize if ever lost: `mysqld --no-defaults --initialize-insecure --datadir=D:\Studiodota.net\.mysql\data` then create db/user per this section.
- **Admin login:** `/admin/login` — email `marketing.realistic3d@gmail.com`, password in `web/.env` (`ADMIN_PASSWORD`, currently `studiodota-admin-2026` — CHANGE IT: update the User row's bcrypt hash or re-seed with new env values).
- **Schema** (`web/prisma/schema.prisma`): User, Session, Block (key+JSON per page section), Project (+location), Post, GalleryItem (+youtubeId), Media, ContactMessage. Seed: `npx prisma db seed` (idempotent — never overwrites edited rows; sources `src/content/defaults.ts` + posts from `src/content/site.ts`).
- **Admin surfaces:** Dashboard · Pages (every page section-by-section via a spec-driven form engine — `src/lib/pageRegistry.ts` drives BOTH the forms and server validation) · Projects CRUD · Posts CRUD (sectioned articles) · Gallery CRUD (incl. YouTube IDs) · Media (upload to `public/uploads/`, magic-byte validated) · Messages inbox · Settings (site/nav/footer/SEO). Saves `revalidatePath("/","layout")` → live instantly.
- **Content flow:** `(site)` route group layout + pages read via `src/lib/content.ts` (React-cached, falls back to `src/content/defaults.ts` if DB is down); ALL public strings/images come from blocks or tables. `site.ts` remains only as seed source + home-2 legacy.
- **Contact forms** (contact page + homepage CTA) persist to ContactMessage via a server action (zod, honeypot, per-IP in-memory rate limit) → admin Messages (unread badge).

**Homepage polish (all verified):**
- **Featured "Inside, Outside"** rebuilt to the client's new card design (`Homepage_ref/inside_outside_section.jpg`): dark band, light cards (quote-mark SVG, title, location/year, circled-arrow View Details pill → project pages), offset second row, whileInView stagger + Parallax drift + hover zoom.
- **ServicesSlider "Learn more" pill** was white-on-white in light theme → fixed dark-ink-on-light literals; `.btn-primary` text now fixed `#17191c` (was `var(--ink)` = paper-white in light theme).
- **PromoBanner (Canva "Start your project") removed**; **GeometricBackground removed** from Showreel.
- **FinalCTA** → immersive full-bleed parallax band (harbour render, scrim, display headline, contact links, glass form card) wired to the real contact action.
- **Video:** `VideoPlayer.tsx` rewritten — **ambient** (muted autoplay while ≥35% on screen; rect-math visibility + poll, since IntersectionObserver delivery proved unreliable; iframe-API `playVideo` nudge because `autoplay=1` alone gets ignored in some webviews) and **cinema** (click → unmuted autoplay + controls, used by showreel modal + gallery lightbox). **Error 153 in the last session was a red herring** — it means "no referrer" (direct embed-URL navigation), NOT embedding-disabled; embeds from a real page work. Showreel slides + gallery videos carry verified-embeddable placeholder films (B1M/NEVER TOO SMALL/Local Project) — **swap in the studio's own YouTube IDs in /admin** (Pages → Homepage → Showreel; Gallery items).

**Structure:** public pages moved to `web/src/app/(site)/` (own layout w/ Navbar/Footer fed from DB); admin in `web/src/app/admin/` (guarded `(panel)` group + `/admin/login`). Root layout = fonts + DB-driven metadata only. `next.config.ts`: serverActions bodySizeLimit 12mb.

**Known limitations / next steps:** login + contact rate limits are in-memory (fine single-instance); uploads live on disk (`public/uploads/`, committed); the dev MySQL process dies with the session — run `npm run db:start`; `/home-2` still uses legacy components + `site.ts`; no email notification on new enquiries yet; Prisma pinned to 6.x.

## Session update — 2026-07-17 (cinematic redesign + P1 a11y)
Large homepage motion/design pass. **`npm run build` CLEAN (20 routes).** Verified in-browser, light + dark.

**P1 accessibility — all fixed:**
- Mega-menu opens on click + keyboard (ArrowDown moves focus into panel), `aria-expanded`/`aria-controls`, Esc closes + returns focus, outside pointer/focus closes; hover still works. (`Navbar.tsx`)
- Showreel: removed `<span onClick>` inside `<button>` — card is a `<div>`, inactive slides get one full-cover select `<button>`, active slide has one real play `<button>`. (`Sections.tsx`)
- Reduced motion: new `src/lib/useReducedMotion.ts` gates Framer `Reveal`, scroll-driven Showreel/Timeline, and all new GSAP motion. Timeline renders a static stacked fallback under reduced motion.

**New / changed sections:**
- **Section-adaptive glass nav** — keeps glassmorphism; tint follows the section behind it. Dark sections tagged `data-nav-tone="dark"`; `src/lib/useSectionTone.ts` probes at y=44; `.nav-shell[data-tone]` in globals.css drives `--nav-fg/-dim/-accent/-hover-bg/-active-bg`. Dark theme forces dark nav. Sliding active-pill highlight (also fixes P2 small-gold contrast).
- **Services** rebuilt to `Homepage_ref/services section.jpg` — "OUR SERVICE" eyebrow; rows (title+blurb / pill tags) alternating with layered-image feature cards (main + offset, parallax) + "VIEW DETAIL →".
- **Featured** — kept "Inside, Outside" grid (reduced-motion-safe) AND added **`ProjectSlider`** (Urban Oasis / `New_featured_section.jpg`): full-bleed cards, "Project n/N", Learn more, circular prev/next, click-right smoothly slides with next card peeking. Uses `content/site.ts` projects.
- **Cinematic layer:** hero parallax + "scroll" cue; `ScrollHighlightText` (About statement, word-fill on scroll); `ImageMaskText` "STUDIODOTA" band (image through letters); Showreel + StatementBand are dark bands with rounded-top "curtain" transitions; crop-mark corners on slider.

**New files:** `src/lib/useReducedMotion.ts`, `src/lib/useSectionTone.ts`, `src/components/Parallax.tsx` (`Parallax` + `ParallaxImage`), `src/components/ScrollHighlightText.tsx`, `src/components/ImageMaskText.tsx`.

**Notes:** reduced-motion is code-gated (matchMedia) but not runtime-emulated this session. `.grad-text`/`.grad-text-media` trip the impeccable gradient-text hook — left intentionally (brand hero wordmark + stat numbers). Parallax applied to hero + services feature images; other images kept hover-zoom. Reference sites studied: vaulk.com + findrealestate.com. Not committed to git yet.

### Gallery + inner-page redesigns (same session)
- **New `/gallery`** — mixed photo/video with category filter (All / Architecture / Residential / Commercial), animated grid (Framer, reduced-motion safe), numbered pagination, accessible lightbox (Esc / focus-restore / scroll-lock). Video items use a VIDEO badge + Ken-Burns motion (no real `.mp4` yet — drop `web/public/media/hero-loop.mp4` and swap the lightbox to `<video>` to activate real playback). Nav "Gallery" now points to `/gallery`. Files: `app/gallery/page.tsx`, `components/gallery/GalleryClient.tsx`.
- **Shared `PageHero`** (`components/PageHero.tsx`) — cinematic full-bleed parallax media hero (dark scrim, eyebrow/title/lede, dark nav tone). Used by gallery/services/projects/contact.
- **Services** (`app/services/page.tsx`) — media hero + `ScrollHighlightText` statement + alternating parallax service blocks with capability tags (no numbered scaffolding).
- **Projects** (`app/projects/page.tsx` + `components/projects/ProjectsClient.tsx`) — media hero + client-side animated category filter (keeps `?category=` deep-link via server prop), editorial grid with a featured full-width first project + overlaid titles + hover motion.
- **Contact** (`app/contact/page.tsx`) — media hero + form in a `card-grad` panel + sticky info aside with a studio image. Fixed stale "3D rendering" metadata; `ContactForm` error text → `--gold-ink` for contrast.
- **New components:** `PageHero`, `ScrollHighlightText`, `ImageMaskText`, `gallery/GalleryClient`, `projects/ProjectsClient`.
- **Impeccable:** wrote root `PRODUCT.md` + `DESIGN.md` (register = **brand**); design hook active. `npm run build` CLEAN — **21 routes** (`/gallery` new; `/projects` is now dynamic ƒ due to searchParams).

### Phase 2 — font, menu, sliders, showreel, gallery, blog (branch `feature/cinematic-redesign`)
Work is on branch **`feature/cinematic-redesign`** (3 commits; `master` untouched). `npm run build` CLEAN — **24 routes**.
- **Font:** Poppins → **Archivo** (calm/business grotesque) via `lib/fonts.ts` on the `--font-gilroy` var; Geist Mono kept.
- **Menu:** top-level Services/Gallery/Projects are now **links** (navigate) + a caret `<button>` toggles the dropdown (hover still works); `▾` → rotating chevron SVG. (`Navbar.tsx`)
- **Inside/Outside:** matched `Featured Project Section.jpg` — "All" on a left rail, Living/Playing/Working on the right, animated filter.
- **Homepage services:** the old "OUR SERVICE" rows were **replaced by `ServicesSlider`** (full-bleed slider, each slide a service); the projects `ProjectSlider` was removed.
- **Showreel:** reverted dark→**light** + `GeometricBackground` (drifting grid, wireframe shapes, cursor spotlight; reduced-motion gated in globals `.geo-*`).
- **Gallery:** 4 → **2 big columns**; video items render `VideoPlayer`.
- **VideoPlayer** (`components/VideoPlayer.tsx`): branding-hidden YouTube (nocookie, controls=0, cropped) **or** mp4. Currently **fail-safe** (`VIDEO_ENABLED = false` → shows a moving poster) because the YouTube videos found return **Error 153 (embedding disabled)** and the in-app browser can't rasterize the iframe to verify. **To activate the Kling clip:** set `SITE_VIDEO_MP4` (drop mp4 in `web/public/media/`) or `SITE_VIDEO_ID` (embeddable id) and `VIDEO_ENABLED = true`.
- **Blog:** `Post` model extended (image, inlineImage, author, intro, sections). **6 SEO articles.** `/journal` = hero + featured + image grid; `/journal/[slug]` = featured-image header + sectioned article + inline image + sticky sidebar (TOC + related).

### Phase 3 — Magnific images + Canva/Figma banners (DONE), merged to master
- **Magnific images:** pulled 3 distinct renders (`office-tower.jpg` = corporate glass facade, `living-pool.jpg` = bright interior, `rooftop-pool.jpg` = rooftop amenity) into `web/public/media/renders/` at ~1024px; swapped into the gallery (Glass & Steel / Sky Terrace / Poolside Living) and the "interiors-that-last" post to cut image repetition.
- **Canva banner** → `web/public/media/cta-banner.png` (sans-serif "Start your project"); placed as a full-width homepage CTA banner (`PromoBanner`) before the contact form, linking to `/contact`.
- **Figma banner** → built in Figma file `XRqkv5Nt2wqwbMwo4Ikhma` ("Studiodota Banner", Dependopolis 2 team), exported to `web/public/media/blog-banner.png` (Archivo "Let's build something lasting."); placed as a CTA banner at the foot of `/journal`.
- **Branch `feature/cinematic-redesign` merged into `master`.** `npm run build` CLEAN (24 routes). Not pushed to origin (say the word).

## What this is
Marketing/portfolio website for **Studiodota — a real architecture & design practice**
(NOT a 3D-rendering studio; that was an earlier concept, repositioned to real architecture
— content only was swapped, design kept). Live in `web/`.

## Repo / Git
- Root: `D:\Studiodota.net` (git). App: `web/`.
- Remote `origin` → `https://github.com/muradwp99/Studiodota.net` , branch `master`.
- Last push to `origin/master`: `e82f7b1`. Since then there is **extensive UNPUSHED work** on branch **`feature/admin-v1-client-ready`** (custom CMS/admin + Live Editor A1 + scroll-scrub hero + homepage drift/drag). Latest local commit `6439586`. Nothing has been pushed — say the word to push.
- Root `.gitignore` excludes `.claude/`, `.agents/`, `node_modules/`, `.next/`.

## Run / build
```
cd web
npm run dev      # http://localhost:3000  (Next 16 + Turbopack)
npm run build    # currently CLEAN — all 20 routes compile
```
Dev-server note: only run one instance; a 2nd `npm run dev` exits on a duplicate guard.
Verify visually via the in-app browser (mcp__Claude_Browser__*). The homepage has no WebGL
now, so screenshots work; use JS `window.scrollTo` or the `computer` scroll (max scroll_amount 10).

## Stack
Next.js 16 (App Router, TS, Turbopack) · React 19 · Tailwind v4 · Framer Motion · GSAP + ScrollTrigger · Lenis · Poppins (next/font/google, on `--font-gilroy` var) · Geist Mono (small mono).

## Design system (light theme is primary; dark via toggle)
Tokens in `web/src/app/globals.css` `:root` (light) + `:root[data-theme="dark"]`:
- Surfaces: `--ink #f4f3ef`, `--ink-2 #eae8e1`, `--surface #fff`, `--surface-2 #f0eee7`
- Text: `--bone #17191c`, `--bone-dim #545a62`, `--muted #6b7178`
- Accent: `--gold #a87f3f` (fills), `--gold-ink #856428` (readable accent TEXT), `--gold-hi`, `--gold-media #e6cb92` (accent text OVER dark images)
- `--on-media`/`--on-media-dim` = light text over dark imagery
- Glass: `--glass-bg`/`--glass-border`; `--watermark`
- Gradient utils: `.grad-warm .grad-soft .grad-mesh .grad-text .grad-text-media .btn-grad .card-grad`
- Patterns: `.pattern-grid .pattern-dots`
- Fonts/display: `.display-xl/-l/-m`, `.eyebrow`, `.btn/.btn-primary/.btn-ghost`, `.reveal`, `.marquee-*`
Theme toggle: `Navbar.tsx` sets `document.documentElement.dataset.theme` + localStorage.

## File map (key)
- `web/src/app/layout.tsx` — root layout, metadata (architecture), fonts, Navbar/Footer/SmoothScroll/ScrollProgress/grain
- `web/src/app/page.tsx` — Home = `<Hero/> + <Sections/>`
- `web/src/app/home-2/page.tsx` — video-hero variant, **noindex** (⚠ still uses OLD `HomeSections` + rendering-era copy; not in nav)
- `web/src/components/Navbar.tsx` — floating glass pill; hover mega-menus (Services / Gallery[video+photos] / Projects) + Blog + Contact + theme toggle + Get Started
- `web/src/components/Footer.tsx` — Arvon-style footer, watermark, architecture services
- `web/src/components/home/Hero.tsx` — slider hero, gradient "Studio" wordmark, bronze-gradient Show Portfolio
- `web/src/components/home/Sections.tsx` — ALL homepage sections (About+CountUp, Services[gradient cards, alternating], WhyChoose, Featured "Inside/Outside" + vertical Living/Playing/Working buttons + filter, Showreel[scroll-driven focus + play modal], Process[click→image+overlay, arrow], Timeline[scroll-driven, gradient rail], Testimonials, Clients[dual marquee], FAQ[smooth], Journals[featured + 3-grid], FinalCTA[form])
- `web/src/components/Reveal.tsx` — Framer Motion whileInView reveal (dir: up/right/left)
- `web/src/content/site.ts` — content layer (architecture services/projects/process/posts/testimonials/serviceOptions)
- Inner pages: `web/src/app/{about,services,projects,projects/[slug],journal,journal/[slug],contact,privacy}/page.tsx` (+ `PageHeader.tsx`, `ProjectCard.tsx`, `ContactForm.tsx`)
- Real renders (8, Magnific/Seedream): `web/public/media/renders/*.jpg` (named by project slug + hero/interior)
- Dead/unused: `web/src/components/hero/Hero3D.tsx` + `HomeHero.tsx` (old 3D hero — safe to delete) and old `web/src/components/HomeSections.tsx` (only home-2 uses it)
- Client references (design targets): `Homepage_ref/*` (14 section images)

## REVIEW (inline — the multi-agent workflow was interrupted before finishing; re-run below)
Verdict: **ship-able; a few P1 accessibility items to fix.** Prioritized:
- **P1 A11y — mega-menu is hover-only.** Services/Gallery/Projects panels open on mouse hover; no keyboard/focus/click open → keyboard & touch users can't reach them. Add button `onClick`/focus handling + Esc close in `Navbar.tsx`.
- **P1 A11y — nested interactive in Showreel.** The play "▶" is a `<span onClick>` inside a `<button>` (invalid nesting). Make the card a `<div>`/link and play a real `<button>`, or restructure.
- **P1 A11y — reduced motion.** `Reveal` (Framer) + scroll-driven Showreel/Timeline don't honor `prefers-reduced-motion`. Gate animations.
- **P2 Contrast — remaining small gold text.** A few decorative `text-[var(--gold)]` small uses (service numbers, active Featured tab, "Explore the gallery" link, timeline accent word) sit ~3.7:1 on light. Switch small ones to `--gold-ink`. (Buttons/eyebrows/muted already fixed.)
- **P2 — `/home-2` stale.** Uses old HomeSections + "3D rendering" copy + removed `.bezel/.clip-word` reliance. Update to new Sections or delete the route.
- **P2 — dead code.** Delete `components/hero/Hero3D.tsx`, `HomeHero.tsx`, old `HomeSections.tsx` once home-2 is handled.
- **P2 Perf — multiple window scroll listeners** (Lenis, ScrollProgress, Showreel, Timeline). Fine, but could consolidate; verify smoothness on low-end.
- **P2 SEO** — add `sitemap.xml`/`robots`, per-page OG images; `/` could use a distinct meta description.
- **Feel-tuning (subjective)** — Showreel section is `reel.length*40vh` (~200vh) and Timeline `*42vh`; test scroll length/pacing live and adjust the multipliers.
- To run the real multi-agent review fresh: relaunch the Workflow named intent "studiodota-final-review" (script at `.../workflows/scripts/studiodota-final-review-wf_63bef2ed-020.js`) — but since the conversation is being cleared, simplest is to ask the new session to "run a multi-agent review of web/src homepage (code, a11y, seo/perf, design + critic)".

## Known placeholders / not-done
- Contact form + FinalCTA form are front-end only (simulated submit) — no `/api/contact`/email/backend.
- Showreel + Gallery-mega "videos" use a render as poster; no real `.mp4` (drop one at `web/public/media/hero-loop.mp4`).
- No Strapi/MySQL backend yet (content is the typed `site.ts` layer). Backend was the originally-planned next phase (see docs/PROJECT-BRIEF.md).
- Portraits (testimonials/why-choose/journal author) use initials avatars, not photos (deliberate — no fake stock faces).

## Suggested next steps (pick up here)
1. Fix the P1 a11y items (mega-menu keyboard, showreel button, reduced-motion).
2. Sweep remaining small `text-[var(--gold)]` → `--gold-ink`; re-verify contrast.
3. Update or delete `/home-2`; delete dead 3D-hero files.
4. Live feel-tune Showreel/Timeline scroll pacing.
5. (Bigger) Wire the Strapi v5 + MySQL backend + `/api/contact` per docs/PROJECT-BRIEF.md.

## Connectors
Magnific MCP (image gen) is authed at user scope — generate in the Magnific app under unlimited (0 credits), pull via `creations_search`/`creations_get`. Figma connector needs interactive auth. Writes to Figma only work in the "Dependopolis 2" team.
