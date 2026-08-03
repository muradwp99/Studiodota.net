// Repoints journal post imagery at the studio's real project renders.
//
// Every post shipped with a /media/renders/*.jpg image inherited from the
// template the site was built from - atelier-house, harbour-masterplan,
// meridian-sports and friends are stock, not this practice's work. On an
// architecture practice's own journal that is the worst place to show somebody
// else's buildings.
//
// Each post is matched to a real project by subject rather than at random, so
// the picture argues the same point as the article. Every path is checked
// against public/ before anything is written; a typo fails the run instead of
// silently producing a 404.
//
// Usage (from web/):
//   node scripts/remap-post-images.mjs                          # dry run
//   node scripts/remap-post-images.mjs --apply

import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const P = (p) => `/projects/${p}`;

const MAP = {
  // Daylight, glazing, section -> the glass-and-louvre office, then a skylit interior.
  "designing-for-daylight": { image: P("office-san-diego/03.webp"), inlineImage: P("cannabis-lounge/01.webp") },
  // Materials and detailing -> the two projects that lead with cladding and volume.
  "material-honesty": { image: P("auto-part-riverside/01.webp"), inlineImage: P("truck-servicing-fontana/01.webp") },
  // Community planning -> the affordable and senior housing schemes.
  "planning-with-people": { image: P("affordable-housing-136/01.webp"), inlineImage: P("senior-housing-fontana/01.webp") },
  // Shade, orientation, landscape -> Moreno Valley and the shaded senior scheme.
  "low-carbon-by-design": { image: P("moreno-valley/01.webp"), inlineImage: P("senior-housing-fontana/02.webp") },
  // Interiors -> the lounge interior and the house remodel.
  "interiors-that-last": { image: P("cannabis-lounge/02.webp"), inlineImage: P("tustin-house/01.webp") },
  // Reading a site -> the two schemes most shaped by their plots.
  "reading-a-site": { image: P("hesperia-47-west/01.webp"), inlineImage: P("sfr-lot-07/01.webp") },
  // Dashboard draft: still give it something real rather than stock.
  "draft-idea-from-the-dashboard": { image: P("office-san-diego/01.webp"), inlineImage: "" },
};

// Fail loudly on a bad path rather than writing a 404 into the database.
const bad = [];
for (const [slug, m] of Object.entries(MAP)) {
  for (const v of [m.image, m.inlineImage]) {
    if (v && !existsSync(path.join(path.resolve("public"), v))) bad.push(`${slug}: ${v}`);
  }
}
if (bad.length) {
  console.error("These files do not exist under public/:\n  " + bad.join("\n  "));
  process.exit(1);
}

let edits = 0;
for (const p of await db.post.findMany()) {
  const m = MAP[p.slug];
  if (!m) {
    console.log(`(no mapping for "${p.slug}" - left alone)`);
    continue;
  }
  const data = {};
  if (p.image !== m.image) data.image = m.image;
  if ((p.inlineImage ?? "") !== m.inlineImage) data.inlineImage = m.inlineImage;
  if (!Object.keys(data).length) continue;

  console.log(`${p.slug}`);
  if (data.image) console.log(`  image   - ${p.image}\n          + ${data.image}`);
  if (data.inlineImage !== undefined) console.log(`  inline  - ${p.inlineImage || "(none)"}\n          + ${data.inlineImage || "(none)"}`);
  if (apply) await db.post.update({ where: { id: p.id }, data });
  edits++;
}

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${edits} posts`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
