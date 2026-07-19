# design.lead — Review Log

## Phase 2 review — design.ui + design.motion (reviewed together for coherence)

**Verdict: APPROVED (round 1, no rework).**

**Coherence check (§4):**
- Both specs use ONLY existing tokens (ui.tsx classes, globals.css CSS vars, easing `--ease-lux`/`--ease-out`). Brand (charcoal/bronze, Archivo) untouched. ✓ (Ground Rule §0.4 — one voice.)
- The specs interlock: design.ui's `ConfirmDialog`/`SaveStatus`/modal-toast surfaces map 1:1 to motion's §7 shared modal/toast language and §1 save-status transitions. No parallel systems invented. ✓
- Both independently reach the same critical sequencing (autosave must not precede the BlockEditor draft layer) and the same Media-Trash-file-lifecycle correctness note. Convergence, not conflict. ✓
- Scope discipline: both defer the identical v1.5+ set (inline editing, command palette, roles, theme packs, shareable preview, bulk actions). ✓
- No fabrication; both flag placeholder/product decisions to the owner rather than inventing (§0.2). ✓

**design.lead rulings (lock these for Phase 3/4):**
1. **BlockEditor autosave + draft + preview ship as one unit.** Never autosave into the instant-publish path.
2. **Media "Move to Trash" hides the DB row only; the file is unlinked only on permanent delete.**
3. **Block-level Trash is NOT in v1.0** → block "✕ Remove" = inline confirm + collapse motion (not "depart").
4. **Upload progress = indeterminate pulse for v1.0** (no fake %); determinate deferred until an XHR progress path exists.
5. **Field errors require the action layer to return `{ ok?, error?, fieldErrors?: Record<string,string>, savedAt? }`.** Standardize the 3 divergent validators. (Phase 3.)
6. **Settings wins over Customize** — Customize → redirect, removed from nav for v1.0.
7. **Login white-label** via dynamic `generateMetadata` + `getBlock("site").name`.
8. **v1.0 = the 11 surfaces only.** Out: bulk actions, full revision history, shareable preview links, command palette, roles, theme packs, tour-replay, block-level trash, media user-sort.

**Brand-consistency (orchestrator-covered):** verified no new palette/font/spacing values introduced; all new components expressed in existing tokens. Pass.

Phase 2 locked → Phase 3 architecture.
