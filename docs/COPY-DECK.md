# Studiodota.net — Copy Deck

> Role: Content Writer (`AGENTS.md` §13). Governed by the GLOBAL CONTRACT.
> Source of truth: `docs/PROJECT-BRIEF.md`; requirements: `docs/SRS.md`.
> Site is **English only** (`docs/PROJECT-BRIEF.md:24`, `docs/SRS.md:66-67` NG-4) — the §13
> bilingual EN/BN column is intentionally omitted; a `BN` column is out of scope.
> Version: 1.1 — 2026-07-14 (critique iteration 1: applied rulings R2, R3, R8, R10, R13, R14)

---

## 0. How to read this deck

- **key** — a stable slug the frontend/CMS can bind to. Grouped by page/section.
- **context / where** — where the string appears in the UI.
- **EN copy** — final, usable English copy. No lorem ipsum.
- **max chars** — the maximum character budget I recommend for that slot (spaces
  included). Every EN string in this deck fits inside its own budget. These are
  **content constraints proposed by Content**; the definitive slot widths are a
  UI/UX decision (`docs/SRS.md:433` Q-2). Where UI/UX sets a tighter slot,
  escalate rather than overrun.

**Placeholder notice.** Per the task, Services descriptions and project blurbs are
written **placeholder-realistic** for an arch-viz studio. They are believable, on-brand,
and immediately usable, but they are **not** confirmed studio facts. Real service names,
the project taxonomy, and case-study specifics are open (`docs/SRS.md:427-449` Q-2, Q-3,
Q-6, Q-8). Everything invented for realism is listed under `ASSUMPTIONS`. Nothing here
should be read as a confirmed requirement.

---

## 1. TONE / HOUSE VOICE

Direction from the brief: **cinematic, luxury, technically credible**
(`docs/PROJECT-BRIEF.md:12`), mood references loftthirtyone.com / findrealestate.com /
vaulk.com (`docs/PROJECT-BRIEF.md:61-70`).

House voice = **cinematic, confident, understated luxury.**

- **Cinematic** — copy sets a scene before it makes a claim. Short lines, generous
  silence, a sense of scale and light.
- **Confident** — declarative. We state what we do; we do not plead for the work.
- **Understated luxury** — no exclamation marks, no hype adjectives ("amazing",
  "stunning", "cutting-edge", "world-class"). Restraint reads as expensive.
- **Technically credible** — we know render pipelines, light, materials, and
  architecture. The blueprint/wireframe section speaks in precise, monospaced,
  engineer-adjacent language.

Do: "We build the image before the building exists." / "Light, material, and time,
resolved frame by frame." Don't: "Stunning 3D visuals that will blow you away!"

Sentence case for body and most headlines. Buttons are **verbs**. One idea per line.

---

## 2. HERO — HOME 1 (`/`, image-sequence scrub) and HOME 2 (`/home-2`, video)

Both variants share the body (`docs/SRS.md:275-278` AC-10); only the hero differs.
The hero copy below is written to overlay cinematic motion — kept short so it never
competes with the render. Home 1 and Home 2 use the **same hero text**; only the
background technique differs (scrub vs. loop) — this keeps the two variants a true
A/B of the media, not the message.

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `hero.eyebrow` | Small label above hero headline (both variants) | Architectural CGI & rendering studio | 40 |
| `hero.headline` | Primary hero headline, overlaid on scrub/video | We build the image before the building exists. | 60 |
| `hero.subhead` | One line beneath headline | Cinematic architectural visualization — light, material, and time, resolved frame by frame. | 110 |
| `hero.cta.primary` | Primary hero button → `/projects` | View the work | 20 |
| `hero.cta.secondary` | Secondary hero link → `/contact` | Start a project | 20 |
| `hero.scroll.hint` | Scroll affordance under hero (Home 1 scrub) | Scroll to enter | 20 |
| `hero.preloader.label` | Loading label during hero preload (ref loftthirtyone % gate) | Rendering | 16 |
| `hero.preloader.enter` | Enter-gate button after preload completes | Enter | 12 |
| `hero.h1.poster.alt` | Alt text for Home 1 hero poster (the LCP image, shown before/instead of the scrub — R5, R13) | Dusk render of a cliffside concrete residence, warm interior light behind full-height glass | 120 |
| `hero.h2.poster.alt` | Alt text for Home 2 video poster / fallback frame | Aerial render of a moonlit concrete residence above still water | 120 |
| `hero.reduced.note` | Shown to `prefers-reduced-motion` users in place of motion (SRS EC-6) | Motion reduced. A single frame is shown in place of the sequence. | 90 |

---

## 3. NAVIGATION + MEGA-MENU

Sticky top nav (`docs/SRS.md:117-118` FR-2). Two mega-menu parents: **Projects** (by
category/type) and **Services** (by offering) (`docs/SRS.md:120-123` FR-3). Mobile nav
collapses below breakpoint (`docs/SRS.md:124-128` FR-4).

> **Open dependency.** The exact **project categories** and **service offerings** are
> unresolved (`docs/SRS.md:447-449` Q-8). The mega-menu group labels below are
> **placeholder-realistic** and must be reconciled with the confirmed taxonomy before
> launch. Do not treat them as final.

### 3.1 Top-level nav labels

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `nav.brand` | Wordmark / logo text (until Figma logo lands, `docs/PROJECT-BRIEF.md:75-77`) | Studiodota | 16 |
| `nav.projects` | Top nav item (mega-menu parent) | Projects | 14 |
| `nav.services` | Top nav item (mega-menu parent) | Services | 14 |
| `nav.about` | Top nav item | Studio | 14 |
| `nav.journal` | Top nav item | Journal | 14 |
| `nav.contact` | Top nav item / CTA | Contact | 14 |
| `nav.cta` | Persistent nav CTA button → `/contact` | Start a project | 18 |
| `nav.menu.open` | Mobile toggle, closed state (aria-label) | Open menu | 16 |
| `nav.menu.close` | Mobile toggle, open state (aria-label) | Close menu | 16 |

### 3.2 Projects mega-menu (grouped by category/type — PLACEHOLDER taxonomy)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `megamenu.projects.title` | Mega-menu section heading | By discipline | 24 |
| `megamenu.projects.residential` | Category link | Residential | 24 |
| `megamenu.projects.commercial` | Category link | Commercial & workplace | 28 |
| `megamenu.projects.hospitality` | Category link | Hospitality & leisure | 28 |
| `megamenu.projects.masterplan` | Category link | Masterplanning & urban | 28 |
| `megamenu.projects.interior` | Category link | Interiors | 24 |
| `megamenu.projects.film` | Category link | Film & animation | 24 |
| `megamenu.projects.viewall` | Footer link of mega-menu → `/projects` | View all projects | 24 |
| `megamenu.projects.feature.label` | Label above featured render tile in menu | Featured | 16 |
| `megamenu.projects.feature.cta` | CTA on featured tile | See the case study | 24 |

### 3.3 Services mega-menu (grouped by offering — PLACEHOLDER offerings)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `megamenu.services.title` | Mega-menu section heading | What we make | 24 |
| `megamenu.services.stills` | Offering link | Still renders | 24 |
| `megamenu.services.animation` | Offering link | Film & animation | 24 |
| `megamenu.services.interactive` | Offering link | Interactive & real-time | 28 |
| `megamenu.services.vr` | Offering link | Immersive & VR | 24 |
| `megamenu.services.artdirection` | Offering link | Art direction | 24 |
| `megamenu.services.viewall` | Footer link of mega-menu → `/services` | Explore all services | 26 |

---

## 4. HOME BODY (shared by `/` and `/home-2`)

> **Open dependency (do not treat as requirement).** The definitive section list and
> order of the shared home body is a UI/UX decision and is **not enumerated** in the
> brief (`docs/SRS.md:431-433` Q-2, `docs/SRS.md:459-461` A-4). The sections below are
> derived from the mandated elements — featured projects (`docs/SRS.md:169-171` FR-18)
> and the single blueprint/wireframe section (`docs/SRS.md:165-168` FR-17) — plus the
> reference flow (findrealestate: Why → Mission → 3-step → Testimonials → Services,
> `docs/PROJECT-BRIEF.md:64-67`). Treat this as **copy ready to map** once UI/UX
> finalizes the layout; unused sections cost nothing and can be dropped.

### 4.1 Positioning / intro band

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.intro.eyebrow` | Small label above intro headline | The studio | 24 |
| `home.intro.headline` | Large scroll-reveal headline (ref findrealestate giant headline) | Renders that let a client walk through a decision before the first stone is laid. | 100 |
| `home.intro.body` | Supporting paragraph | Studiodota is an architectural CGI studio. We turn drawings, models, and intent into images that feel photographed — so architects, developers, and brands can sell a space, test a design, and see the light land before anyone breaks ground. | 320 |
| `home.intro.cta` | Link → `/about` | About the studio | 22 |

### 4.2 Clip-masked wordmark moment (ref findrealestate image-filled text)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.wordmark.text` | Large word the render clip-masks into on scroll | LIGHT | 12 |
| `home.wordmark.caption` | Caption under the masked wordmark | Everything we make begins with where the light falls. | 70 |

### 4.3 Featured projects (FR-18)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.featured.eyebrow` | Section label | Selected work | 24 |
| `home.featured.headline` | Section headline | A short reel of recent frames. | 60 |
| `home.featured.body` | Section intro | A handful of the projects we've rendered lately — residences, towers, and interiors, each a single decision made visible. | 160 |
| `home.featured.cta` | Link → `/projects` | View all projects | 24 |
| `home.featured.card.cta` | Per-card link → `/projects/[slug]` | View case study | 20 |

### 4.4 Approach / three-step (ref findrealestate 3-step)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.process.eyebrow` | Section label | How we work | 24 |
| `home.process.headline` | Section headline | Three moves from model to final frame. | 60 |
| `home.process.step1.title` | Step 1 title | 01 — Read the intent | 28 |
| `home.process.step1.body` | Step 1 body | We start with your drawings, references, and the feeling you're after. Site, sun path, materials, mood — before a single pixel is placed. | 180 |
| `home.process.step2.title` | Step 2 title | 02 — Build the light | 28 |
| `home.process.step2.body` | Step 2 body | We model, texture, and light the scene, then share early frames while the big decisions are still cheap to change. | 180 |
| `home.process.step3.title` | Step 3 title | 03 — Resolve the frame | 28 |
| `home.process.step3.body` | Step 3 body | We finish at full resolution — grade, composite, and deliver stills, film, or interactive scenes ready to publish. | 180 |

### 4.5 Technical / blueprint-wireframe section (FR-17 — SOLE location for `--blueprint`)

Monospaced annotation voice (`docs/SRS.md:283-285` AC-13). This is the one place the
copy is allowed to sound like an engineer.

> **Slot map (R14).** This section is modeled on the Home singleton as exactly these
> fields (`docs/PROJECT-BRIEF.md:110-112`): `wireframeEyebrow`, `wireframeHeading`,
> `wireframeBody`, `wireframeAnnotations[]` (each = **label + description**), and
> `wireframeCaption`. The copy below maps 1:1 to those slots — one eyebrow, one heading,
> one body, **four** annotation entries (label + description), and one caption. No extra
> or missing slots.

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.blueprint.eyebrow` | Mono label → `wireframeEyebrow` | // TECHNICAL BREAKDOWN | 32 |
| `home.blueprint.heading` | Section heading → `wireframeHeading` | Under every render is a real model. | 60 |
| `home.blueprint.body` | Section body → `wireframeBody` | We don't fake geometry. Every frame resolves from accurate architecture — true scale, true materials, physically-based light. | 200 |
| `home.blueprint.anno.1.label` | Annotation 1 label → `wireframeAnnotations[0].label` (mono) | GEOMETRY | 16 |
| `home.blueprint.anno.1.desc` | Annotation 1 description → `wireframeAnnotations[0].description` (mono) | True-to-scale model, cm-accurate. | 48 |
| `home.blueprint.anno.2.label` | Annotation 2 label → `wireframeAnnotations[1].label` (mono) | MATERIALS | 16 |
| `home.blueprint.anno.2.desc` | Annotation 2 description → `wireframeAnnotations[1].description` (mono) | Measured PBR, real roughness & IOR. | 48 |
| `home.blueprint.anno.3.label` | Annotation 3 label → `wireframeAnnotations[2].label` (mono) | LIGHTING | 16 |
| `home.blueprint.anno.3.desc` | Annotation 3 description → `wireframeAnnotations[2].description` (mono) | Sun-path aligned, physically based. | 48 |
| `home.blueprint.anno.4.label` | Annotation 4 label → `wireframeAnnotations[3].label` (mono) | OUTPUT | 16 |
| `home.blueprint.anno.4.desc` | Annotation 4 description → `wireframeAnnotations[3].description` (mono) | Up to 8K stills · 4K film · real-time. | 48 |
| `home.blueprint.caption` | Small print under diagram → `wireframeCaption` (mono) | Values shown are indicative of a typical delivery, not a fixed spec. | 90 |

### 4.6 Testimonials / trust band (ref findrealestate testimonials)

> **Placeholder.** No real client quotes have been provided. The quotes below are
> **fictional placeholders** to hold the layout and demonstrate voice. **Do not publish
> as real testimonials** — replace with attributed, permissioned quotes, or cut the
> section (`ASSUMPTIONS`).

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.trust.eyebrow` | Section label | In their words | 24 |
| `home.trust.headline` | Section headline | The frame arrived, and the room sold itself. | 60 |
| `home.trust.quote1` | Placeholder quote 1 | "They rendered a building we hadn't finished designing, and it still felt honest. Buyers understood the space instantly." | 160 |
| `home.trust.quote1.attr` | Attribution (placeholder) | Development director, [Client TBD] | 40 |
| `home.trust.quote2` | Placeholder quote 2 | "The light was right. That sounds small. It is the whole thing." | 160 |
| `home.trust.quote2.attr` | Attribution (placeholder) | Principal architect, [Client TBD] | 40 |

### 4.7 Closing CTA band

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `home.cta.headline` | Full-width closing headline | Have a building that doesn't exist yet? | 60 |
| `home.cta.body` | Supporting line | Send us the drawings and the deadline. We'll send back the light. | 90 |
| `home.cta.button` | Button → `/contact` | Start a project | 20 |

---

## 5. PROJECTS — `/projects` (gallery) and `/projects/[slug]` (case study)

### 5.1 Gallery `/projects`

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `projects.meta.title` | `<title>` (FR-6) | Projects — Studiodota | 60 |
| `projects.meta.desc` | Meta description | Selected architectural renders and CGI films by Studiodota — residences, towers, interiors, and masterplans, resolved frame by frame. | 160 |
| `projects.hero.eyebrow` | Page eyebrow | The work | 24 |
| `projects.hero.headline` | Page headline | Buildings, before they were built. | 60 |
| `projects.hero.subhead` | Page subhead | A gallery of frames from recent projects. Filter by discipline, or scroll the whole reel. | 120 |
| `projects.filter.label` | Filter control label | Filter by discipline | 28 |
| `projects.filter.all` | Default filter chip (shows everything) | All work | 16 |
| `projects.card.cta` | Card link → detail | View case study | 20 |
| `projects.count` | Result count, e.g. "12 projects" ({n} = number) | {n} projects | 20 |
| `projects.count.one` | Singular result count | 1 project | 20 |

### 5.2 Case study `/projects/[slug]`

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `project.meta.title.tpl` | `<title>` template ({title} from CMS) | {title} — Studiodota | 70 |
| `project.section.brief` | Section label above the brief | The brief | 24 |
| `project.section.approach` | Section label | Our approach | 24 |
| `project.section.gallery` | Section label above image set | The frames | 24 |
| `project.meta.client` | Metadata field label | Client | 16 |
| `project.meta.location` | Metadata field label | Location | 16 |
| `project.meta.year` | Metadata field label | Year | 16 |
| `project.meta.discipline` | Metadata field label | Discipline | 16 |
| `project.meta.services` | Metadata field label | Services | 16 |
| `project.meta.deliverables` | Metadata field label | Deliverables | 16 |
| `project.next.label` | "Next project" nav label | Next project | 20 |
| `project.back` | Back link → `/projects` | Back to all work | 24 |
| `project.cta.headline` | End-of-case CTA | Want frames like these for your project? | 60 |
| `project.cta.button` | Button → `/contact` | Start a project | 20 |

### 5.3 Sample project blurbs (PLACEHOLDER — 4 samples)

> **Placeholder.** Fictional projects invented for realism and layout. Not real
> Studiodota work. Replace with actual case studies from Strapi. Each blurb is written
> to two lengths: a **card** version (gallery/home tile) and a **detail intro** version
> (top of the case-study page).

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `sample.p1.title` | Project 1 title | Halden House | 40 |
| `sample.p1.discipline` | Discipline label (Category, not a tag — R3) | Residential | 24 |
| `sample.p1.card` | Gallery card blurb | A cliffside residence rendered at dusk — board-formed concrete, black steel, and a pool that spills into the horizon. | 130 |
| `sample.p1.detail` | Case-study intro paragraph | A single-family house perched on a Nordic cliff, designed to disappear into the rock by day and glow from within at night. We rendered Halden House across a full day cycle so the client could choose the hour that sold the view. Twelve stills, one 30-second film, dusk as the hero frame. | 340 |
| `sample.p2.title` | Project 2 title | Meridian Tower | 40 |
| `sample.p2.discipline` | Discipline label (Category, not a tag — R3) | Commercial & workplace | 28 |
| `sample.p2.card` | Gallery card blurb | A 40-storey office tower at street level and skyline scale — glass, brise-soleil, and a lobby that reads as a public room. | 130 |
| `sample.p2.detail` | Case-study intro paragraph | Meridian Tower needed to convince a leasing committee before excavation began. We built the facade at true detail — every mullion, every shadow the brise-soleil throws across the floorplate — then rendered the tower from the pavement, the neighbouring roof, and the approach road. The lobby got its own set of frames: a public room, not a foyer. | 360 |
| `sample.p3.title` | Project 3 title | The Salt Rooms | 40 |
| `sample.p3.discipline` | Discipline label (Category, not a tag — R3) | Hospitality & leisure | 28 |
| `sample.p3.card` | Gallery card blurb | A coastal spa in warm stone and low light — steam, water, and lime plaster rendered close enough to feel humid. | 130 |
| `sample.p3.detail` | Case-study intro paragraph | A boutique spa on a working harbour, where the whole experience is atmosphere. Renders had to carry humidity, warmth, and quiet. We leaned on volumetric light through steam, measured lime-plaster materials, and a palette that never rises above a whisper. Interiors first, then a single exterior at blue hour to place it on the coast. | 360 |
| `sample.p4.title` | Project 4 title | Rivergate Masterplan | 40 |
| `sample.p4.discipline` | Discipline label (Category, not a tag — R3) | Masterplanning & urban | 28 |
| `sample.p4.card` | Gallery card blurb | A riverside district shown from the air and the pavement — six blocks, a promenade, and thirty years of trees rendered on day one. | 140 |
| `sample.p4.detail` | Case-study intro paragraph | Rivergate is a phased regeneration of a former industrial waterfront. The challenge of a masterplan is time: selling a place that won't be complete for a decade. We rendered it mature — grown trees, worn pavement, a promenade already busy — from an aerial that reads the whole district and eye-level frames that make one corner feel like a place you already know. | 380 |

---

## 6. SERVICES — `/services`

> **Placeholder-realistic.** Service names and descriptions below are standard for an
> arch-viz studio and are written ready-to-use, but the confirmed offering set is open
> (`docs/SRS.md:447-449` Q-8). Reconcile with the Services mega-menu (§3.3) and the
> confirmed taxonomy before launch.

### 6.1 Page frame

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `services.meta.title` | `<title>` | Services — Studiodota | 60 |
| `services.meta.desc` | Meta description | Architectural visualization services from Studiodota — still renders, CGI film, interactive scenes, VR, and art direction. | 160 |
| `services.hero.eyebrow` | Page eyebrow | What we make | 24 |
| `services.hero.headline` | Page headline | Every service is one thing: the space, made believable. | 70 |
| `services.hero.subhead` | Page subhead | From a single hero still to a real-time walkthrough — pick the medium; the craft underneath is the same. | 130 |
| `services.cta.headline` | Closing CTA | Not sure which one you need? | 50 |
| `services.cta.body` | Closing CTA body | Tell us about the project. We'll tell you the shortest path to the frame you need. | 100 |
| `services.cta.button` | Button → `/contact` | Talk to the studio | 22 |

### 6.2 Service entries (placeholder descriptions)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `service.stills.name` | Service title | Still renders | 30 |
| `service.stills.short` | One-line summary (card) | The hero image. Photoreal architecture, one perfect frame at a time. | 90 |
| `service.stills.body` | Full description | Our core craft: high-resolution architectural stills that read as photography. Exterior and interior, day through dusk, up to 8K. We deliver the frames marketing, planning, and sales teams put on the cover — composed, graded, and finished. | 320 |
| `service.animation.name` | Service title | Film & animation | 30 |
| `service.animation.short` | One-line summary | The building in motion — camera moves, light shifts, the space unfolds. | 90 |
| `service.animation.body` | Full description | CGI films that move a viewer through a space before it exists. Flythroughs, reveals, and cinematic sequences with real camera language, animated light, and sound design. Delivered up to 4K, cut to length, ready for launch, pitch, or screen. | 320 |
| `service.interactive.name` | Service title | Interactive & real-time | 30 |
| `service.interactive.short` | One-line summary | A scene the client can steer — explore the design, not just watch it. | 90 |
| `service.interactive.body` | Full description | Real-time environments a client can walk through on their own terms. Change the finish, the hour, the viewpoint — the render responds. Built for sales suites, pitches, and configurators where a fixed frame isn't enough. | 320 |
| `service.vr.name` | Service title | Immersive & VR | 30 |
| `service.vr.short` | One-line summary | Stand inside the space at full scale, before it's built. | 90 |
| `service.vr.body` | Full description | Headset-ready experiences that put a client inside the room at true scale. Sense the ceiling height, the reach of daylight, the distance to the window. Ideal for design review and for selling spaces where scale is the whole argument. | 320 |
| `service.artdirection.name` | Service title | Art direction | 30 |
| `service.artdirection.short` | One-line summary | Before the render: the mood, the light, the story of the frame. | 90 |
| `service.artdirection.body` | Full description | The decisions that happen before the pixels. We shape the mood, the palette, the hour, and the story each frame tells — so a set of images reads as one considered campaign, not a folder of outputs. Available on its own or with any production. | 320 |

---

## 7. ABOUT / STUDIO — `/about`

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `about.meta.title` | `<title>` | Studio — Studiodota | 60 |
| `about.meta.desc` | Meta description | Studiodota is an architectural CGI studio building photoreal renders, film, and immersive scenes for architects, developers, and brands. | 160 |
| `about.hero.eyebrow` | Page eyebrow | The studio | 24 |
| `about.hero.headline` | Page headline | We photograph buildings that haven't been built. | 70 |
| `about.lead` | Lead paragraph | Studiodota is an architectural visualization studio. We work in the gap between a drawing and a finished building — the long, expensive stretch where a design has to be sold, tested, and believed before anyone can stand inside it. Our job is to close that gap with a single, honest image. | 340 |
| `about.narrative.h1` | Sub-heading | What we actually do | 40 |
| `about.narrative.body1` | Narrative paragraph | We take architecture — models, drawings, a mood, sometimes just an intention — and we resolve it into frames that feel photographed. Not decorated. Not exaggerated. We model to true scale, measure our materials, and align the light to the real sun. The result looks like a photograph because, underneath, it behaves like one. | 360 |
| `about.narrative.h2` | Sub-heading | Why it matters | 40 |
| `about.narrative.body2` | Narrative paragraph | A render is rarely the point. The point is the decision it unlocks — a board that approves the massing, a buyer who commits off-plan, an architect who sees the flaw while it's still cheap to fix. We make images that carry the weight of those decisions, and we make them calmly, on time, at the resolution the moment needs. | 380 |
| `about.principles.title` | Section heading | How we think | 40 |
| `about.principle1.title` | Principle 1 | Truth over spectacle | 30 |
| `about.principle1.body` | Principle 1 body | A render should flatter the design, not lie about it. We'd rather lose the wow than break the trust. | 130 |
| `about.principle2.title` | Principle 2 | Light is the subject | 30 |
| `about.principle2.body` | Principle 2 body | Materials matter, geometry matters — but the image is made or lost by where the light falls and when. | 130 |
| `about.principle3.title` | Principle 3 | Quiet, on time | 30 |
| `about.principle3.body` | Principle 3 body | Cinematic work made without drama. Clear timelines, early frames, no surprises on delivery day. | 130 |
| `about.stats.projects` | Stat label (value from CMS/TBD) | Projects delivered | 24 |
| `about.stats.years` | Stat label | Years behind the lens | 24 |
| `about.stats.resolution` | Stat label | Max delivery resolution | 24 |
| `about.cta.headline` | Closing CTA | Bring us the building. | 50 |
| `about.cta.button` | Button → `/contact` | Start a project | 20 |

> **Placeholder.** `about.stats.*` values (project count, years active, resolution) are
> facts we do not have — leave the numbers to the studio, or cut the stat band
> (`ASSUMPTIONS`). "Max delivery resolution" pairs with the "up to 8K" claim used in
> Services; keep the two consistent.

---

## 8. JOURNAL — `/journal` and `/journal/[slug]`

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `journal.meta.title` | `<title>` | Journal — Studiodota | 60 |
| `journal.meta.desc` | Meta description | Notes from Studiodota on light, materials, and the craft of architectural rendering — process, breakdowns, and the occasional opinion. | 160 |
| `journal.hero.eyebrow` | Page eyebrow | Journal | 24 |
| `journal.hero.headline` | Page headline | Notes from behind the render. | 60 |
| `journal.hero.intro` | Journal intro paragraph | Process, breakdowns, and thinking out loud — how we light a scene, choose an hour, and decide when an image is finished. Written for people who care how the frame was made. | 200 |
| `journal.card.readmore` | Card link → post | Read the note | 20 |
| `journal.card.readtime.tpl` | Reading time ({n} = minutes) | {n} min read | 16 |
| `journal.post.back` | Back link → `/journal` | Back to the journal | 24 |
| `journal.post.published.tpl` | Published date label ({date} from CMS) | Published {date} | 30 |
| `journal.post.meta.title.tpl` | `<title>` template ({title} from CMS) | {title} — Studiodota Journal | 80 |
| `journal.post.next` | Next-post link label | Next note | 20 |

---

## 9. CONTACT — `/contact`

Field set assumed (`docs/SRS.md:466-468` A-7; pending Q-3, `docs/SRS.md:434`): Name,
Email, Message required; Company, Project-type optional. Copy for all is included; drop
any field UI/UX/PM cut.

### 9.1 Page + form labels

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `contact.meta.title` | `<title>` | Contact — Studiodota | 60 |
| `contact.meta.desc` | Meta description | Start a project with Studiodota. Send us the drawings and the deadline — we'll send back the light. | 160 |
| `contact.hero.eyebrow` | Page eyebrow | Contact | 24 |
| `contact.hero.headline` | Page headline | Send us the drawings and the deadline. | 60 |
| `contact.hero.intro` | Intro paragraph | Tell us what you're building and when you need to show it. The more you share — plans, references, the feeling you're after — the sharper our first reply. | 220 |
| `contact.field.name.label` | Name field label | Your name | 24 |
| `contact.field.name.placeholder` | Name placeholder | Jane Architect | 30 |
| `contact.field.email.label` | Email field label | Email | 24 |
| `contact.field.email.placeholder` | Email placeholder | you@studio.com | 30 |
| `contact.field.company.label` | Company field label (optional) | Company or practice (optional) | 40 |
| `contact.field.company.placeholder` | Company placeholder | Studio, developer, or agency | 40 |
| `contact.field.projecttype.label` | Project-type field label (optional) | Project type (optional) | 40 |
| `contact.field.projecttype.placeholder` | Select placeholder | Select a discipline | 30 |
| `contact.field.message.label` | Message field label | About the project | 24 |
| `contact.field.message.placeholder` | Message placeholder | What are you building, and when do you need to show it? | 80 |
| `contact.field.required.hint` | Required-field marker legend | Required | 20 |
| `contact.consent.label` | Required consent checkbox before submit (R2). Links "privacy policy" → `/privacy` | I agree to the privacy policy. | 40 |
| `contact.consent.note` | Short storage notice under the consent checkbox (R2) | We store your inquiry so we can reply, and delete it after 180 days. | 90 |
| `contact.submit` | Submit button (verb) | Send the brief | 20 |
| `contact.submit.loading` | Submit button, in-flight (FR-35) | Sending… | 20 |
| `contact.honeypot.label` | Hidden honeypot label (spam trap, FR-38; visually hidden) | Leave this field empty | 30 |
| `contact.alt.email.label` | Fallback direct-email label | Prefer email? | 24 |
| `contact.alt.email.value` | Studio email (VALUE TBD — Q-6) | [studio email — TBD] | 40 |
| `contact.response.note` | Expectation-setting microcopy under form | We read every message and reply within two business days. | 90 |

### 9.2 Success state (FR-36 / AC-27)

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `contact.success.title` | Success heading | Your brief is with us. | 40 |
| `contact.success.body` | Success body | Thank you — we've received your message and we'll reply within two business days. If it's urgent, reply to the confirmation and mark it so. | 180 |
| `contact.success.again` | Link to send another | Send another message | 28 |

> **Assumption.** "We'll reply within two business days" and "we read every message"
> are response-time promises the studio must be able to keep. Confirm the SLA, or soften
> to "as soon as we can" (`ASSUMPTIONS`). A confirmation/auto-reply email is **not**
> confirmed as in scope (`docs/SRS.md:440-442` Q-6) — the success copy references replying
> to a "confirmation", which only holds if an acknowledgement email exists. If no auto-reply
> is built, change to "reply to this thread" wording. Escalated.

### 9.3 Contact form — ERROR MESSAGES

Format per §13: **what happened | why | what to do.** Never blames the user, never
"Something went wrong." Field errors are terse (shown inline next to the field); form-
level errors carry the full three-part message.

**Field-level (inline, adjacent to field — FR-32 / AC-25, FR-33 / AC-26):**

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `contact.err.name.required` | Name empty on submit | Add your name so we know who we're replying to. | 70 |
| `contact.err.email.required` | Email empty on submit | Add an email so we can reply. | 60 |
| `contact.err.email.format` | Email fails format check | That email doesn't look complete — check for a typo (e.g. name@studio.com). | 90 |
| `contact.err.message.required` | Message empty on submit | Tell us a little about the project before you send. | 70 |
| `contact.err.message.toolong.tpl` | Message over max length (EC-8; {max} = limit) | That's over the {max}-character limit — trim it or send the rest in a follow-up. | 100 |
| `contact.err.projecttype.invalid` | Project-type not in allowed set | Choose a project type from the list, or leave it blank. | 70 |
| `contact.err.consent.required` | Consent checkbox not ticked on submit (R2) | Please agree to the privacy policy so we can store and reply to your message. | 90 |

**Form-level (banner above/below the form — three-part: what | why | what to do):**

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `contact.err.form.invalid.title` | Blocked submit, fields invalid | Check the highlighted fields | 40 |
| `contact.err.form.invalid.body` | Body | Your message wasn't sent — a few fields need attention. Fix the highlighted fields above, then send again. | 160 |
| `contact.err.send.title` | Server/network failure on send (FR-37 / AC-29 / EC-5) | Your message didn't send | 40 |
| `contact.err.send.body` | Body | We couldn't reach the studio just now, so nothing was sent — your text is still here. Check your connection and press "Send the brief" again. If it keeps failing, email us directly. | 220 |
| `contact.err.ratelimited.title` | Rate-limit / spam guard trips (FR-38 / AC-30) | You've sent that a few times | 40 |
| `contact.err.ratelimited.body` | Body | We've paused new messages from here for a moment to keep out spam — nothing you sent was lost. Wait a minute, then try once more, or email us directly if it's urgent. | 220 |
| `contact.err.server.title` | Server 5xx / unexpected server error | Something on our end slipped | 40 |
| `contact.err.server.body` | Body | Your message didn't send — the fault is ours, not yours, and your text is still here. Give it a minute and press send again; if it persists, email us directly and we'll pick it up. | 220 |

---

## 9B. PRIVACY POLICY — `/privacy` (R2)

New page added by the R2 ruling (`docs/PROJECT-BRIEF.md:87-88,115`): the contact form now
persists a `ContactSubmission` (PII at rest) with a 180-day auto-purge, so a privacy policy
and a consent checkbox are required. Copy below is the page frame plus the substantive
sections a contact-only marketing site needs. It states plainly what is collected, why, how
long it is kept, and how to have it removed.

> **Legal-review flag.** This is plain-language policy copy written to be accurate to the
> R2 data decisions (fields stored, 180-day retention, email delivery). It is **not legal
> advice** and must be reviewed by the studio / counsel before publish, and the studio
> contact email (`docs/SRS.md:440-442` Q-6) must be filled in. Escalated (`ASSUMPTIONS`).

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `privacy.meta.title` | `<title>` (FR-6) | Privacy Policy — Studiodota | 60 |
| `privacy.meta.desc` | Meta description | How Studiodota collects, uses, stores, and deletes the information you send through our contact form. | 160 |
| `privacy.hero.eyebrow` | Page eyebrow | Legal | 24 |
| `privacy.hero.headline` | Page headline | Privacy policy | 40 |
| `privacy.updated.tpl` | Last-updated line ({date} from CMS) | Last updated {date} | 40 |
| `privacy.intro.body` | Opening paragraph | This policy explains what we collect when you contact Studiodota, why we collect it, how long we keep it, and how to ask us to delete it. We keep it short because we collect very little. | 240 |
| `privacy.collect.heading` | Section heading | What we collect | 40 |
| `privacy.collect.body` | Section body | When you use our contact form we collect the details you enter: your name, email address, your message, and — if you add them — your company and project type. We also record limited technical data to prevent spam: a one-way hashed version of your IP address and your browser's user-agent string. | 380 |
| `privacy.use.heading` | Section heading | Why we use it | 40 |
| `privacy.use.body` | Section body | We use what you send only to read your inquiry and reply to it, and to keep the form free of spam and abuse. We do not sell your information, and we do not use it for advertising or send you marketing you didn't ask for. | 300 |
| `privacy.store.heading` | Section heading | How long we keep it | 40 |
| `privacy.store.body` | Section body | Your inquiry is stored securely so we can respond and keep a record of the conversation. We automatically delete contact submissions 180 days after they're received. You can ask us to delete yours sooner at any time. | 300 |
| `privacy.rights.heading` | Section heading | Your choices | 40 |
| `privacy.rights.body` | Section body | You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to delete it. Email us and we'll act on your request. Submitting the contact form is optional — if you'd rather not have anything stored, email us directly instead. | 320 |
| `privacy.contact.heading` | Section heading | Contact us about privacy | 40 |
| `privacy.contact.body.tpl` | Section body ({email} = studio email, Q-6 TBD) | For any question about this policy or your information, email us at {email}. | 140 |
| `privacy.back` | Back link → `/contact` | Back to contact | 24 |

Covers content pages when Strapi is unreachable (`docs/SRS.md:357-362` EC-5,
`docs/SRS.md:438-439` Q-5 — final behavior is an Architect decision; copy is ready for
the "show a defined error page" path). Never renders a raw stack trace.
Three-part where the slot allows.

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `error.fetch.title` | Content failed to load (CMS unreachable) | This page didn't load | 40 |
| `error.fetch.body` | Body | We couldn't load this content just now — it's a connection issue on our side, not anything you did. Refresh the page in a moment, and if it's still blank, try again shortly. | 220 |
| `error.fetch.retry` | Retry button (verb) | Try again | 20 |
| `error.section.inline` | A single section failed while the rest of the page loaded | This section didn't load. Refresh to try again. | 70 |
| `error.404.title` | 404 page heading (FR-23, FR-29) | This frame doesn't exist | 40 |
| `error.404.body` | 404 body | The page you're after has moved or was never here. Nothing's broken — let's get you back to the work. | 160 |
| `error.404.cta.home` | 404 button → `/` | Back to home | 20 |
| `error.404.cta.projects` | 404 link → `/projects` | See the projects | 24 |
| `error.500.title` | 500 page heading | The studio hit a snag | 40 |
| `error.500.body` | 500 body | Something on our end failed to render — it's ours to fix, not yours. Refresh in a moment; if it keeps happening, the contact page always works. | 200 |
| `error.500.cta` | 500 button (verb) | Reload the page | 20 |
| `error.offline.title` | Client detects offline | You're offline | 32 |
| `error.offline.body` | Body | Your device has lost its connection, so this page can't update. Reconnect, and it'll pick up where it left off. | 160 |

---

## 11. EMPTY STATES

Every empty state tells the user why it's empty and what to do (`AGENTS.md` §13 rule 3).

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `empty.projects.title` | `/projects` with zero published projects (EC-1) | The gallery is being hung | 40 |
| `empty.projects.body` | Body | There's no published work here yet. New frames are on the way — in the meantime, tell us what you're building and we'll show you what we can do. | 200 |
| `empty.projects.cta` | Button → `/contact` | Start a project | 20 |
| `empty.projects.filter.title` | Filter returns zero results (valid category, no matches) | Nothing in this discipline yet | 40 |
| `empty.projects.filter.body` | Body | We haven't published work in this category yet. Clear the filter to see everything we've made. | 140 |
| `empty.projects.filter.cta` | Clear-filter button (verb) | Show all work | 20 |
| `empty.journal.title` | `/journal` with zero published posts (FR-30 / AC-24) | The first note is coming | 40 |
| `empty.journal.body` | Body | We haven't published to the journal yet. It's where we'll write about light, materials, and how the frames get made — check back soon. | 200 |
| `empty.journal.cta` | Button → `/projects` | See the work instead | 26 |
| `empty.project.media.caption` | Case study with no images loaded yet (EC-1 partial) | Frames for this project are being finished. | 60 |
| `empty.project.body.note` | Case study with empty body (EC-1 partial) | The write-up for this project is on its way. | 60 |

---

## 12. FOOTER + SHARED MICROCOPY

Footer minimum: wordmark, all top-level links, contact link (`docs/SRS.md:129-132`
FR-5). Social links / address are a UI/UX + Content decision (`docs/SRS.md:457-458` A-3)
— placeholders below, to be confirmed.

| key | context / where | EN copy | max chars |
|---|---|---|---|
| `footer.tagline` | Line under footer wordmark | Architectural CGI studio. We build the image before the building. | 80 |
| `footer.nav.heading` | Footer nav group heading | Explore | 20 |
| `footer.contact.heading` | Footer contact group heading | Start a project | 24 |
| `footer.contact.cta` | Footer CTA → `/contact` | Send us the brief | 24 |
| `footer.social.heading` | Footer social group heading (channels TBD) | Elsewhere | 20 |
| `footer.legal.privacy` | Footer link → `/privacy` (R2) | Privacy policy | 24 |
| `footer.copyright.tpl` | Copyright line ({year} injected) | © {year} Studiodota. All rights reserved. | 60 |
| `footer.backtotop` | Back-to-top control | Back to top | 20 |
| `common.loading` | Generic loading label (aria-live) | Loading | 16 |
| `common.skip` | Skip-to-content link (a11y) | Skip to content | 24 |
| `common.new` | "opens in new tab" (screen-reader) | opens in a new tab | 24 |

---

## 13. TONE NOTES (deviations from house voice)

1. **Blueprint/technical section (§4.5)** deliberately switches register to clipped,
   monospaced, engineer-adjacent copy (`// TECHNICAL BREAKDOWN`, `GEOMETRY / …`). This
   is an intentional deviation mandated by the design (`docs/SRS.md:283-285` AC-13, ref
   vaulk.com) — the contrast with the cinematic body is the point. It is the one place
   numbers and specs are allowed to show.
2. **Error + empty-state copy** trades cinematic restraint for plain-spoken clarity.
   When something fails, warmth and precision beat mood. This follows the §13 rule that
   error copy states what happened and what to do, and never says "Something went wrong."
3. **Placeholder testimonials (§4.6)** are written in the client's imagined voice, not
   the house voice, and are flagged unpublishable. Included only to hold the layout.
4. **CTA verbs** vary intentionally ("Start a project", "Send the brief", "Talk to the
   studio", "View the work") to avoid a single repeated button label across the site
   while staying verb-first per §13.

---

## ASSUMPTIONS

1. **Placeholder taxonomy.** Project categories (§3.2) and service offerings (§3.3, §6)
   are placeholder-realistic, not confirmed. The real taxonomy is open
   (`docs/SRS.md:447-449` Q-8). Mega-menu labels and the `/services` entries must be
   reconciled with the confirmed set before launch. Escalated.
2. **Sample projects (§5.3) are fictional.** "Halden House", "Meridian Tower", "The Salt
   Rooms", and "Rivergate Masterplan" are invented for realism and layout. They are not
   real Studiodota work and must be replaced with actual case studies from Strapi.
3. **Testimonials (§4.6) are fictional placeholders.** No real, attributed, permissioned
   client quotes were provided. Do not publish as real. Replace or cut the section.
4. **`about.stats.*` values (§7)** — project count, years active, and max resolution are
   facts I do not have. Numbers to be supplied by the studio, or cut the stat band.
5. **Home body section list (§4) is provisional.** The definitive sections/order are a
   UI/UX decision, not enumerated in the brief (`docs/SRS.md:431-433` Q-2). Copy is
   written ready-to-map; unused sections can be dropped.
6. **Contact field set (§9)** assumes Name/Email/Message required + optional
   Company/Project-type per `docs/SRS.md:466-468` A-7; pending confirmation
   (`docs/SRS.md:434` Q-3). Copy provided for all fields.
7. **Studio email (`contact.alt.email.value`) is unknown** (`docs/SRS.md:440-442` Q-6).
   Left as `[studio email — TBD]`. Escalated.
8. **Auto-acknowledgement email is not confirmed in scope** (`docs/SRS.md:440-442` Q-6).
   Success copy (§9.2) references replying to a "confirmation"; this only holds if an
   acknowledgement email is built. If not, reword to "reply to this thread". Escalated.
9. **Response-time promise** ("within two business days", §9.1/§9.2) is a commitment the
   studio must be able to keep. Confirm the SLA or soften the wording.
10. **Character budgets are Content proposals**, not confirmed slot widths. Definitive
    slot sizing is a UI/UX call (`docs/SRS.md:431-433` Q-2). Where UI/UX sets a tighter
    limit than the `max chars` here, escalate rather than silently overrun.
11. **Wordmark text = "Studiodota"** as an interim until the Figma logo/brand lands
    (`docs/PROJECT-BRIEF.md:75-77`); brand-name casing/stylization is not finalized.
12. **English only** — the §13 bilingual `BN` column is omitted by design
    (`docs/PROJECT-BRIEF.md:24`, `docs/SRS.md:66-67` NG-4). No RTL/length-variance
    localization concerns apply.
13. **Privacy policy is now in scope (R2).** The `/privacy` page is in the sitemap
    (`docs/PROJECT-BRIEF.md:115`) and its copy is written here (§9B), alongside the required
    consent checkbox and storage notice in §9.1. The copy is plain-language and accurate to
    the R2 data decisions (fields stored, 180-day retention) but is **not legal advice** —
    the studio / counsel must review it and supply the contact email before publish. A
    dedicated cookie policy is only needed if non-essential cookies are added later; the
    current build sets none, so no cookie-banner copy is written. Escalated.
