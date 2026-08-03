// Crops the render out of a presentation slide.
//
// Some projects were imported from the client's PowerPoint deck rather than from
// render files, so each "project image" is a 4:3 slide: the render sits in a box
// surrounded by white, with the client's logo top-right, a vertical "STUDIO DOT A"
// sidebar down the left, and a caption like "FRONT VIEW" underneath. On a
// full-bleed gallery that reads as a screenshot of a slide, not as architecture.
//
// Detection: a render is a DENSE block of non-white pixels, while the logo,
// sidebar and caption are sparse. So score each row and column by the fraction
// of non-white pixels and keep the longest contiguous run above a threshold.
// That isolates the render rectangle without hard-coding coordinates, which
// matters because the box is in a different place on almost every slide.
//
// Usage (from web/):
//   node scripts/crop-slide-renders.mjs <dir> [...more dirs]          # report only
//   node scripts/crop-slide-renders.mjs <dir> --apply                 # rewrite in place
//
// Originals are copied to <dir>/_slides/ before anything is overwritten.

import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dirs = args.filter((a) => !a.startsWith("--"));

if (dirs.length === 0) {
  console.error("usage: node scripts/crop-slide-renders.mjs <dir> [--apply]");
  process.exit(1);
}

// Content is tested in RGB, not greyscale. A bright sky greys out at 240+ and
// was being read as blank paper, so the right-hand third of a render with a lot
// of sky in it got cropped away. Sky is bright but strongly COLOURED, and paper
// is not, so either a dark-ish channel or any real saturation counts as content.
const DARK_ENOUGH = 238; // min(R,G,B) below this
const SATURATED = 10; // ...or max(R,G,B) - min(R,G,B) above this
const DENSITY = 0.5; // a render row/column is at least half content
const SIDEBAR_FRAC = 0.06; // ignore the coloured sidebar strip down the left edge

/** Longest contiguous run of indices whose density clears the threshold. */
function longestRun(density) {
  let best = [0, -1];
  let start = -1;
  for (let i = 0; i <= density.length; i++) {
    const on = i < density.length && density[i] >= DENSITY;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      if (i - 1 - start > best[1] - best[0]) best = [start, i - 1];
      start = -1;
    }
  }
  return best;
}

async function detect(file) {
  const meta = await sharp(file).metadata();
  const W = meta.width;
  const H = meta.height;
  const rgb = await sharp(file).removeAlpha().raw().toBuffer();
  const x0 = Math.round(W * SIDEBAR_FRAC);

  const colDensity = new Array(W).fill(0);
  const rowDensity = new Array(H).fill(0);
  for (let y = 0; y < H; y++) {
    let rowHits = 0;
    for (let x = x0; x < W; x++) {
      const i = (y * W + x) * 3;
      const r = rgb[i];
      const g = rgb[i + 1];
      const b = rgb[i + 2];
      const lo = Math.min(r, g, b);
      if (lo < DARK_ENOUGH || Math.max(r, g, b) - lo > SATURATED) {
        rowHits++;
        colDensity[x]++;
      }
    }
    rowDensity[y] = rowHits / (W - x0);
  }
  for (let x = 0; x < W; x++) colDensity[x] /= H;

  const [cx0, cx1] = longestRun(colDensity);
  const [cy0, cy1] = longestRun(rowDensity);
  const w = cx1 - cx0 + 1;
  const h = cy1 - cy0 + 1;
  return { W, H, left: cx0, top: cy0, width: w, height: h, coverage: (w * h) / (W * H) };
}

for (const dir of dirs) {
  const files = (await readdir(dir)).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f)).sort();
  console.log(`\n=== ${dir} ===`);
  for (const f of files) {
    const file = path.join(dir, f);
    const d = await detect(file);
    // A sane crop keeps a decent chunk of the slide. Anything tiny means the
    // detector latched onto a caption block or a sketch's shading, so skip it
    // rather than mangle the image.
    const ok = d.width > d.W * 0.3 && d.height > d.H * 0.3;
    console.log(
      `  ${f}  ${d.W}x${d.H} -> ${d.width}x${d.height} at ${d.left},${d.top}` +
        `  (${(d.coverage * 100).toFixed(0)}% of slide)${ok ? "" : "   SKIPPED - crop too small"}`,
    );
    if (!ok || !apply) continue;

    // Written to a sibling directory rather than in place. Windows keeps
    // transient handles on these files (indexer / AV / a dev server that had
    // them open), so opening the source path for write fails outright - errno
    // -4094 UNKNOWN. Writing fresh files and swapping the directory afterwards
    // is the only reliable route, and it also means a failed run leaves the
    // originals untouched.
    const outDir = path.join(dir, "_cropped");
    await mkdir(outDir, { recursive: true });
    const out = await sharp(file)
      .extract({ left: d.left, top: d.top, width: d.width, height: d.height })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    await writeFile(path.join(outDir, f), out);
  }
}

console.log(
  apply
    ? "\nCropped files written to <dir>/_cropped/. Move them over the originals once you have eyeballed them."
    : "\nReport only - pass --apply to write crops.",
);
