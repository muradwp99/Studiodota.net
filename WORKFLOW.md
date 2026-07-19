# WORKFLOW.md — Multi-Agent Design & Build Orchestration System

**Invoke with:** `Read WORKFLOW.md. Act as ORCHESTRATOR.`

This file defines a reusable multi-agent workflow for taking a website or product from "functional" to "modern, premium, and user-researched" — using research, design, and build agents that report to a reviewing lead. It is project-agnostic: drop it into any repo root and it adapts to whatever's already there.

---

## 0. Ground Rules (apply to every agent, every project)

1. **Audit before invent.** Before proposing new copy, layout, or components, read what already exists in the project (live site, repo, prior specs). Cite what's there now, what's weak, what's strong. Never propose a "best practice" without connecting it to something actually observed in this project.
2. **No fabricated data.** Never invent stats, testimonials, client logos, or metrics to fill a gap. If something reads as placeholder or filler, flag it as an open issue for the human owner to resolve — don't quietly replace it with a different invention.
3. **Consistency check is mandatory.** Every agent that touches content must check for naming, terminology, and tone drift across the pages/files it touches (e.g. a product or company referred to by two different names, inconsistent claims in different places). This is a standard rejection reason for the review gate, not an optional nice-to-have.
4. **One voice.** Copy and design changes must match the existing established tone/brand voice, not drift toward generic template language, unless the brief explicitly calls for a voice change.
5. **Every deliverable is persisted to disk** at `/deliverables/<agent-id>/`, not just described in chat. **Environment note:** in this harness, subagents cannot write files — they RETURN their findings/specs as text, and the **orchestrator persists** them to the correct path immediately on receipt (so nothing is lost if an agent is later killed). Code (Phase 4) is written directly to the repo by the build agent as normal.
6. **Cap on rework loops: 3.** See §4 Review Protocol.
7. **Persist-on-arrival + small fleets.** The orchestrator writes each returned deliverable to disk the moment it lands, and keeps parallel agent batches small (2–3) — background agents can hit session/usage limits and die; persisting immediately and re-launching a single dead agent is cheaper than losing a whole fleet.

---

## 1. Roster

### Research Layer (runs first — output feeds Design + Marketing)

**`researcher.ux`** — UX Researcher
- Audits existing UX: navigation, information architecture, form/conversion friction, mobile behavior.
- Competitor teardown: identifies comparable products/sites and what they do better or worse.
- ICP / user pain-point mapping: who actually uses this, what makes them trust it enough to convert vs. bounce.
- Output: `/deliverables/researcher.ux/findings.md`

**`researcher.marketer`** — Digital Marketer / CRO
- Conversion path audit: entry point → key action → drop-off risks.
- Message hierarchy audit: is the current lead message the strongest hook, or is a stronger proof point buried lower?
- Positioning vs. competitors: what's differentiated, what's now table-stakes.
- Output: `/deliverables/researcher.marketer/findings.md`

### Design Layer (parallel specialists + one reviewing lead)

**`design.lead`** — Lead Designer (REVIEW GATE — full authority to approve/reject, see §4)
- Owns final visual direction and design-system coherence across everything in scope.
- Reviews every design and build output before it ships. Rejects work that doesn't meet the bar, with specific reasons.
- Does not execute research or write component code directly — reviews and directs only.

**`design.ui`** — UI Designer
- Component-level system: buttons, cards, forms, states, spacing/grid tokens.
- Works from `researcher.ux` + `researcher.marketer` findings.
- Output: `/deliverables/design.ui/component-spec.md`

**`design.motion`** — Motion / Interaction Designer
- Scroll behavior, micro-interactions, transitions, any animated or interactive sequences.
- Integrates existing animation/interaction assets already in the project rather than assuming a rebuild.
- Output: `/deliverables/design.motion/motion-spec.md`

**`design.brand`** — Brand / Visual Identity
- Color, type, imagery direction, and whatever the project's specific "premium" or brand signifiers are — audits whether they're used consistently across the whole surface area in scope.
- Output: `/deliverables/design.brand/identity-spec.md`

### Build Layer

**`build.architect`** — Frontend Architect
- Component structure and performance budget. Sets the technical ceiling design.motion and design.ui must work within.
- Output: `/deliverables/build.architect/architecture.md`

**`build.dev`** — Developer
- Implementation. Consumes design.ui + design.motion + build.architect specs. Does not make independent design decisions — flags ambiguity back to design.lead instead of guessing.

**`build.qa`** — QA / Performance
- Lighthouse / performance scores, real-device checks, verifies implementation matches approved specs and doesn't regress existing metrics.
- Output: `/deliverables/build.qa/report.md`

### Orchestration

**`orchestrator`** — Routes tasks, sequences phases, enforces the review gate, is the only agent that talks to the human owner directly for phase sign-off between major stages (not per-component).

---

## 2. Phase Sequence

```
PHASE 1 — RESEARCH (parallel)
  researcher.ux + researcher.marketer
  → both outputs required before Phase 2 starts

PHASE 2 — DESIGN DIRECTION (parallel, gated)
  design.brand + design.ui + design.motion draft in parallel
  → design.lead reviews ALL THREE together (coherence check, not just individual quality)
  → loop per §4 until approved

PHASE 3 — ARCHITECTURE
  build.architect defines perf budget + component structure
  → design.lead + build.architect reconcile if design specs exceed technical budget

PHASE 4 — BUILD
  build.dev implements against approved specs
  → design.lead spot-reviews at 25/50/75/100% checkpoints, not just final

PHASE 5 — QA
  build.qa tests
  → any regression kicks back to build.dev (an implementation gate, not a design gate —
    design.lead is not re-invoked here unless QA traces the regression to a spec error)

PHASE 6 — FINAL REVIEW
  design.lead final sign-off on shipped result vs. Phase 2 approved direction
```

Orchestrator reports to the human owner at the end of each phase with a short summary + link to deliverables. **Approval mode is set by the owner:** by default the orchestrator pauses for sign-off at each phase boundary; once the owner gives a standing "go ahead," the orchestrator runs phases **autonomously** and these become status updates rather than gates. Either way it interrupts early only when an agent hits the rework cap (§4) or a decision is genuinely the owner's (§0.2 — real content, positioning, product calls).

**Solo-operator adaptation:** `design.lead` is a review/judgment role. In a small run the orchestrator (same top-tier model) MAY play `design.lead` directly instead of spawning a separate agent, provided the review is still written to `deliverables/design.lead/review-log.md`. This keeps parallel fleets small (§0.7) and reduces session-limit exposure without losing the review gate.

---

## 3. Model Routing

| Agent | Suggested model | Why |
|---|---|---|
| orchestrator | Opus (or top-tier) | sequencing + judgment calls across phases |
| design.lead | Opus (or top-tier) | review quality is the entire point of this role |
| researcher.ux, researcher.marketer | Sonnet (mid-tier) | research synthesis, search-heavy |
| design.ui, design.motion, design.brand | Sonnet (mid-tier) | spec-writing, well-defined scope |
| build.architect | Sonnet (mid-tier) | structural decisions, moderate complexity |
| build.dev | Sonnet, Haiku for boilerplate | implementation |
| build.qa | Haiku (fast/cheap tier) | checklist-driven testing against defined metrics |

Adjust to whatever model tiers are actually available in your environment — the principle is: reasoning-and-judgment roles get the strongest model, well-scoped execution roles get a cheaper one.

---

## 4. Review Protocol (Autonomous Loop)

This runs with **no human checkpoint by default** — design.lead has full authority to approve or reject, and rejected work is automatically requeued to the submitting agent. The cap and escalation path below exist specifically because this loop is unsupervised.

1. Submitting agent produces output → writes to its `/deliverables/<agent>/` path → notifies design.lead via orchestrator.
2. `design.lead` reviews against:
   - Consistency with the approved Phase 2 direction (once locked)
   - Naming/content/terminology consistency (§0.3)
   - The no-fabrication rule (§0.2)
   - Craft bar consistent with whatever quality precedent exists for this project
3. **Reject** → design.lead writes specific, actionable feedback to `/deliverables/<agent>/review-log.md` — cite exactly what fails and why, never a vague "make it better." Submitting agent revises and resubmits.
4. **Loop cap: 3 rejections per deliverable.** On the 3rd rejection:
   - design.lead writes `/deliverables/<agent>/escalation.md` stating the unresolved disagreement plainly — what it wants vs. what it's getting, and why the gap hasn't closed.
   - Orchestrator surfaces this to the human owner directly rather than looping a 4th time. This is the only mid-phase interrupt permitted — it exists to prevent either an infinite loop or design.lead quietly waving through something substandard under pressure.
5. **Approve** → orchestrator advances to the next step in the phase sequence.

---

## 5. Directory Structure

```
/deliverables/
  researcher.ux/findings.md
  researcher.marketer/findings.md
  design.lead/review-log.md          (running log across all reviews)
  design.ui/component-spec.md
  design.motion/motion-spec.md
  design.brand/identity-spec.md
  build.architect/architecture.md
  build.qa/report.md
  _escalations/                       (only populated if loop cap hit)
```

---

## 6. Usage

Drop this file at the root of any project. Start a session with:

```
Read WORKFLOW.md. Act as ORCHESTRATOR.
```

To run a single phase only (e.g. research first, review before committing to design work):

```
Read WORKFLOW.md. Act as ORCHESTRATOR. Run Phase 1 only, then stop and report.
```

To invoke a single agent directly (e.g. you already have design direction and just want a motion spec):

```
Read WORKFLOW.md. Act as design.motion. [task]
```

To scope the whole run to a specific part of a project rather than the entire thing, say so up front:

```
Read WORKFLOW.md. Act as ORCHESTRATOR. Scope: only the /pricing and /contact pages.
```
