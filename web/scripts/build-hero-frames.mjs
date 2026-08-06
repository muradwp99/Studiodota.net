// Builds the scroll-scrub hero image sequences (desktop + mobile variants).
// Reads the raw 4K PNG frames (local only, git-ignored under Homepage_ref/),
// evenly samples each variant's frame count, downscales, and writes lossy WebP
// into web/public/media/<dir>/ as frame-000.webp .. frame-(N-1).webp.
//
// Usage (from web/):
//   node scripts/build-hero-frames.mjs              # build all variants
//   node scripts/build-hero-frames.mjs mobile       # build one variant
//   HERO_SRC=/path/to/pngs node scripts/build-hero-frames.mjs
//   node scripts/build-hero-frames.mjs --recompress # re-encode already-built
//                                                   # frames (no PNGs needed)
//
// --recompress exists because the raw PNGs are not always around: it treats the
// committed WebP sequence as the source and re-encodes it to the current
// VARIANTS settings. That is a second lossy generation, which is fine for
// footage each frame of which is on screen for a few milliseconds, but always
// prefer rebuilding from PNG when they're available.

import sharp from "sharp";
import { readdir, mkdir, rm, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC =
  process.env.HERO_SRC ||
  path.resolve(__dirname, "../../Homepage_ref/PNG-20260719T120637Z-1-001/PNG");
const PUBLIC = path.resolve(__dirname, "../public/media");

// Keep these in sync with SEQ_DESKTOP / SEQ_MOBILE in components/home/HeroScrub.tsx.
//
// WIDTH IS THE FRAME-RATE KNOB, and it is not obvious. During a scrub the
// canvas draws a different frame every rAF, so each frame is decoded exactly
// once, and that decode - not the drawImage call, not the network - is what
// sets the frame rate. Measured on production, drawing successive frames at
// rAF into a 1466x766 canvas:
//
//     1920x1080 source -> 20.9ms/frame (48fps)
//     1080x608  source -> 13.3ms/frame (75fps)
//
// which fits t ≈ 9ms + 6.5e-6 * pixels. A 60fps budget (16.7ms) therefore caps
// the source at ~1.2M pixels, so 1280x720 (0.92M, ~15ms) is the largest size
// that holds 60fps, and 1600px does NOT. The footage sits behind a scrim as a
// background, so the slight upscale is not noticeable.
//
// Frame COUNT does not affect frame rate (still one decode per rAF either
// way) - it only affects total bytes and how finely the scrub steps.
//
// q92 was wasted on frames on screen for milliseconds; a measured sweep put
// the knee at q72.
const VARIANTS = {
  desktop: { dir: "hero-seq-v3", width: 1280, quality: 72, count: 300 },
  mobile: { dir: "hero-seq-mobile-v3", width: 1080, quality: 72, count: 150 },
};

const argv = process.argv.slice(2);
const recompress = argv.includes("--recompress");
const only = argv.find((a) => !a.startsWith("--"));
const names = only ? [only] : Object.keys(VARIANTS);

// Source listing differs per mode: PNGs from one shared directory, or each
// variant's own already-built WebP sequence.
let pngs = [];
if (!recompress) {
  pngs = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".png")).sort();
  if (pngs.length === 0) {
    console.error(`No PNG frames found in ${SRC}`);
    console.error(`If the raw PNGs aren't available, re-encode what's built: --recompress`);
    process.exit(1);
  }
  console.log(`source: ${pngs.length} PNG frames in ${SRC}`);
}

for (const name of names) {
  const v = VARIANTS[name];
  if (!v) {
    console.error(`unknown variant "${name}" (expected: ${Object.keys(VARIANTS).join(", ")})`);
    process.exit(1);
  }
  const out = path.join(PUBLIC, v.dir);

  let srcDir, srcFiles;
  if (recompress) {
    // Defaults to re-encoding the variant in place; point HERO_WEBP_SRC at
    // another directory to migrate an older sequence into a new versioned one.
    srcDir = process.env.HERO_WEBP_SRC
      ? path.resolve(process.env.HERO_WEBP_SRC)
      : out;
    srcFiles = (await readdir(srcDir)).filter((f) => f.endsWith(".webp")).sort();
    if (srcFiles.length === 0) {
      console.error(`${name}: nothing to recompress in ${srcDir}`);
      process.exit(1);
    }
  } else {
    srcDir = SRC;
    srcFiles = pngs;
  }

  const count = Math.min(v.count, srcFiles.length);

  // Evenly sample `count` frames across the whole sequence (keeps start + end).
  const pick = [];
  for (let i = 0; i < count; i++) {
    pick.push(srcFiles[Math.round((i * (srcFiles.length - 1)) / (count - 1))]);
  }

  // Write to a sibling directory and swap, so recompress never reads a file it
  // has already overwritten.
  const tmp = `${out}.tmp`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });

  let bytes = 0;
  for (let i = 0; i < pick.length; i++) {
    const info = await sharp(path.join(srcDir, pick[i]))
      .resize({ width: v.width })
      .webp({ quality: v.quality, effort: 4 })
      .toFile(path.join(tmp, `frame-${String(i).padStart(3, "0")}.webp`));
    bytes += info.size;
  }

  // Windows holds transient handles on freshly-written files (indexer, AV, a
  // running `next start`), so the swap reliably hits EBUSY on the first try.
  // Retrying a few times clears it; the tmp dir means a hard failure here
  // still leaves both the old and new sequences intact on disk.
  for (let attempt = 1; ; attempt++) {
    try {
      await rm(out, { recursive: true, force: true });
      break;
    } catch (err) {
      if (attempt >= 5) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  await rename(tmp, out);

  console.log(
    `${name}: ${pick.length} frames @${v.width}px q${v.quality} → ${(bytes / 1048576).toFixed(1)} MB (public/media/${v.dir})`,
  );
}
