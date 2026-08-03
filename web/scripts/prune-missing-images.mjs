// Drops references to image files that no longer exist on disk.
//
// Removing an image from public/ leaves the database pointing at it: a gallery
// with holes in it, or a heroImage that 404s. This reconciles the two - any
// path under public/ that is gone is removed from gallery arrays, and a
// heroImage or interiorImage that has gone missing is repointed at the first
// surviving gallery image rather than left broken.
//
// Usage (from web/):
//   node scripts/prune-missing-images.mjs                          # dry run
//   node scripts/prune-missing-images.mjs --apply
//   node scripts/prune-missing-images.mjs --env-file .env.prod --apply
//
// --env-file is handled by node itself (node --env-file=...), so pass it before
// the script path if you use it; the wrapper in apply-content-fixes.sh does that.

import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");

const PUBLIC = path.resolve("public");
// Only judge site-relative paths. Remote URLs cannot be checked from here and
// must be left alone.
const isLocal = (p) => typeof p === "string" && p.startsWith("/") && !p.startsWith("//");
const onDisk = (p) => existsSync(path.join(PUBLIC, p.split("?")[0]));
const missing = (p) => isLocal(p) && !onDisk(p);

let projectEdits = 0;
let galleryEdits = 0;
const notes = [];

for (const p of await db.project.findMany({ where: { deletedAt: null } })) {
  const data = {};
  const gallery = Array.isArray(p.gallery) ? p.gallery : [];
  const keptGallery = gallery.filter((g) => !missing(g));

  if (keptGallery.length !== gallery.length) {
    for (const g of gallery.filter(missing)) notes.push(`  ${p.slug}: dropped ${g}`);
    data.gallery = keptGallery;
  }

  // Repoint a broken hero/interior at something that actually exists. Prefer a
  // surviving gallery image so the project still leads with its own work, and
  // avoid handing interiorImage the same file as the hero - the project page
  // shows both, and the same render twice reads as a bug.
  for (const field of ["heroImage", "interiorImage"]) {
    if (!missing(p[field])) continue;
    const hero = data.heroImage ?? (missing(p.heroImage) ? null : p.heroImage);
    const pick = keptGallery.find((g) => g !== hero) ?? keptGallery[0] ?? null;
    if (pick) {
      notes.push(`  ${p.slug}: ${field} ${p[field]} -> ${pick}`);
      data[field] = pick;
    } else {
      notes.push(`  ${p.slug}: ${field} ${p[field]} is missing and there is no gallery image to fall back to`);
    }
  }

  if (Object.keys(data).length) {
    if (apply) await db.project.update({ where: { id: p.id }, data });
    projectEdits++;
  }
}

for (const g of await db.galleryItem.findMany().catch(() => [])) {
  if (missing(g.image)) {
    notes.push(`  gallery item "${g.title}": ${g.image} is missing`);
    if (apply) await db.galleryItem.delete({ where: { id: g.id } });
    galleryEdits++;
  }
}

console.log(notes.length ? notes.join("\n") : "nothing to prune - every reference resolves");
console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${projectEdits} projects, ${galleryEdits} gallery items`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
