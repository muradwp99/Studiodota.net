# Motion & Interaction Spec — Admin CMS v1.0

> Agent: design.motion · Phase 2 · persisted by orchestrator.

## Principle
Every animation answers a trust question the client is silently asking (*did that save / is it really gone / can I undo / where did my focus go*) within ~150–300ms. Reuse the marketing site's easing vocabulary, not a second one: **`--ease-lux`** `cubic-bezier(0.22,1,0.36,1)` for anything **settling into a state** (selection, autosave indicator, popovers, toasts, dirty dot, checklist); **`--ease-out`** `cubic-bezier(0.16,1,0.3,1)` for anything **entering/leaving a list** (Notice, blocks, media items, trashed rows, modals). Everything collapses to instant opacity-only under `useReducedMotion()`/`prefers-reduced-motion`.

## Duration scale (proposed as tokens for build.architect/design.ui to formalize)
`--dur-1: 120ms` (micro swaps) · `--dur-2: 160ms` (small appearances) · `--dur-3: 220ms` (default) · `--dur-4: 260ms` (biggest: modal open, trash depart).

**Global rules:** (1) exit ~60–75% of enter duration; (2) no shake/fake-progress/confetti — errors get color + the same calm fade as success; exactly ONE flourish allowed (100%-checklist, §6b); (3) reduced motion removes movement, never information (toasts/tooltips/checklists still appear, just instant); (4) Framer Motion already a dependency (`^12.42.2`) — every pattern is a compressed variant of something in `Sections.tsx`/`GalleryClient.tsx`; port, don't invent.

## 1. Save & autosave
- **1a. Notice banner** (`ui.tsx` L14–31, currently hard mount/unmount): wrap call sites in `AnimatePresence`; enter opacity 0→1 + y(-6→0), 200ms `--ease-out`; success checkmark pops (scale 0→1) ~40ms after; **error = identical motion**, only color `#a33` + `role=alert` differ (no shake). Exit 130ms on the existing `setState(null)`-on-edit. Reduced: instant opacity.
- **1b. Autosave indicator** (net-new; idle→saving→saved→error): cross-fade icon+label (opacity 0↔1, incoming icon scale 0.9→1), 140–180ms `--ease-lux`. `saved` holds 1600–2000ms then fades to quiet "Up to date." **`error` does NOT auto-dismiss** — persists with retry (a silently-vanishing autosave failure is the #1 trust break). Reduced: instant swap, holds unchanged.

## 2. Unsaved-changes
- **2a. Dirty dot:** first edit → scale 0.85→1 + opacity 0→1, no overshoot, 160ms `--ease-lux`. On save, hold ~100ms (timed to the §1a checkmark) then fade+shrink out 140ms. Reduced: opacity only.
- **2b. Leave-confirm modal:** uses §7 Modal language; focus lands on safe default ("Keep editing") — port `GalleryClient.tsx`'s `closeRef.current?.focus()` idiom. Calm, not punitive — no red/shake; this is the safety net made visible.

## 3. Block editor (PageBuilder)
- **3a. Inserter popover:** scale 0.96→1 + opacity + rise(-6→0), transform-origin at the "+" button, 160ms open/120ms close `--ease-lux`. Trigger gets press-scale (extend `.btn:active{scale:.975}` to admin `btnCls` — currently missing). No backdrop.
- **3b. Block insert:** opacity 0→1 + scale 0.97→1 (subtle — canvas already shows the real block), 220ms `--ease-out` + smooth scroll-into-view (~300ms). Reduced: instant, jump-scroll.
- **3c. Block remove — the P0 fix:** needs a confirm first (recommend **inline** toolbar cross-fade to "Remove? [Remove][Cancel]", 140ms, cheaper than a modal). After confirm: collapse opacity 1→0 + height→0 so siblings slide up (Framer `layout`+`AnimatePresence`, port from GalleryClient), 220ms `--ease-out`. Today's jump-cut reads as "did I just lose that?"; 220ms gives the eye cause→effect.
- **3d. Duplicate:** new block grows in below (as 3b); origin block ring-brightens 100ms then settles. Reduced: instant, no flash.
- **3e. Reorder:** apply `layout` so a swap FLIP-slides both blocks (today it's a silent DOM reorder — a named P1). 220ms `--ease-lux`. Drag-drop (if it ships): dragged block scale 1.02 + `.hover-lift` shadow, dashed `--line-strong` placeholder fades in 120ms.
- **3f. Selection ring:** opacity 0→1; moving selection cross-fades (old out 100ms / new in 140ms, ~40ms overlap) so no flash of zero/two rings. Toolbar appears with the ring (same state, opacity+y-4→0), never lags it. 140ms `--ease-lux`.

## 4. Media
- **4a. Upload progress** (flag: single-shot Server Action today → true byte-progress needs XHR path): **determinate** = thin 2–3px edge bar, width tracks bytes **linearly no easing** (eased fill on real data lies); **indeterminate** (likely v1.0) = quiet opacity pulse 0.6↔1 ~1.1s (the ONE legit `--ease-in-out` use). **Never a simulated %.** Error: dropzone border → red 200ms + §1a Notice fade. Reduced: shimmer off; determinate bar jumps not tweens.
- **4b. New-item grid entry:** opacity 0→1 + scale 0.94→1 — **identical to GalleryClient's grid-item entrance, reuse verbatim**. Multi-upload staggers ~40ms; existing items reflow via `layout`+`AnimatePresence mode=popLayout`. 240ms enter `--ease-out`. (Optimistic insert vs. wait-for-confirm = build.architect call, needs rollback.) Reduced: instant, no stagger.
- **4c. Drag-drop states (net-new):** drag-enter → border dashed `--line-strong`→solid `--gold` + faint warm wash; active hover → dropzone scale 1→1.01; drop → wash intensifies then settles 200ms into 4a. 160ms `--ease-lux`. Reduced: color only, no scale.

## 5. Trash/restore (net-new; 7 hard-delete sites today behind unanimatable `window.confirm()`)
- **5a. Depart to Trash:** replace `window.confirm` with in-app confirm (§7/§3c). Row "departs": slide ~12px + fade + height→0 so siblings close smoothly, 260ms `--ease-out`. Then a Toast "Moved to Trash — Undo" with a depleting-time hairline (§7). Undo animates the row back **at its original position** (mirror 5a), 220ms. Reduced: instant; toast+Undo still appear. Intent: "nothing is ever really gone" — the exhale moment.
- **5b. Restore:** mirror in reverse out of Trash list, 220ms `--ease-out` + "Restored" toast.
- **5c. Permanent delete** (the one irreversible action): distinctly *heavier via restraint* — modal at slower end (280ms), row exit is **plain fade only** (no slide/destination). Signal finality by the absence of reversible-motion vocabulary, not drama.

## 6. Onboarding (net-new; committed scope PRODUCT-PLAN §4/§5)
- **6a. Tour tooltips:** same popover shell as the Inserter (§3a) — one popover system. Enter opacity+scale 0.96→1 from anchor 200ms `--ease-lux`. Step→step **cross-fades, never flies across screen** (disorienting). Progress dots reuse Timeline's active-dot idiom tightened to 200ms. Dismiss fade+shrink 160ms. Reduced: instant, still appears (essential wayfinding).
- **6b. Checklist check-off:** circle fills gold 160ms + checkmark scale 0→1 140ms (~40ms after fill); label dims via color only (no animated strikethrough). **The one permitted flourish:** at 100%, card border pulses gold once, 300ms single non-looping cycle. Reduced: fill+check instant together, no pulse.

## 7. Modals / drawers / toasts — one shared language (closes the MediaPicker vs. AdminBar inconsistency; reuse GalleryClient lightbox values)
- **Modals** (blocking): backdrop fade 200/150ms; panel opacity + scale 0.96→1 + rise(+10→0, always rising) 220–260ms `--ease-out`, exit 160–180ms. Focus → primary/safe control (port GalleryClient idiom). Reduced: backdrop fades, panel opacity-only.
- **Popovers** (anchored, no backdrop): opacity + scale 0.96→1 from anchor, 160/120ms `--ease-lux`. Reduced: instant.
- **Toasts:** slide+fade from anchored edge (bottom-right/center), y(12→0) 220ms `--ease-lux`. Action toasts (Undo) hold **5–6s** with a visible depleting hairline (2px, linear, matches hold) so the undo window is *seen* closing; info toasts ~3–3.5s. Stack by pushing upward 180ms. Reduced: opacity only, hairline still depletes.

## Open coordination items (for design.ui / build.architect)
1. Dirty-dot placement (chrome = design.ui). 2. Block-remove confirm UI (inline vs. popconfirm). 3. **Is block-level Trash in v1.0?** (determines block-remove exit = "depart" vs. "collapse"). 4. Upload progress determinate vs. indeterminate (depends on upload path). 5. Optimistic media insert vs. wait-for-confirm. 6. Toast anchor position. 7. Extend `.btn:active` press-feedback to admin `btnCls` family.

## Quick reference
Notice 200/130 out · autosave 140–180 lux · dirty-dot 160/140 · inserter 160/120 lux · block-insert 220 out · block-remove 140+220 · duplicate 220 · reorder 220 lux · ring 140 lux · upload linear/1.1s-loop · media-entry 240 out · drag 160 lux · trash-depart 260 out · restore 220 out · perm-delete 280 · tooltip 200/120 lux · checklist 160/140 (+300 one-shot) · modal 220–260/160–180 out · popover 160/120 lux · toast 220/160 + 5–6s hold. All → instant/opacity under reduced motion.
