// Builds the scroll-scrub hero image sequences (desktop + mobile variants).
// Reads the raw 4K PNG frames (local only, git-ignored under Homepage_ref/),
// evenly samples each variant's frame count, downscales, and writes lossy WebP
// into web/public/media/<dir>/ as frame-000.webp .. frame-(N-1).webp.
//
// Usage (from web/):
//   node scripts/build-hero-frames.mjs            # build all variants
//   node scripts/build-hero-frames.mjs mobile     # build one variant
//   HERO_SRC=/path/to/pngs node scripts/build-hero-frames.mjs
// Re-run to regenerate. Requires the raw PNGs present locally.

import sharp from "sharp";
import { readdir, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC =
  process.env.HERO_SRC ||
  path.resolve(__dirname, "../../Homepage_ref/PNG-20260719T120637Z-1-001/PNG");
const PUBLIC = path.resolve(__dirname, "../public/media");

// Keep these in sync with SEQ_DESKTOP / SEQ_MOBILE in components/home/HeroScrub.tsx
const VARIANTS = {
  desktop: { dir: "hero-seq", width: 1920, quality: 92, count: 300 },
  mobile: { dir: "hero-seq-mobile", width: 1080, quality: 86, count: 150 },
};

const only = process.argv[2];
const names = only ? [only] : Object.keys(VARIANTS);

const all = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".png")).sort();
if (all.length === 0) {
  console.error(`No PNG frames found in ${SRC}`);
  process.exit(1);
}
console.log(`source: ${all.length} PNG frames in ${SRC}`);

for (const name of names) {
  const v = VARIANTS[name];
  if (!v) {
    console.error(`unknown variant "${name}" (expected: ${Object.keys(VARIANTS).join(", ")})`);
    process.exit(1);
  }
  const out = path.join(PUBLIC, v.dir);
  const count = Math.min(v.count, all.length);

  // Evenly sample `count` frames across the whole sequence (keeps start + end).
  const pick = [];
  for (let i = 0; i < count; i++) {
    pick.push(all[Math.round((i * (all.length - 1)) / (count - 1))]);
  }

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  let bytes = 0;
  for (let i = 0; i < pick.length; i++) {
    const info = await sharp(path.join(SRC, pick[i]))
      .resize({ width: v.width })
      .webp({ quality: v.quality, effort: 4 })
      .toFile(path.join(out, `frame-${String(i).padStart(3, "0")}.webp`));
    bytes += info.size;
  }
  console.log(
    `${name}: ${pick.length} frames @${v.width}px q${v.quality} → ${(bytes / 1048576).toFixed(1)} MB (public/media/${v.dir})`,
  );
}
