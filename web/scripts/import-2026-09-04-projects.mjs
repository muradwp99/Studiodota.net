/**
 * Third-batch importer for the 2026-09-04 client delivery (Projects.zip).
 *
 * Reconciling the zip against the Project table turned up only two folders
 * with imagery that isn't on the site:
 *
 *   - Aiglon House, Pacific Palisades — a fire rebuild with no DB row at all.
 *   - Studio Apartment - 158 Units — a row that exists but sits unpublished
 *     with an empty gallery, because its renders were never imported.
 *
 * ("Apartement Complex @ Hesperia" is a byte-identical duplicate of
 * "Apartments@ Hesperia" — verified by md5 — so it is deliberately skipped.
 * Lot 08, Kagawa St and Temecula have empty folders in the zip and no images
 * anywhere else, so they stay unpublished; nothing here can invent renders.)
 *
 * Same conventions as scripts/optimize-new-projects.mjs: 1920px longest edge,
 * webp q80, public/projects/<slug>/NN.webp with the cover first.
 *
 * From web/:  node scripts/import-2026-09-04-projects.mjs <sourceRoot>
 *   <sourceRoot> defaults to D:/tmp-projects/Projects
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const srcRoot = process.argv[2] ?? "D:/tmp-projects/Projects";

const MAX_EDGE = 1920;
const QUALITY = 80;

/** slug -> { dir relative to srcRoot, files with the hero first }. */
const CURATION = {
  "fire-rebuild-aiglon-house": {
    dir: "Signle Family Residence/Fire Rebuild/Aiglon House_Pacific Palisades",
    files: [
      "tmp_c46677c3-b458-44ab-8287-d6f7d161125b.jpeg",
      "tmp_faf0a2ae-b461-4c8c-ba77-d66c3811e331.jpeg",
      "tmp_ac172554-430d-4943-b547-edea5c3bf917.jpeg",
    ],
  },
  "studio-apartment-158": {
    dir: "Studio Apartment-158 units",
    files: ["Cam_04.jpg", "Cam_02.jpg", "Cam_03.jpg", "Cam_01.jpg", "Cam_05.jpg"],
  },
};

if (!fs.existsSync(srcRoot)) {
  console.error(`Source folder not found: ${srcRoot}`);
  process.exit(1);
}

const outRoot = path.join(webRoot, "public", "projects");
const manifest = {};

for (const [slug, { dir, files }] of Object.entries(CURATION)) {
  manifest[slug] = [];
  let n = 0;
  for (const file of files) {
    const src = path.join(srcRoot, dir, file);
    if (!fs.existsSync(src)) {
      console.warn(`MISSING ${slug}: ${src}`);
      continue;
    }
    n += 1;
    const name = `${String(n).padStart(2, "0")}.webp`;
    const dest = path.join(outRoot, slug, name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(src)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
    const meta = await sharp(dest).metadata();
    manifest[slug].push(`/projects/${slug}/${name}`);
    console.log(`${slug}/${name}  ${meta.width}x${meta.height}  ${Math.round(fs.statSync(dest).size / 1024)} KB  (${file})`);
  }
}

const manifestPath = path.join(__dirname, "2026-09-04-projects.manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nWrote ${manifestPath}`);
