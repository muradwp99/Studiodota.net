/**
 * Imports the 2026-08-07 "04_Interior" client delivery into
 * public/projects/<slug>/NN.webp, same convention as optimize-new-projects.mjs.
 *
 * 5 of the 12 source folders are exact re-deliveries of photos already
 * imported (330 Affordable units@Gardena / Affordable units@Gardena /
 * Interior @ Covina Hills match earlier CURATION filenames byte-for-byte in
 * naming) - skipped. Bell Residence and Jurien Bay have new room shots
 * appended to their existing interior-category galleries. The remaining 7
 * folders are new interior-category projects.
 *
 * Usage: node scripts/optimize-04-interior.mjs <sourceRoot> --apply
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const srcRoot = process.argv[2];
const apply = process.argv.includes("--apply");
if (!srcRoot || !fs.existsSync(srcRoot)) {
  console.error("Pass the 04_Interior folder as the first argument.");
  process.exit(1);
}

const MAX_EDGE = 1920;
const QUALITY = 80;

/** New projects: slug -> { dir, files (cover first) }. */
const NEW_PROJECTS = {
  bar: { dir: "Bar", files: ["b1 copy.jpg", "b2 copy.jpg", "b3 copy.jpg", "b4 copy.jpg", "b6 copy.jpg", "b7.jpg", "b8.jpg", "b9.jpg"] },
  "fisher-st": { dir: "Fisher ST", files: ["Fisher ST_Great Room.jpg", "Fisher ST_Living.jpg", "Fisher ST_2nd Kitchen.jpg", "Fisher ST_Patio.jpg"] },
  "garments-office": { dir: "Garments office", files: ["05.jpg", "07.jpg", "08.jpg", "09.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg"] },
  "humairas-residence": { dir: "Humaira's Residence", files: ["Living_01.jpg", "Living_02.jpg", "BED 02.jpg", "M 02.jpg"] },
  "michaels-residence": { dir: "Michael's Res", files: ["Michael's Res_Living Room.jpg", "Michael Res_Dining.jpg", "Foyer.jpg"] },
  "mr-amins-kitchen": { dir: "MR. Amin's kitchen", files: ["Mr amin kitchen_cam 01.RGB_color.0000.jpg", "Mr amin kitchen cam 02.RGB_color.0000.jpg", "Mr amin kitchen cam 04.RGB_color.jpg"] },
  "nandos-restaurant": { dir: "Nandos' Restaurant", files: ["nandos gulshan night.jpg", "nandos_cam 30000.jpg", "nandos_cam 30001.jpg", "nandos_cam 30002.jpg", "nandos_cam 30003.jpg"] },
};

/** Appended to an existing interior project's gallery, continuing numbering. */
const APPEND_CURATION = {
  "bell-residence": { dir: "Bell Residence", files: ["Bell Residence _Bath.jpg", "Bell Residence_Bedroom.jpg"], startAt: 2 },
  "jurien-bay": { dir: "Jurien Bay", files: ["Jurien Bay Resdence_Bedroom.jpg", "Jurien Bay Resdence_Kitchen View.jpg", "Jurien Bay Resdence_Living.jpg"], startAt: 3 },
};

async function convert(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(dest);
  return Math.round(fs.statSync(dest).size / 1024);
}

const outRoot = path.join(webRoot, "public", "projects");
const manifest = { projects: {}, append: {} };

for (const [slug, { dir, files }] of Object.entries(NEW_PROJECTS)) {
  const outDir = path.join(outRoot, slug);
  manifest.projects[slug] = [];
  let n = 0;
  for (const file of files) {
    const src = path.join(srcRoot, dir, file);
    if (!fs.existsSync(src)) {
      console.warn(`MISSING ${slug}: ${src}`);
      continue;
    }
    n += 1;
    const name = String(n).padStart(2, "0") + ".webp";
    const dest = path.join(outDir, name);
    manifest.projects[slug].push(`/projects/${slug}/${name}`);
    if (!apply) continue;
    const kb = await convert(src, dest);
    console.log(`${slug}/${name}  ${kb} KB  (from ${file})`);
  }
}

for (const [slug, { dir, files, startAt }] of Object.entries(APPEND_CURATION)) {
  const outDir = path.join(outRoot, slug);
  manifest.append[slug] = [];
  let n = startAt - 1;
  for (const file of files) {
    const src = path.join(srcRoot, dir, file);
    if (!fs.existsSync(src)) {
      console.warn(`MISSING ${slug} (append): ${src}`);
      continue;
    }
    n += 1;
    const name = String(n).padStart(2, "0") + ".webp";
    const dest = path.join(outDir, name);
    manifest.append[slug].push(`/projects/${slug}/${name}`);
    if (!apply) continue;
    const kb = await convert(src, dest);
    console.log(`${slug}/${name}  ${kb} KB  (from ${file}, appended)`);
  }
}

const manifestPath = path.join(webRoot, "scripts", "04-interior.manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest -> ${manifestPath}`);
console.log(apply ? "Written." : "Dry run - pass --apply to write.");
