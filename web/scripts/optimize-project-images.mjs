/**
 * One-off importer: optimizes client-delivered project renders into
 * public/projects/<slug>/NN.webp and writes a manifest consumed by
 * scripts/import-projects.ts.
 *
 * Usage: node scripts/optimize-project-images.mjs <sourceRoot>
 *   <sourceRoot> = extracted "Projects" folder from the client zip.
 *
 * Curation notes (folder names are the source of truth for titles):
 *  - "Signle Family Residence" (typo) and "Single Family Residence" overlap;
 *    files are identical where they collide, so sub-projects are merged once.
 *  - PDFs and non-image files are skipped.
 *  - First file listed = cover (heroImage).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const srcRoot = process.argv[2];
if (!srcRoot || !fs.existsSync(srcRoot)) {
  console.error("Pass the extracted Projects folder as the first argument.");
  process.exit(1);
}

const MAX_EDGE = 1920;
const QUALITY = 80;

/** slug → { dir (relative to srcRoot), files (cover first) } */
const CURATION = {
  "apartments-hesperia": {
    dir: "Apartments@ Hesperia",
    files: ["Cam_01.jpg", "Cam_02.jpg", "Cam_03.jpg", "Cam_04.jpg", "Cam_05.jpg", "Cam_07.jpg", "Cam_08.jpg"],
  },
  "auto-part-riverside": {
    dir: "Auto part@Riverside",
    files: ["25.jpg", "3 (1).jpg"],
  },
  "cannabis-lounge": {
    dir: "Cannabis Lounge",
    files: ["ren 3.jpg", "ren 5.jpg", "ren12.jpg"],
  },
  "condominium-temple-simi-valley": {
    dir: "Condominium and Temple_Simi Valley",
    files: ["125.jpg", "15.jpg", "3.jpg", "4.jpg", "1d.jpg", "2d.jpg"],
  },
  "hesperia-47-west": {
    dir: "Hesperia@47 West",
    files: ["Cam 03.RGB_color.jpg", "cam 05.effectsResult.jpg", "Cam 08.effectsResult.jpg", "Cam 09.effectsResult.jpg"],
  },
  "hesperia-commercial": {
    dir: "Hesperia@Commercial",
    files: ["1.jpg", "2.jpg", "Untitled-1e.jpg"],
  },
  "moreno-valley": {
    dir: "Moreno Valley",
    files: ["Streetscape.RGB_color.jpg", "Building C_01.RGB_color.jpg", "Pool 01.RGB_color.jpg", "Pool 02.RGB_color.jpg"],
  },
  "office-san-diego": {
    dir: "office@San Diego",
    files: ["Slide6.JPG", "Slide5.JPG", "Slide7.JPG", "Slide8.JPG", "Slide9.JPG", "Slide10.JPG", "Slide11.JPG", "Slide1.JPG", "Slide2.JPG", "Slide3.JPG", "Slide4.JPG"],
  },
  "senior-housing-fontana": {
    dir: "Senior Housing@ Fontana",
    files: ["Cam_01.jpg", "Cam_07.jpg", "Cam_09.jpg", "Cam_10.jpg"],
  },
  "town-homes-la-habra": {
    dir: "Town Homes@ La Habra",
    files: ["Cam_01.jpg", "Cam_02.jpg", "Cam_03.jpg", "Cam_04.jpg", "interior.png"],
  },
  "truck-servicing-fontana": {
    dir: "Truck Servicing @ Fontana",
    files: ["cam 03.effectsResult.jpg", "Birds eye.RGB_color (2).jpg"],
  },
  "sfr-lot-07": {
    dir: "Signle Family Residence/Lot 07",
    files: ["Lot 7 _Front.effectsResult.jpg", "Lot 07_Rear View.jpg", "Lot 7_Birds eye.effectsResult.jpg"],
  },
  "sfr-lot-09": {
    dir: "Signle Family Residence/Lot 09",
    files: ["Lot 12_Front.jpg", "Lot 12_Rear View.effectsResult.jpg", "Lot 12_Birds Eye.effectsResult.jpg"],
  },
  "san-pedro-house": {
    dir: "Signle Family Residence/San Pedro House",
    files: ["front view.jpg", "Back View.jpg"],
  },
  "tustin-house": {
    dir: "Signle Family Residence/Tustin House",
    files: ["Remodel Residence_Cam 01.jpg", "Remodel Residence_Cam 02.jpg"],
  },
  "rollaway-6663": {
    dir: "Single Family Residence",
    files: ["6663 Rollaway-Stanley.jpg"],
  },
};

const outRoot = path.join(webRoot, "public", "projects");
const manifest = {};

for (const [slug, { dir, files }] of Object.entries(CURATION)) {
  const outDir = path.join(outRoot, slug);
  fs.mkdirSync(outDir, { recursive: true });
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
    const img = sharp(src).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true });
    await img.webp({ quality: QUALITY }).toFile(dest);
    const kb = Math.round(fs.statSync(dest).size / 1024);
    manifest[slug].push(`/projects/${slug}/${name}`);
    console.log(`${slug}/${name}  ${kb} KB  (from ${file})`);
  }
}

const manifestPath = path.join(webRoot, "scripts", "project-images.manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest → ${manifestPath}`);
