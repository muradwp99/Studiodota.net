# Studiodota.net — Session Handoff

> Read this first to continue work in a fresh session. Full detail also in
> `docs/PROJECT-BRIEF.md` and `docs/BUILD-NOTES.md`. Memory: `MEMORY.md` +
> `studiodota-project.md` (auto-loaded).

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
- Last push: commit `e82f7b1` "Build Studiodota architecture & design studio site" — everything is pushed.
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
