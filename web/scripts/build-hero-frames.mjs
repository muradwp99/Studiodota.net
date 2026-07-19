// Builds the scroll-scrub hero image sequence.
// Reads the raw 4K PNG frames (local only, git-ignored under Homepage_ref/),
// evenly samples TARGET frames, downscales to WIDTH, and writes lossy WebP
// into web/public/media/hero-seq/ as frame-000.webp .. frame-(N-1).webp.
//
// Usage (from web/):  node scripts/build-hero-frames.mjs [SRC_DIR]
// Re-run to regenerate. Requires the raw PNGs present locally.

import sharp from "sharp";
import { readdir, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.resolve(__dirname, "../public/media/hero-seq");
const SRC =
  process.argv[2] ||
  path.resolve(__dirname, "../../Homepage_ref/PNG-20260719T120637Z-1-001/PNG");

const TARGET = 300; // frames to keep
const WIDTH = 1920; // downscale width
const QUALITY = 92; // lossy WebP quality

const all = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".png")).sort();
if (all.length === 0) {
  console.error(`No PNG frames found in ${SRC}`);
  process.exit(1);
}
console.log(`source: ${all.length} PNG frames in ${SRC}`);

// Evenly sample TARGET frames across the whole sequence (keeps start + end).
const count = Math.min(TARGET, all.length);
const pick = [];
for (let i = 0; i < count; i++) {
  pick.push(all[Math.round((i * (all.length - 1)) / (count - 1))]);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

let totalBytes = 0;
for (let i = 0; i < pick.length; i++) {
  const num = String(i).padStart(3, "0");
  const info = await sharp(path.join(SRC, pick[i]))
    .resize({ width: WIDTH })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(path.join(OUT, `frame-${num}.webp`));
  totalBytes += info.size;
  if (i % 25 === 0 || i === pick.length - 1) {
    console.log(`  ${String(i + 1).padStart(3)}/${pick.length}  frame-${num}.webp  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
console.log(`DONE: ${pick.length} frames, ${(totalBytes / 1048576).toFixed(1)} MB total → ${OUT}`);
