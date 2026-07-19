# Phase 3 — Architecture & Perf Budget (Admin v1.0)

> Reconciles the approved design specs against the technical budget. Author:
> orchestrator (playing build.architect). Inputs: design.ui, design.motion, all research.

## Context
Additive upgrade to the existing Next 16 + MySQL/Prisma admin. Touches: (a) the Prisma
data model (nullable columns only — backward-compatible), (b) a handful of new shared
components/hooks, (c) wiring into existing admin screens. **Public site read path is
unchanged** — it keeps reading the published columns; only a new admin-gated preview route
is added.

## Data model (one additive migration — all nullable, backward-compatible)
- **Soft-delete:** `deletedAt DateTime?` on `Page, Post, Project, GalleryItem, Media, ContactMessage` (+ `@@index`). Every existing list/public query adds `where:{ deletedAt: null }`. Trash view queries `deletedAt: { not: null }`.
- **Draft layer** (enables autosave/draft/preview): add `draft Json?` to **`Block`** (template-page sections) and **`Page`** (custom pages). Live/public reads the published column (`Block.data` / `Page.blocks`). Admin editors autosave into `draft`. **Publish** = copy `draft`→published, null out `draft`, `revalidatePath`. Preview renders `draft ?? published`. This is the mechanism that makes BlockEditor autosave safe (ruling #1).
- **Snapshot** (single last-saved, restore): `snapshot Json?` + `snapshotAt DateTime?` on `Block, Page, Post, Project, GalleryItem`. On each publish, copy the current published value → `snapshot` before overwriting (overwrite-on-save, not append).
- Migration is purely additive → safe on existing data; seed unaffected; rollback = revert code, columns may remain.

## Validation layer (ruling #5)
Standardize every admin mutation to return `{ ok?, error?, fieldErrors?: Record<string,string>, savedAt? }`.
- `validateFields.ts`: collect ALL errors into a path-keyed map (stop throwing on first).
- `pages.ts` / `collections.ts` zod: map `error.issues` → `{ [issue.path.join(".")]: message }`.
- Fix the doubled slug message (`"slug: Slug: …"`) while here.

## Preview routing
New admin-gated route `app/(site)/preview/[kind]/[key]/page.tsx` (kind = page|home|services|…). `requireAdmin()`; renders the existing `BlockRenderer`/section components with `draft ?? published` content, wrapped in the preview chrome band (design.ui §3). Public routes stay `status:published`/published-column only.

## Components/hooks to build (design.ui §0)
`ConfirmDialog`, `SaveStatus`, `FieldError` (+ `FieldsRenderer` errors/help), `ReorderControls`, `useUnsavedChangesGuard(dirty)`, `useAutosave(save, deps)` (2.5s debounce), a dirty-registry context for the 14-section editor, `Toast`/toast host, `LaunchChecklist` widget, `FirstRunTour`. All styled with existing tokens; motion per design.motion (Framer Motion already a dep; port GalleryClient patterns).

## Media
Add **`sharp`** for resize/WebP on upload (server-only dep — no client-bundle impact). Multi-file: iterate the existing single-shot Server Action per file (indeterminate progress, ruling #4). "Used in" = on-demand server function scanning `Block.data`/`Block.draft`/`Page.blocks`/`Page.draft` JSON + image string columns for a path — **never eager** (avoid N+1 on grid render).

## Perf budget
Admin is auth-gated, not LCP-critical — but: autosave debounced ≥2.5s (no write storms); "used in" strictly on-demand; `sharp` server-only; no new client JS on public pages except the preview route (admin-only). Public site Core Web Vitals unaffected (read path unchanged). New admin components are small and lazy where modal-only.

## Blast radius / risk
- Highest-risk change: the `Block`/`Page` draft split — must guarantee public keeps reading the published column. Mitigate: change the write path (autosave→draft, publish→promote) but leave `content.ts` public reads on `data`/`blocks` untouched; verify with a build + browser pass that the live site is unchanged before wiring autosave UI.
- Soft-delete: every list/public query must add `deletedAt:null` — a missed one leaks trashed content. Grep all `findMany`/`findFirst`/`findUnique` on the 6 models.
- Reversible: all columns nullable; features are additive; rollback is code-revert.

## Build sequence (Phase 4 — design.lead spot-review @25/50/75/100%)
1. **Foundation:** migration (deletedAt, draft, snapshot) + data-layer helpers + validator standardization + `deletedAt:null` sweep. *(25%)*
2. **Primitives:** ConfirmDialog, SaveStatus, FieldError+FieldsRenderer, ReorderControls, useUnsavedChangesGuard, useAutosave, Toast host.
3. **Safety net wiring:** unsaved guard everywhere; autosave→draft + preview + snapshot-restore in BlockEditor & PageBuilder; the 14-section dirty registry + summary bar. *(50%)*
4. **Trash:** soft-delete actions + per-list All/Trash switcher + restore/permanent across 6 models (Media file-lifecycle ruling #2).
5. **Forms:** field-level errors + `help` across FieldsRenderer + hand-rolled forms; reorder unification. *(75%)*
6. **Media:** search/filter, editable alt, multi/drag-drop, sharp pipeline, used-in.
7. **Onboarding:** LaunchChecklist widget + FirstRunTour.
8. **Consistency:** Settings/Customize redirect; login white-label (generateMetadata).
9. **QA (Phase 5):** build clean + browser pass (create/edit/preview/trash/restore/autosave/media/onboarding), then commit/push. *(100%)*

Reconciliation note: no design spec exceeds the technical budget — the specs already flagged every action-layer/data dependency, and all are additive. No design rework required.
