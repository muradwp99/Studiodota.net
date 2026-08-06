/**
 * Resamples a frame sequence so every output frame advances the SAME amount of
 * visual motion, instead of the same amount of time.
 *
 * Why: a scroll-scrubbed hero is driven by scroll position, not by a clock. If
 * the source camera move is uneven - and a generated flythrough always is - the
 * scrub inherits that unevenness and reads as "too fast" in exactly the moments
 * the camera accelerates. Measured on the Ball Residence flythrough, per-frame
 * motion ranged from 2.6 (opening hold) to 28.7 (the orbit), an 11x swing: a
 * third of the frames were spent barely moving while the most interesting
 * reveal blurred past.
 *
 * Sampling on cumulative motion instead of time flattens that. Slow passages
 * get fewer frames, fast passages get more, and the perceived speed while
 * scrubbing becomes constant.
 *
 * Usage (from web/):
 *   node scripts/resample-by-motion.mjs <srcDir> <outDir> <count> [width] [quality]
 */
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [srcDir, outDir, countArg, widthArg, qualityArg] = process.argv.slice(2);
if (!srcDir || !outDir || !countArg) {
  console.error("usage: node scripts/resample-by-motion.mjs <srcDir> <outDir> <count> [width] [quality]");
  process.exit(1);
}
const COUNT = Number(countArg);
const WIDTH = Number(widthArg ?? 1280);
const QUALITY = Number(qualityArg ?? 72);

const files = (await readdir(srcDir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
if (files.length < 2) {
  console.error(`need at least 2 frames in ${srcDir}`);
  process.exit(1);
}

// Downscaled greyscale thumbs are enough to measure motion and keep this fast.
const thumbs = [];
for (const f of files) {
  thumbs.push(await sharp(path.join(srcDir, f)).greyscale().resize(96, 54, { fit: "fill" }).raw().toBuffer());
}

// Cumulative motion curve. cum[i] = total motion from frame 0 to frame i.
const cum = [0];
for (let i = 1; i < thumbs.length; i++) {
  let d = 0;
  for (let p = 0; p < thumbs[i].length; p++) d += Math.abs(thumbs[i][p] - thumbs[i - 1][p]);
  cum.push(cum[i - 1] + d / thumbs[i].length);
}
const total = cum[cum.length - 1];

// Walk equal steps along that curve and take the nearest source frame. In a
// near-static passage several steps can land on the same frame; that is correct
// - almost nothing is changing there, so a repeat is invisible.
const picks = [];
let cursor = 0;
for (let i = 0; i < COUNT; i++) {
  const target = (total * i) / (COUNT - 1);
  while (cursor < cum.length - 1 && cum[cursor + 1] < target) cursor++;
  const lo = cursor;
  const hi = Math.min(cursor + 1, cum.length - 1);
  picks.push(Math.abs(cum[lo] - target) <= Math.abs(cum[hi] - target) ? lo : hi);
}

await mkdir(outDir, { recursive: true });
let bytes = 0;
for (let i = 0; i < picks.length; i++) {
  const buf = await sharp(path.join(srcDir, files[picks[i]]))
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toBuffer();
  await writeFile(path.join(outDir, `frame-${String(i).padStart(3, "0")}.webp`), buf);
  bytes += buf.length;
}

// Report how even the result actually is - the whole point of the exercise.
const steps = [];
for (let i = 1; i < picks.length; i++) steps.push(Math.abs(cum[picks[i]] - cum[picks[i - 1]]));
const sorted = [...steps].sort((a, b) => a - b);
const med = sorted[sorted.length >> 1];
const unique = new Set(picks).size;

console.log(`source ${files.length} frames -> ${COUNT} output frames @${WIDTH}px q${QUALITY}`);
console.log(`  unique source frames used: ${unique}/${files.length}`);
console.log(`  motion per output frame: median ${med.toFixed(1)}, min ${sorted[0].toFixed(1)}, max ${sorted.at(-1).toFixed(1)}`);
console.log(`  spread (max/median): ${(sorted.at(-1) / med).toFixed(2)}x  — 1.00x would be perfectly even`);
console.log(`  total ${(bytes / 1048576).toFixed(1)}MB, avg ${Math.round(bytes / COUNT / 1024)}KB`);
