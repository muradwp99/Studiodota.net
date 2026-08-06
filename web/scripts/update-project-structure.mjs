/**
 * Restructures categories, ordering and section imagery to the client's
 * 2026-08 brief. Everything here is content, not schema.
 *
 * Usage (from web/):
 *   node scripts/update-project-structure.mjs                          # dry run
 *   node scripts/update-project-structure.mjs --apply
 *   node --env-file=.env.prod scripts/update-project-structure.mjs --apply
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const log = [];
const say = (s) => { console.log(s); log.push(s); };

/* ---------------- 1. categories ---------------- */
// Affordable Housing leads; the rest keep their previous relative order; office
// is folded into commercial; ADU and Interior are new. ADU ships with no
// projects on purpose - it appears in the filter bar and shows an empty state.
const CATEGORIES = [
  "affordable-housing",
  "single-family",
  "multifamily",
  "mixed-use",
  "commercial",
  "senior-living",
  "adu",
  "interior",
];

/* ---------------- 2. per-project category + order ---------------- */
// Listed in the order they should appear. Index becomes `sort`, so the
// unfiltered list reads in category order and each filter is correctly ordered
// too. affordable-housing-72 is index 0 => first project on the page.
const ORDER = [
  // --- Affordable Housing (72 first, per brief)
  ["affordable-housing-72", "affordable-housing"],
  ["affordable-housing-77", "affordable-housing"],
  ["affordable-housing-62", "affordable-housing"],
  // --- Single Family (Ball Residence first, Fire Rebuild second)
  ["ball-residence", "single-family"],
  ["fire-rebuild-mckendree-01", "single-family"],
  ["fire-rebuild-mckendree-02", "single-family"],
  ["fire-rebuild-kagawa-st", "single-family"],
  ["fire-rebuild-temecula", "single-family"],
  ["sfr-lot-07", "single-family"],
  ["sfr-lot-08", "single-family"],
  ["sfr-lot-09", "single-family"],
  ["san-pedro-house", "single-family"],
  ["tustin-house", "single-family"],
  ["rollaway-6663", "single-family"],
  // --- Multifamily (Hesperia moved out to Mixed Use)
  ["town-homes-la-habra", "multifamily"],
  ["moreno-valley", "multifamily"],
  ["crenshaw-apartments", "multifamily"],
  ["studio-apartment-158", "multifamily"],
  // --- Mixed Use (114 first: its cover is the dusk rendering)
  ["mixed-use-114", "mixed-use"],
  ["affordable-housing-136", "mixed-use"],
  ["apartments-hesperia", "mixed-use"],
  ["hesperia-47-west", "mixed-use"],
  ["condominium-temple-simi-valley", "mixed-use"],
  // --- Commercial (office folded in)
  ["office-san-diego", "commercial"],
  ["hesperia-commercial", "commercial"],
  ["auto-part-riverside", "commercial"],
  ["truck-servicing-fontana", "commercial"],
  ["cannabis-lounge", "commercial"],
  ["cyclebar", "commercial"],
  ["row-house", "commercial"],
  // --- Senior Living
  ["senior-housing-fontana", "senior-living"],
  // --- Interior
  ["covina-residence", "interior"],
  ["bell-residence-chino", "interior"],
  ["jurien-bay", "interior"],
];

/* ---------------- 3. newly imported projects ---------------- */
const IMPORTED = {
  "ball-residence": 8,
  "fire-rebuild-mckendree-01": 4,
  "fire-rebuild-mckendree-02": 3,
};
const gal = (slug, n) => Array.from({ length: n }, (_, i) => `/projects/${slug}/${String(i + 1).padStart(2, "0")}.webp`);

/* ---------------- 4. imagery ---------------- */
const BALL = (n) => `/projects/ball-residence/${String(n).padStart(2, "0")}.webp`;
const AH72 = (n) => `/projects/affordable-housing-72/${String(n).padStart(2, "0")}.webp`;
const AH136 = (n) => `/projects/affordable-housing-136/${String(n).padStart(2, "0")}.webp`;
const FIRE = (n) => `/projects/fire-rebuild-mckendree-01/${String(n).padStart(2, "0")}.webp`;
const MU114 = (n) => `/projects/mixed-use-114/${String(n).padStart(2, "0")}.webp`;

const check = (p) => existsSync(path.join(path.resolve("public"), p));

/* ================= run ================= */
const projects = await db.project.findMany({ where: { deletedAt: null } });
const bySlug = new Map(projects.map((p) => [p.slug, p]));

say("--- categories ---");
const tax = await db.block.findUnique({ where: { key: "taxonomies" } });
say(`  ${JSON.stringify(tax.data.projectCategories)}`);
say(`  ${JSON.stringify(CATEGORIES)}`);
if (apply) {
  await db.block.update({ where: { key: "taxonomies" }, data: { data: { ...tax.data, projectCategories: CATEGORIES } } });
}

say("\n--- projects ---");
for (let i = 0; i < ORDER.length; i++) {
  const [slug, category] = ORDER[i];
  const p = bySlug.get(slug);
  if (!p) { say(`  !! ${slug} not found`); continue; }
  const data = {};
  if (p.category !== category) data.category = category;
  if (p.sort !== i) data.sort = i;
  if (IMPORTED[slug]) {
    const g = gal(slug, IMPORTED[slug]);
    const bad = g.filter((x) => !check(x));
    if (bad.length) { say(`  !! ${slug} missing ${bad.length} files - skipped`); continue; }
    data.gallery = g;
    data.heroImage = g[0];
    data.interiorImage = g[1] ?? g[0];
    data.published = true;
  }
  if (!Object.keys(data).length) continue;
  const bits = [];
  if (data.category) bits.push(`category ${p.category} -> ${data.category}`);
  if (data.sort !== undefined) bits.push(`sort ${p.sort} -> ${data.sort}`);
  if (data.gallery) bits.push(`+${data.gallery.length} images, published`);
  say(`  ${slug.padEnd(32)} ${bits.join(" | ")}`);
  if (apply) await db.project.update({ where: { id: p.id }, data });
}

say("\n--- section imagery ---");
const blockEdits = {
  // Selected Works: Ball Residence, Affordable Housing, 72 unit, Fire Rebuild
  "home.featured": (d) => {
    const want = [
      { slug: "ball-residence", title: "Ball Residence", location: "Southern California", year: "Single Family", image: BALL(1) },
      { slug: "affordable-housing-136", title: "Affordable Housing - 136 Units", location: "Inglewood, CA", year: "Mixed Use", image: AH136(1) },
      { slug: "affordable-housing-72", title: "Affordable Housing - 72 Units", location: "Southern California", year: "Affordable Housing", image: AH72(1) },
      { slug: "fire-rebuild-mckendree-01", title: "Fire Rebuild - McKendree", location: "Pacific Palisades, CA", year: "Single Family", image: FIRE(1) },
    ];
    return { ...d, items: want };
  },
  // Work process: affordable housing, Ball Residence, Fire Rebuild
  "home.process": (d) => {
    const imgs = [AH72(1), BALL(2), FIRE(1), AH136(1), BALL(4), AH72(3)];
    return { ...d, steps: d.steps.map((s, i) => ({ ...s, image: imgs[i % imgs.length] })) };
  },
  // Practice band parallax
  "home.statement": (d) => ({ ...d, image: BALL(2) }),
  // Get in touch background
  "home.cta": (d) => ({ ...d, image: AH72(2) }),
  // Showreel: Ball Residence, 72, 136, Mixed 114, Fire Rebuild
  "home.showreel": (d) => ({
    ...d,
    linkLabel: "Explore projects →",
    items: [
      { image: BALL(1), title: "Ball Residence", kicker: "Single Family", youtubeId: "" },
      { image: AH72(1), title: "Affordable Housing - 72 Units", kicker: "Affordable Housing", youtubeId: "" },
      { image: AH136(1), title: "Affordable Housing - 136 Units", kicker: "Mixed Use", youtubeId: "" },
      { image: MU114(1), title: "Mixed Use - 114 Units", kicker: "Mixed Use", youtubeId: "" },
      { image: FIRE(1), title: "Fire Rebuild - McKendree", kicker: "Single Family", youtubeId: "" },
    ],
  }),
  // Contact aside -> Fire Rebuild
  "page.contact": (d) => ({ ...d, asideImage: FIRE(2) }),
  // Services imagery -> affordable housing / Ball Residence
  "page.services": (d) => {
    const imgs = [AH72(1), BALL(2), AH136(1), BALL(5), AH72(4), BALL(3)];
    return {
      ...d,
      image: AH72(1),
      items: Array.isArray(d.items) ? d.items.map((it, i) => ({ ...it, image: imgs[i % imgs.length] })) : d.items,
    };
  },
  // Hide the clients strip without deleting it
  "home.layout": (d) => ({
    ...d,
    sections: d.sections.map((s) => (s.id === "clients" ? { ...s, enabled: false } : s)),
  }),
  // Gallery becomes a draft, and drops out of the primary nav
  "page.gallery": (d) => ({ ...d, published: false }),
  menus: (d) => ({
    ...d,
    primary: d.primary.filter((m) => m.href !== "/gallery"),
    footerPages: (d.footerPages || []).filter((m) => m.href !== "/gallery"),
  }),
};

for (const [key, fn] of Object.entries(blockEdits)) {
  const b = await db.block.findUnique({ where: { key } });
  if (!b) { say(`  !! block ${key} missing`); continue; }
  const next = fn(b.data);
  // verify every local image path we are about to write actually exists
  const bad = [];
  const walk = (n) => {
    if (typeof n === "string") { if (n.startsWith("/projects/") && !check(n)) bad.push(n); }
    else if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") Object.values(n).forEach(walk);
  };
  walk(next);
  if (bad.length) { say(`  !! ${key}: missing files ${[...new Set(bad)].join(", ")} - skipped`); continue; }
  const changed = JSON.stringify(next) !== JSON.stringify(b.data);
  say(`  ${key.padEnd(18)} ${changed ? "updated" : "(no change)"}`);
  if (changed && apply) await db.block.update({ where: { key }, data: { data: next } });
}

say(`\n${apply ? "APPLIED" : "DRY RUN"}`);
if (!apply) say("re-run with --apply to write these changes");
await db.$disconnect();
