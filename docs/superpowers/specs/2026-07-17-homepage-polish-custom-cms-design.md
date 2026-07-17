# Homepage polish + custom CMS — design spec

Date: 2026-07-17 · Status: approved by user in chat ("Start Everything")

User decisions (locked): custom CMS built from scratch (not Strapi/Payload/Keystatic) ·
MySQL (original brief) · single admin login · YouTube links supplied by user (editable via
admin; verified-embeddable placeholders until then) · Featured section replaces
"Inside, Outside" · all work in one pass.

## A. Homepage polish (web/src/components/home/Sections.tsx + friends)

1. **Featured section → editorial project cards.** Reference:
   `Homepage_ref/inside_outside_section.jpg` (export of `New Featured Project Section.fig`).
   Dark full-width band (`data-nav-tone="dark"`). 4 project cards, staggered 2-row grid
   (second row horizontally offset). Each card: fixed-light panel (quote-mark glyph, project
   title, "Location / Year", "View Details" pill linking to `/projects/[slug]`) + image half
   with hover zoom/parallax. Animations: staggered `whileInView` reveals, image scale, pill
   hover fill; all gated by `useReducedMotion`. The All/Living/Playing/Working filter is
   removed. Projects gain a `location` field.
2. **ServicesSlider button contrast bug.** `Learn more` pill = `background: var(--on-media)`
   + `color: var(--ink)`; on the light theme `--ink` is paper-white → white-on-white text.
   Fix: fixed dark ink text (`#17191c`) on the always-light pill (theme-independent, like
   other over-media literals in the file). Verify both themes in browser.
3. **Remove PromoBanner** ("Start your project" Canva banner) from the homepage.
4. **FinalCTA → immersive full-bleed contact band.** Full-width render background with
   parallax + dark scrim, display headline, studio contact details, glassmorphism form card
   (name / email / message), refined focus states, `data-nav-tone="dark"`, reduced-motion
   safe. Form posts to `/api/contact` (part C).
5. **Showreel:** remove `GeometricBackground`.

## B. Video playback (Showreel + Gallery)

`VideoPlayer.tsx` rewritten around two modes, source per item (YouTube id now; mp4 supported):

- **ambient** — mounts only when the item is focused/in view (IntersectionObserver /
  active-slide), plays muted + looped, `controls=0`, `pointer-events: none`, cropped scale
  to hide chrome, poster underneath until the iframe loads. Satisfies "plays when focused".
- **cinema** — created on click (user gesture) with `autoplay=1&mute=0&controls=1`
  → plays immediately **with sound**. Used by the Showreel modal + Gallery lightbox.
- No source configured → existing Ken-Burns poster fail-safe.

Showreel: active slide plays ambient; ▶ opens cinema modal. Gallery: video cards play
ambient in view; click opens cinema lightbox. YouTube ids live in the CMS (user pastes
their links in admin later); placeholders must be verified embeddable in the browser first.

## C. Custom CMS (from scratch, inside the Next.js app)

**Stack:** MySQL 8.4 (existing local server, or a dedicated dev instance on :3307 if its
credentials are unavailable) · Prisma ORM · bcryptjs + DB-backed session cookie
(httpOnly, SameSite=Lax, 30d) · zod validation on every mutation · server actions for
admin writes (Next CSRF-protects actions) · `revalidatePath` on save so edits go live
instantly. Single admin user; login rate-limited.

**Schema:** `User`, `Session`, `Media` (uploads → `public/uploads`, existing renders
registered), `Project` (adds `location`, ordering, published), `Post` (sections as JSON),
`GalleryItem` (type photo/video, `youtubeId`), `ContactMessage`, `Block` (`key` + JSON —
one row per editable page section: site settings, nav, footer, home.*, page heroes/copy).
Collections get tables; per-section copy gets Blocks. This is the "edit anything" contract:
every public string/image traces to a Block or a table row.

**Admin UI (`/admin`):** login → dashboard (recent messages, quick links) · Pages
(Home sections editor; Services/About/Contact/Gallery/Journal/Projects/Privacy hero+copy)
· Projects CRUD · Posts CRUD (sectioned article editor) · Gallery CRUD (incl. youtubeId)
· Media library (upload: mime + size validated) · Messages inbox · Settings (site, nav,
footer, SEO defaults). Own layout (no site chrome) via route groups: pages move to
`app/(site)/`, admin in `app/admin/`.

**Frontend rewiring:** `lib/content.ts` typed getters (zod-parsed, fall back to current
literals) · public pages become server components passing data into the existing client
sections · `(site)/layout.tsx` feeds Navbar/Footer from DB · `/api/contact` persists both
forms' submissions.

**Error handling:** invalid login → generic error + rate limit; invalid input → field
errors from zod; upload rejects wrong type/size; missing youtubeId → poster fail-safe;
DB empty → content fallbacks render.

**Verification:** `npm run build` clean; browser pass light+dark (polish items, ambient +
cinema video, reduced motion); admin edit → public page reflects; contact row persisted.

## Out of scope

Email notifications, multi-user roles, image resizing pipeline, draft/preview workflow,
deployment/hosting changes, home-2 cleanup (separate task list item in handoff).
