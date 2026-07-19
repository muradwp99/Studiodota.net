# Studiodota.net — Launch Roadmap & Remaining Work

> Status date: 2026-07-19. Product state: site + custom WP-style CMS (block editor,
> plugins, menus) functionally complete, verified, pushed to GitHub. This document
> lists everything between "works on the dev machine" and "client-ready business
> asset", sequenced for execution.

## 0. Launch gates (hard blockers — no launch while any is open)

| # | Gate | Why it blocks | Owner | Effort |
|---|------|---------------|-------|--------|
| G1 | Remove/replace fake credibility content: clients marquee (Deloitte/Amazon/Disney…), invented testimonials, unverified stats (£85M, 400+ projects, 4.9/5) | False client/endorsement claims = legal + reputational risk | Client + Content | 0.5–1d |
| G2 | Replace placeholder YouTube films (B1M / NEVER TOO SMALL / Local Project) with the studio's own films — editable in /admin (Pages → Homepage → Showreel; Gallery) | Third-party work presented as studio work | Client | 0.5d |
| G3 | Secrets hygiene: admin + DB passwords appear in handoff.md (committed to GitHub). Confirm repo is private NOW; rotate all credentials at deploy; scrub or accept doc exposure policy | Credential exposure | DevOps | 0.5d |

## A. Content & Brand (client-dependent — start immediately, everything is admin-editable)

- [ ] Real projects: titles, locations, summaries, photography (project detail currently reuses the hero render twice — needs real galleries)
- [ ] Real films (G2) + real testimonials or hide section (G1)
- [ ] True stats and awards; verify every number on the site
- [ ] Real contact details: phone (+44 20 0000 0000 is placeholder), office address, social URLs (all "#")
- [ ] Logo mark (currently letter-"S" square; Figma design was an open dependency), favicon, OG share images
- [ ] Full copy proofread (Hero → Footer, all inner pages, privacy policy accuracy)
- Mitigation for delay: launch with 4 strong projects rather than 12 thin ones.

## B. Launch Infrastructure (DevOps, ~3–4d, parallel to A)

- [ ] Hosting decision. Recommended: VPS/managed Node host with persistent disk
      (uploads live in `public/uploads/`; MySQL alongside). Vercel/serverless would
      require S3/R2 media rework + managed MySQL — defer unless there's a reason.
- [ ] Production MySQL 8.4 (managed or hardened self-host), user/grants, `DATABASE_URL`
- [ ] Migrations + seed run against prod; admin created with NEW credentials (G3)
- [ ] Domain, DNS, SSL, www/apex redirects
- [ ] Staging environment (same shape as prod)
- [ ] CI: build + lint on every push; block merge on failure
- [ ] Backups: nightly DB dump + uploads sync, retention policy, **restore tested once**
- [ ] Deploy runbook (build → migrate → start; rollback steps)
- Note: dev DB is a local instance on 127.0.0.1:3307 (`npm run db:start`) — prod must be a real service.

## C. Leads Pipeline (Backend, ~1d — highest value per hour)

- [ ] Email notification on each enquiry (Resend or SMTP) with reply-to set to the enquirer
- [ ] Daily digest of unread messages (optional cron)
- [ ] Spam posture: honeypot + per-IP limit exist; add Cloudflare Turnstile only if real spam appears

## D. SEO / Performance / Analytics (SEO-Perf, ~2d)

- [ ] `sitemap.xml` (include block-editor pages) + `robots.txt`
- [ ] Per-page OG images; JSON-LD (Organization, Article for journal)
- [ ] Canonicals; verify metadata on block-editor pages
- [ ] Lighthouse pass: hero LCP (image priority/preload), font loading, CLS check on sticky sections
- [ ] Privacy-friendly analytics (Plausible/Umami — keeps the "essential cookies only" privacy claim true)
- [ ] Error monitoring (Sentry) + uptime check

## E. Hardening & Engineering Debt (Frontend/Backend, ~3d, may trail launch)

- [ ] Delete `/home-2` + dead components (`Hero3D`, `HomeHero`, old `HomeSections`)
- [ ] Media pipeline: sharp resize/optimize on upload; alt-text editing in Media library
- [ ] Draft preview for pages/posts (view before publish)
- [ ] Page revisions / trash (block editor has no history after save)
- [ ] Rate limits from in-memory → DB-backed (needed only for multi-instance)
- [ ] Password change invalidates other sessions; consider 2FA later
- [ ] iOS Safari / mobile QA sweep (Lenis smooth-scroll + sticky Showreel/Timeline are the risk areas)
- [ ] A11y re-audit: new admin screens + block-editor output; reduced-motion on new blocks
- [ ] Designed 404 page

## F. Phase-2 Product Backlog (post-launch, in value order)

1. Plugins via existing architecture (each = folder + manifest + one registry line):
   booking/Calendly embed, Instagram feed, newsletter signup, back-to-top, announcement bar
2. Project-detail image galleries (CMS field + lightbox)
3. Site search; journal RSS
4. Post scheduling (publish-at date)
5. Theme token packs (architecture stubbed under Appearance → Themes; brand colors stay default)
6. Multi-user roles (editor/author) if the team grows

## Sequence

| Sprint | Focus | Exit criteria |
|--------|-------|---------------|
| 1 (wk 1) | Gates G1–G3, workstreams B + C; client starts A | Staging on real domain, real content loading, enquiry emails arriving, secrets rotated |
| 2 (wk 2) | Workstream D + QA matrix | Lighthouse ≥90 perf/SEO, monitoring green, launch checklist signed |
| Launch | DNS cutover + 48h watch | Zero P0s for 48h; prod backup restore verified once |
| 3+ | E then F | Debt burned down; plugin cadence begins |

Critical path: **client content (A)** — everything else parallelizes around it.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Client content delays launch | High | Launch thin-but-true (4 projects); content is admin-editable post-launch |
| Fake-content ships by accident | Medium | G1 is a named launch gate with sign-off |
| Single-admin bus factor | Medium | Runbook in handoff.md; tested backups; password in a password manager |
| Serverless hosting chosen late | Low | Decide hosting in Sprint 1 day 1; uploads/DB architecture depends on it |
| Prisma 6 pin ages | Low | Fine for years; revisit deliberately, never casually (v7 = breaking config) |
