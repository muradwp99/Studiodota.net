/**
 * One-off: flattens the client's Logo.psd into transparent public/logo*.png
 * (+ webp) and Next.js app-icon files, without needing a native canvas binding.
 *
 * Usage: node scripts/extract-logo.mjs "<path to Logo.psd>"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { readPsd, initializeCanvas } from "ag-psd";

// ag-psd assumes a browser <canvas>; supply a plain-object stand-in so it can
// allocate pixel buffers without the native `canvas` package (avoids node-gyp).
initializeCanvas(
  (width, height) => ({
    width,
    height,
    getContext: () => ({
      createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
      drawImage() {},
      getImageData: (_x, _y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    }),
  }),
  (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const publicDir = path.join(webRoot, "public");
const srcPath = process.argv[2];
if (!srcPath || !fs.existsSync(srcPath)) {
  console.error("Pass the path to the .psd file as the first argument.");
  process.exit(1);
}

const buf = fs.readFileSync(srcPath);
const psd = readPsd(buf, { skipLayerImageData: true, useImageData: true });
const composite = psd.imageData;
if (!composite) throw new Error("PSD has no composite image data to flatten.");

// The PSD's bottom layer is an opaque full-canvas white fill (there is no real
// transparency), so key white out ourselves: alpha = distance from white via
// the min channel. Black ink -> alpha 255, white bg -> alpha 0, the orange "A"
// (not pure-white in any channel) stays close to fully opaque.
const keyed = Buffer.from(composite.data);
for (let i = 0; i < keyed.length; i += 4) {
  const r = keyed[i], g = keyed[i + 1], b = keyed[i + 2];
  keyed[i + 3] = 255 - Math.min(r, g, b);
}
const rawOpts = { raw: { width: composite.width, height: composite.height, channels: 4 } };
const src = () => sharp(keyed, rawOpts);

// Full lockup (wordmark + tagline) — header/footer wide placements.
await src().trim().png({ compressionLevel: 9 }).toFile(path.join(publicDir, "logo.png"));
await src().trim().webp({ quality: 100, lossless: true }).toFile(path.join(publicDir, "logo.webp"));

// Square-ish "dot" emblem only (from the untrimmed composite's known layer bbox) —
// for the favicon/app-icon and any compact square placements. extract() + trim()
// chained in one pipeline hits libvips' "bad extract area", so trim runs as its
// own pass over the already-cropped buffer instead.
const cropped = await src().extract({ left: 1850, top: 170, width: 1080, height: 880 }).png().toBuffer();
await sharp(cropped).trim().png({ compressionLevel: 9 }).toFile(path.join(publicDir, "logo-mark.png"));

// Wordmark without the tagline strip (tagline layer starts ~y:1070) — compact
// horizontal placements like the nav pill where the tagline would be illegible.
const croppedWordmark = await src().extract({ left: 0, top: 150, width: composite.width, height: 910 }).png().toBuffer();
await sharp(croppedWordmark).trim().png({ compressionLevel: 9 }).toFile(path.join(publicDir, "logo-wordmark.png"));

await sharp(path.join(publicDir, "logo-mark.png")).resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(webRoot, "src", "app", "icon.png"));
await sharp(path.join(publicDir, "logo-mark.png")).resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).flatten({ background: "#ffffff" }).png().toFile(path.join(webRoot, "src", "app", "apple-icon.png"));

// Reversed (white) variant of each crop, for dark theme / dark hero placements —
// repaints every non-transparent pixel white and keeps the real alpha from
// above, rather than a naive negate (which would turn the orange "A" cyan).
async function toWhiteVariant(srcFile, destFile) {
  const { data, info } = await sharp(srcFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(destFile);
}
await toWhiteVariant(path.join(publicDir, "logo.png"), path.join(publicDir, "logo-white.png"));
await toWhiteVariant(path.join(publicDir, "logo-wordmark.png"), path.join(publicDir, "logo-wordmark-white.png"));
await toWhiteVariant(path.join(publicDir, "logo-mark.png"), path.join(publicDir, "logo-mark-white.png"));

for (const name of ["logo", "logo-mark", "logo-wordmark", "logo-white", "logo-wordmark-white", "logo-mark-white"]) {
  const m = await sharp(path.join(publicDir, `${name}.png`)).metadata();
  console.log(name.padEnd(20), `${m.width}x${m.height}`, m.hasAlpha ? "alpha:yes" : "alpha:NO");
}
