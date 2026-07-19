# Admin CMS v1.0 — Component & Interaction Spec

> Agent: design.ui · Phase 2 · persisted by orchestrator.
> Central decision: assemble all 11 v1.0 surfaces from **4 shared primitives** + existing
> tokens (ui.tsx / globals.css) — never restyle the WP-literal chrome (the #1 trust asset).
> Riskiest call: BlockEditor autosave must NOT ship before its draft layer, or it worsens
> the "instant publish" P0 (matches features-research sequencing).

## 0. Shared primitives (new, built once)

**0.1 `ConfirmDialog`** — replaces every native `window.confirm()` (7 sites) + adds the missing block "✕"/list-"Remove" confirms. States asking→pending→(close|error-inline). Reuses MediaPicker's modal recipe but `bg-[var(--surface)]`, `z-[100]` (above the 30/40/90/95 ad-hoc scale). Body **always states the real consequence** (propagate Media/Categories' best-in-class copy). Footer: `btnGhostCls` Cancel + tonal variant — **reversible=gold `btnPrimaryCls`**, **irreversible=quiet-danger `btnDangerCls`**. Backdrop/Esc = Cancel. **Default focus = safe button** (accidental Enter cancels, not deletes). Full focus trap + focus-return (both are NEW bars MediaPicker doesn't meet today).

**0.2 `SaveStatus`** (idle/saving/saved/error) — one indicator vocabulary for manual save, autosave, dirty. Copy: `● Unsaved changes` (gold-ink) / `Saving…` / context-specific saved (see §2) / error reuses `Notice` box. `aria-live="polite"` for ticks, `role=alert` on error. Beside each Save button.

**0.3 `FieldsRenderer` errors+help extension** — new `errors?: Record<string,string>` keyed by path relative to fields root (`"slides.0.image"`). Per field: `role=alert` red text under input + `aria-invalid`/`aria-describedby` + red border (3 channels, never color-only). `help` renders below input `text-xs text-[var(--muted)]` (both help+error show together). `list` rows with a nested error get red border + "N error" badge on the index. **Scroll-to-first-error**: reveal collapsed container first (GalleryManager accordion → `openId`; PageBuilder → `setSelected` the block, since its fields only exist in DOM while selected), then `.focus()`, then `scrollIntoView(center, reduced-motion-aware)`. **Dependency (build.architect):** actions must return `fieldErrors: Record<string,string>` — today's 3 validators disagree (validateFields throws first-only; pages.ts returns first issue; collections.ts joins all into one string). Converge on `{ok?, error?, fieldErrors?, savedAt?}`; when fieldErrors present, `Notice` collapses to "Check the highlighted fields below."

**0.4 `ReorderControls`** — one ↑/↓ component replacing 3 impls (FieldsRenderer list arrows, PageBuilder toolbar, and the raw numeric `sort` input in Project/Gallery). `aria-label="Move {title} up/down"`. Optimistic instant persist, no Save step. Optional drag grip — but **arrows never removed** (WCAG keyboard equivalent).

## 1–11. Surfaces (each traceable to a research finding)

**1. Unsaved-changes guard** (UX P0): dirty tracking is near-free — every form's `set()` already calls `setState(null)` per keystroke; piggyback a `dirty` bool. `useUnsavedChangesGuard(dirty)`: `beforeunload` (native prompt, unstyleable) + in-app `Link`/back interception → ConfirmDialog "Leave without saving?" (safe default "Keep editing"). **14-section template page:** needs a dirty registry (context wrapping `AdminPageEditor`) since the 14 BlockEditors are independent state; a sticky summary bar "3 sections have unsaved edits · [Review][Save all]" (gold `Notice`-tint) + gold dot + "(unsaved)" aria on dirty anchor pills.

**2. Autosave** (UX P0) — **two editors need different handling.** PageBuilder (has status) = safe, persists current status. **BlockEditor (no draft, Save=instant publish) MUST write to a draft layer, never live** — else it autopublishes typos every 2.5s. Debounce ~2.5s. Vocabulary: `Editing…`→`Saving draft…`→`Draft saved · not yet published`; explicit Save still fires the live `Notice`. **Failed autosave never clears the field.** Suspends while a ConfirmDialog/manual save is in flight.

**3. Draft preview** (UX P0 + features "draft 404s for the signed-in editor" — `app/(site)/[slug]/page.tsx` filters `status:published` with no admin bypass): a distinctly-labeled **"Preview draft ↗"**, never conflated with "View live". Page-level for the 14-section editor (the whole point is seeing sections composite). New tab with a persistent **preview chrome band** (`bg-[#17191c] text-white`, "Preview — draft, not published · Exit preview") so a draft tab is never mistaken for live. `requireAdmin()` gate; no shareable token in v1.0.

**4. Trash + restore** (UX §G — no `deletedAt` anywhere): needs nullable `deletedAt` on Page/Post/Project/GalleryItem/Media/ContactMessage. "Delete"→"Move to Trash". Per-list view-switcher "All (12) | Trash (3)" (WP convention, Posts filter-row styling). Trash rows reuse the live row template + Restore/Delete-permanently + "Trashed 3 days ago". **CRITICAL: Media "Move to Trash" hides the row only — the file is unlinked ONLY on permanent delete**, else Trash gives zero protection for the one delete with visible public consequence. Consequence-stating confirm copy per type. No bulk/auto-purge in v1.0.

**5. Last-saved snapshot** (single snapshot, not full history — matches features scope): one prior version per entity, overwrite-on-save. "Restore last saved version (2h ago)" affordance when a differing snapshot exists (labeled "last published" in BlockEditor). Loads into editor local state only — **not auto-published** (needs one more explicit Save); flips dirty so §1 protects it.

**6. Media upgrade** (4 P1s): **6a search** (mirror Posts recipe; MediaManager via searchParams, MediaPicker client-side debounced). **6b editable alt** (always-visible input under each tile, save on blur; MediaPicker keeps click=select, adds a pencil secondary). **6c multi/drag-drop** (dropzone scales the dashed placeholder; `multiple`; per-file queue, independent failures show that file's specific error; idle→drag-over(`--gold` border+`--gold/5`)→uploading→complete). **6d "used in"** (MediaManager only; on-demand scan — NOT eager — of Block/Page JSON + image columns; "Used in N places" expands to linked references; upgrades §4 confirms to name the places).

**7. Field errors** — §0.3 mechanics; ProjectForm/PostForm/GalleryManager are hand-rolled (not FieldsRenderer) → one shared `FieldError` component so errors look identical everywhere.

**8. Render `FieldSpec.help`** — §0.3 placement; add `help?` to the `group` kind (only one missing it). Write help copy for the fields UX flagged unclear (e.g. hero titleAccent) — 2-3 examples, not a wholesale content pass.

**9. Reorder unification** — `ReorderControls` on the Projects & Gallery admin **list rows**; remove the raw numeric `sort` input from ProjectForm/GalleryManager (column untouched). Post sections + FieldsRenderer lists already match.

**10. Onboarding.** **10a Launch checklist** (Dashboard `Widget`, placed first): 6 grounded, deep-linked items (site name/tagline/contact→Settings; review homepage; preview homepage; publish first Post; add first Project; activate a plugin) — no "add logo" (no `site.logo` field exists; would be fabrication). States incomplete→complete (filled check + dim, no strikethrough, "(complete)" hidden text); 100%→collapses to a dismissible line (`localStorage`). **10b First-run tour**: 4-5 anchored popovers (Pages, +New, the checklist, Plugins, a centered sign-off), once (localStorage flag), Skip/Esc ends permanently, ring reuses PageBuilder's selected-block treatment. Suppressed below `md` (mobile nav dead-ends). `role=dialog aria-live=polite`, focus→Next.

**11. Consistency fixes.** **11a Settings↔Customize** (both render the identical `site` BlockEditor): **Settings wins** (WP-literal home for identity); Customize becomes a redirect to `/admin/settings/general` (precedent: `/admin/settings` already redirects), removed from Appearance nav for v1.0, route kept alive; earns nav back when theme customization is real (v1.5). **11b Login white-label**: login hardcodes "Studiodota" in 3 places; `AdminBar` already does it right via a `siteName` prop — make login `getBlock("site").name` the same way. **Wrinkle for build.dev:** login exports a static `metadata` object → must switch to dynamic `generateMetadata` to source the title.

## Cross-cutting conflicts (resolved)
1. **Autosave gated on draft layer** — ship §2+§3 for BlockEditor as one unit (research-unanimous).
2. **Media Trash hides the row only; unlink on permanent delete only** (easy to get backwards).
3. **"View live" vs "Preview draft"** — distinct labels + preview chrome band (built into §3).
4. Sidebar-only editing (not in-canvas) is an *accepted* trade-off both UX+Marketer frame as the layout-safety strength — inline editing is v1.5+, out of scope.

**Out of scope for v1.0 (deferred, not missed):** bulk actions, full multi-revision history, shareable/tokenized preview links, command palette, roles/multi-user, theme token-packs, tour-replay, block-level trash, media user-sort.
