/**
 * Second-batch importer: optimizes the 2026-07-31 client delivery into
 * public/projects/<slug>/NN.webp (new projects + interior top-ups for
 * existing drafts) plus two standalone gallery-only images, using the exact
 * same convention as scripts/optimize-project-images.mjs.
 *
 * Usage: node scripts/optimize-new-projects.mjs <sourceRoot>
 *   <sourceRoot> = the OneDrive folder with one subfolder per project.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const srcRoot = process.argv[2];
if (!srcRoot || !fs.existsSync(srcRoot)) {
  console.error("Pass the client delivery folder as the first argument.");
  process.exit(1);
}

const MAX_EDGE = 1920;
const QUALITY = 80;

/** New/updated project slugs -> { dir (relative to srcRoot), files (cover first) }. */
const CURATION = {
  "affordable-housing-136": {
    dir: "Affordable Housing-136 units",
    files: ["10136 Inglewood Ave Birds' Eye View.jpg", "136_01.png", "136_02.png", "136_03.png", "136_04.png", "Cam 01_Interactive LightMix (1).jpg", "Cam 02_Interactive LightMix (1).jpg", "cam 05_Interactive LightMix.jpg"],
  },
  "affordable-housing-77": {
    dir: "Affordable Housing-77 units",
    files: ["cam 1.jpg", "cam 2.jpg", "cam 3.jpg", "cam 4.jpg", "cam 5.jpg"],
  },
  "affordable-housing-72": {
    dir: "Affordable Housing-72 units",
    files: ["Cam_01.jpg", "Cam_02.jpg", "Cam_03.jpg", "Cam_04.jpg", "Cam_05.jpg", "Cam_06.jpg"],
  },
  "affordable-housing-62": {
    dir: "Affordable Housing-62 units",
    files: ["62_birdeye view.jpg", "62_01.png", "62 _02.png", "Cam 01_Interactive LightMix (2).jpg", "Cam 02.jpg", "Cam 03_Interactive LightMix.jpg", "sketch.jpg"],
  },
  "mixed-use-114": {
    dir: "Mixed Use-114 units",
    files: ["2024 013_AR_Shepa Mixed use building (1).jpg", "2024 013_AR_Shepa Mixed use building (2).png", "2024 013_AR_Shepa Mixed use building (3).png", "2024 013_AR_Shepa Mixed use building (4).png"],
  },
  "covina-residence": {
    dir: "Interior/Covina Residence",
    files: ["View_01.jpg", "view_02.jpg", "view_03.jpg", "view_04.jpg", "view_05.jpg"],
  },
  "cyclebar": {
    dir: "Tenant Improvement/Cyclebar",
    files: ["2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "8.jpg", "10.jpg", "11.jpg", "12.jpg", "18.jpg", "19.jpg", "23.jpg", "24.jpg"],
  },
  "row-house": {
    dir: "Tenant Improvement/Row House",
    files: ["20180504_124529.jpg", "20180504_124533.jpg", "20180504_124548.jpg", "20180504_124551.jpg", "20180504_130553.jpg", "20180504_130557.jpg", "20180504_130600.jpg", "20180504_130816.jpg"],
  },
  "bell-residence": {
    dir: "Interior",
    files: ["Bell Residence_Chino.jpg"],
  },
  "jurien-bay": {
    dir: "Interior",
    files: ["Jurien Bay.jpg", "Jurien Bay 2.jpg"],
  },
  // Crenshaw's own folder arrived empty; these unit-interior shots are its only imagery.
  "crenshaw-apartments": {
    dir: "Interior/Crenshaw affordable Apartment",
    files: ["Unit 330 interior Cam_01.jpg", "Unit 330 interior Cam_02.jpg", "Unit 330 interior Cam_03.jpg", "Unit 330 interior Cam_04.jpg", "Unit 330 interior Cam_05.jpg"],
  },
};

/** Extra interior photos APPENDED after a slug's existing gallery (continues numbering). */
const APPEND_CURATION = {
  "affordable-housing-136": { dir: "Interior/Gardena Affordable Apartment", files: ["Bathroom Cam_01.jpg", "Bathroom Cam_02.jpg", "Cam_03.jpg", "Cam_04.jpg", "Cam_05.jpg"], startAt: 9 },
  "affordable-housing-77": { dir: "Interior/Hawthorne Affordable Apartment", files: ["Mixed use building_02.png", "Mixed use building_04.png", "living and Kitchen.png", "restroom.png"], startAt: 6 },
};

/** Standalone photos with no project identity -> gallery-only assets. */
const GALLERY_ONLY = {
  "foyer": { dir: "Interior", file: "Foyer.RGB_color.0000.jpg" },
  "crimson-bed": { dir: "Interior", file: "Crimson_bed.jpg" },
};

async function convert(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(dest);
  return Math.round(fs.statSync(dest).size / 1024);
}

const outRoot = path.join(webRoot, "public", "projects");
const manifest = {};

for (const [slug, { dir, files }] of Object.entries(CURATION)) {
  const outDir = path.join(outRoot, slug);
  manifest[slug] = [];
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
    const kb = await convert(src, dest);
    manifest[slug].push(`/projects/${slug}/${name}`);
    console.log(`${slug}/${name}  ${kb} KB  (from ${file})`);
  }
}

for (const [slug, { dir, files, startAt }] of Object.entries(APPEND_CURATION)) {
  const outDir = path.join(outRoot, slug);
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
    const kb = await convert(src, dest);
    manifest[slug] = manifest[slug] || [];
    manifest[slug].push(`/projects/${slug}/${name}`);
    console.log(`${slug}/${name}  ${kb} KB  (from ${file}, appended)`);
  }
}

const galleryManifest = {};
for (const [key, { dir, file }] of Object.entries(GALLERY_ONLY)) {
  const src = path.join(srcRoot, dir, file);
  if (!fs.existsSync(src)) {
    console.warn(`MISSING gallery-only ${key}: ${src}`);
    continue;
  }
  const dest = path.join(webRoot, "public", "gallery", `${key}.webp`);
  const kb = await convert(src, dest);
  galleryManifest[key] = `/gallery/${key}.webp`;
  console.log(`gallery/${key}.webp  ${kb} KB  (from ${file})`);
}

const manifestPath = path.join(webRoot, "scripts", "new-projects.manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify({ projects: manifest, gallery: galleryManifest }, null, 2));
console.log(`\nManifest -> ${manifestPath}`);
