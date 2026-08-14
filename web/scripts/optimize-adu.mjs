/**
 * Imports the 2026-08-09 ADU delivery (furnished floor-plan studies across
 * unit types) into public/projects/adu/NN.webp, same convention as the
 * other optimize-*.mjs scripts.
 *
 * Usage: node scripts/optimize-adu.mjs <sourceRoot> --apply
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcRoot = process.argv[2];
const apply = process.argv.includes("--apply");
if (!srcRoot || !fs.existsSync(srcRoot)) {
  console.error("Pass the ADU folder as the first argument.");
  process.exit(1);
}

const MAX_EDGE = 1920;
const QUALITY = 80;

// Simplest/cleanest layout first (reads best as a thumbnail), then roughly
// increasing unit complexity.
const FILES = [
  "Adu.jpg",
  "adu plan 2 2.jpg",
  "Adu 21.jpg",
  "adu plan 2 3a.jpg",
  "adu 2 4.jpg",
  "Adu existing 2.jpg",
  "adu site 2.jpg",
];

const outDir = path.resolve("public/projects/adu");
const manifest = [];

for (let i = 0; i < FILES.length; i++) {
  const src = path.join(srcRoot, FILES[i]);
  if (!fs.existsSync(src)) {
    console.warn(`MISSING: ${src}`);
    continue;
  }
  const name = String(i + 1).padStart(2, "0") + ".webp";
  const dest = path.join(outDir, name);
  manifest.push(`/projects/adu/${name}`);
  if (!apply) {
    const m = await sharp(src).metadata();
    console.log(`${name}  <- ${FILES[i]}  (${m.width}x${m.height})`);
    continue;
  }
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(src).rotate().resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(dest);
  console.log(`${name}  <- ${FILES[i]}  (${Math.round(fs.statSync(dest).size / 1024)}KB)`);
}

console.log(`\ngallery: ${JSON.stringify(manifest)}`);
console.log(apply ? "Written." : "Dry run - pass --apply to write.");
