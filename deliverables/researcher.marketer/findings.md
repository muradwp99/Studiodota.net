# Digital Marketer / CRO Findings — Admin CMS as a Product

> Agent: researcher.marketer · Phase 1 · persisted by orchestrator (subagents can't
> write files in this harness). Lens: the admin IS the product. "Conversion" = a real
> end-client's time-to-first-successful-edit and first-published-change; how the agency
> owner sells/onboards it; and the public enquiry funnel the product is partly sold on.
> All findings sourced from reading the actual admin + public-flow code and repo docs;
> external competitor facts verified via WebSearch (see §7).

## 1. Activation Path Audit — login → orient → first edit → publish → see it live

1. **Login** (`web/src/app/admin/login/page.tsx`, `LoginForm.tsx`) — clean minimal card, single inline error, rate-limited server-side (5/10min per IP, `web/src/lib/auth.ts:21-38`). No forgot-password / remember-me / SSO. The brand text "Studiodota" is a **hardcoded literal** (`login/page.tsx:21`), not read from the `site` block — the first screen a client sees is not white-label-driven today.
2. **Dashboard** (`app/admin/(panel)/page.tsx`) — At a Glance, Quick Draft, Activity, Edit-the-site. **No onboarding tour, demo-content callout, or launch checklist** despite that being the product's own stated ambition (`docs/PRODUCT-PLAN.md` §4).
3. **Orientation** (`AdminNav.tsx`, `AdminBar.tsx`) — a genuine strength: deliberate `wp-admin` mirror; WP-literate users orient in seconds. Strongest evidence for the "feels like WordPress" claim.
4. **First meaningful edit — two paradigms, and the client hits the weaker one first (most important structural finding):**
   - **(a) Template pages** (Homepage etc., `pageRegistry.ts:286-300`) via `BlockEditor.tsx` — a **blind, form-only editor**: labeled fields, no canvas, no preview. Homepage = **14 stacked sections**, each with its own duplicated "Save section" button, navigated by anchor pills. Labels are structural ("Headline — accent word / line 1") and assume the user pictures the layout.
   - **(b) New custom pages** via "+ Add New" → `PageBuilder.tsx` — a real Gutenberg-style WYSIWYG canvas (17 block types, click-select, live `BlockRenderer` preview). Genuinely impressive.
   - A real client's first task is "fix our existing homepage," not "build a new page" — so **the best experience in the product is gated behind the task a first-session user is least likely to attempt.**
5. **Confirming the edit** — one generic banner *"Saved — the live site is updated"* (`ui.tsx:26`); no inline preview; result requires new-tab "View live" + tab-hopping. The custom-page canvas avoids this (canvas = preview).
6. **Publish** — template pages have **no draft state**; every save is unconditionally live (`actions/blocks.ts:19-26`). Custom pages have Draft/Published but no "preview as published" for stakeholder review.
7. **See it live** — always new-tab, never embedded.

### Stall / confidence-loss points
1. No onboarding/tour/checklist. 2. Realistic first task = least-visual screen. 3. No live/inline preview in the template editor. 4. **No unsaved-changes guard anywhere** (`PageBuilder`/`BlockEditor`/`PostForm`/`ProjectForm`) — editing 3 sections, saving 1, silently loses 2. 5. No autosave. 6. No draft/preview safety on template pages. 7. **No trash/soft-delete anywhere** — delete is a native `window.confirm()`, truly permanent. 8. Validation errors are one banner, not per-field — `FieldsRenderer.tsx` has zero inline error UI, unlike the public `ContactForm.tsx`. 9. Image fields expose raw paths a non-technical user can mistype.

**"Aha" moment:** the custom-page canvas's instant, real-styled block insertion — two clicks from the dashboard but never surfaced or sequenced on first login.

## 2. Onboarding & Trust (first 10 minutes)

**In the client's favor:** familiar IA kills "where am I" anxiety; consistent plain-English save feedback (`ui.tsx:14-31`); trustworthy media upload (magic-byte sniff, 10MB cap, safe names, `actions/media.ts`); graceful degradation (DB down still renders defaults, `content.ts:10-22`); honest Plugins/Themes copy ("your developer or Claude Code").

**Missing, and its cost:** zero in-admin help (no "?", docs, or support link) → confusion escalates straight to phoning the agency; no first-run tour/checklist; no safe way to experiment (no draft on template pages); no forgot-password; no 2FA; the "Activity" widget over-promises its name (it's a feed, not the change-audit-log §4 wants). **Verdict:** WP-literate clients orient instantly; the genuinely non-technical persona gets no guidance/safety/preview — "self-explanatory, no training" isn't an honest claim yet.

## 3. Selling the Product

**Strongest hook (positioning proposal, not a code fact):** *"It feels like WordPress — but it's actually yours."*

**Proof points:** zero retraining for WP-literate staff; a real working plugin (WhatsApp Chat — currently the *only* one, so hold "ecosystem" language); a built-in visual page builder WP users usually pay extra for; invisible security hardening; resilient rendering.

**DIFFERENTIATED (code-verified):** bespoke on-brand admin skin per client (**conditional on closing the white-label gap** — login hardcodes "Studiodota"); structurally lower maintenance surface than WordPress (no plugin/theme update treadmill; WP care plans run ~$40–80/mo basic to $200–500+/mo comprehensive per §7 — market context only); **the editor cannot break the layout** (`FieldsRenderer` exposes only typed, server-validated fields — vs. documented Webflow client-breakage complaints).

**TABLE-STAKES (don't over-claim):** one-click plugin/theme marketplace (WP has it; here every addition needs a dev); client-facing analytics dashboard (Duda ships it; none wired here); zero-training onboarding (Ghost ships pre-filled onboarding; none here); white-labeling as first-class (Duda standard; here an unbuilt backbone item).

**Demo must show:** sidebar tour → build a block live in the canvas (anchor moment) → Draft→Published → view live → activate WhatsApp with no code → open Messages and be honest about the notification gap (§4).

## 4. Public-Site Lead Conversion

Two forms feed the same `submitContact` action (`lib/actions/contact.ts`) and disagree:

| | `/contact` (`ContactForm.tsx`) | Homepage `FinalCTA` (`Sections.tsx`) |
|---|---|---|
| Fields | name*, email*, phone, company, service*(dropdown), message*, **consent*** | name*, email*, message* |
| Validation | custom per-field inline, preserves input | native HTML5 only |
| Consent | explicit checkbox + `/privacy`, blocks submit | **none** |

- **New finding: privacy-consent handling is inconsistent** — both write the identical `ContactMessage` row, but only `/contact` asks consent. The two entry points should agree (owner/legal call, §6).
- Honeypot also differs (visible-"company"-merged vs. hidden `aria-hidden`) — both work; duplication is a maintainability smell.
- `/contact` is the **best-crafted form in the codebase** — better than anything in the admin itself.
- **The notification void (single most consequential finding):** `submitContact()` only writes a DB row (`contact.ts:39-47`) — no email/webhook. A lead is visible only if an admin opens `/admin/messages`. This directly undercuts the "within one business day" promise made twice publicly. **For a product sold on "sites that get you enquiries," an enquiry nobody sees is a liability.**

**Recommendations:** (1) ship the email notification (`ROADMAP` §C) — highest leverage/lowest effort in this audit; (2) reconcile consent asymmetry; (3) align/annotate validation UX; (4) add a service hint to the homepage form once notifications exist.

## 5. Prioritized Recommendations

**Quick wins:** 1. **[Build]** enquiry email notification (§4). 2. **[Build]** source login brand name from the `site` block, not hardcoded "Studiodota" (unlocks white-label demoability). 3. **[Build]** unsaved-changes guard across all editors (§1 #4). 4. **[Build]** reconcile consent/honeypot inconsistencies (§4). 5. **[Design]** add "View live ↗" to Gallery items for consistency.

**Bigger bets:** 6. **[Design+Build]** live-preview for template-page editing (biggest lever on time-to-first-confident-edit). 7. **[Build]** onboarding backbone (tour, demo content, launch checklist) — 100% absent. 8. **[Build]** page revisions/trash. 9. **[Build]** Messages workflow (status/notes/CSV). 10. **[Product+Build]** decide + build real white-labeling before quoting client #2.

## 6. Open Issues for the Human Owner

- Is "feels like WordPress, is actually yours" the right hook? (positioning call)
- Don't claim "zero training" before the onboarding backbone ships.
- Care-plan tier/pricing (external bands in §7 are context, not a recommendation).
- Whether/when to fund white-label backbone before client #2.
- Whether "plugin ecosystem" language belongs in sales material with one plugin shipped.
- Legal/consent posture for the homepage lead form (§4).
- **Placeholder/fabricated content (flagged, not replaced):** fake clients marquee, invented testimonials, unverified stats (ROADMAP Gate G1); third-party YouTube films as own work (G2); placeholder phone/socials (§A); credentials in `handoff.md` git history (G3); leftover demo artifacts ("Our Studio Story" page, one draft post).

## 7. Sources (external claims only)
Codeable / OneNine / Inspirable (WP care-plan pricing 2026); Web Help Agency (white-label WP); Webflow Way + Pravin Kumar (client handoff, legacy Editor retiring 2026); Duda (white-label + analytics features); GoodUX + StaticMania (Ghost onboarding). Full URLs in the agent transcript.
