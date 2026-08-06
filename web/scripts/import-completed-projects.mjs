/**
 * Imports the projects that exist in the client's completed-projects delivery
 * but were never brought into the site. Same convention as
 * scripts/optimize-new-projects.mjs: public/projects/<slug>/NN.webp, longest
 * edge capped, cover image first.
 *
 * ball-residence and the Fire Rebuild projects were sitting on the site as
 * unpublished rows with zero images, because the earlier import batches never
 * covered them.
 *
 * Usage (from web/):
 *   node scripts/import-completed-projects.mjs <projectsRoot>
 *   node scripts/import-completed-projects.mjs <projectsRoot> --apply
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcRoot = process.argv[2];
const apply = process.argv.includes("--apply");
if (!srcRoot || !fs.existsSync(srcRoot)) {
  console.error("Pass the completed-projects folder as the first argument.");
  process.exit(1);
}

const MAX_EDGE = 1920;
const QUALITY = 80;

// Cover image first - it becomes NN=01 and is what the card, the hero and any
// section referencing the project will show.
const CURATION = {
  "ball-residence": {
    dir: "Signle Family Residence/Ball Residence",
    files: [
      "Cam_02.jpg", // twilight street elevation - the strongest frame, used as cover
      "birds eye view.jpg",
      "Cam_03 (1).jpg",
      "Cam_05_Post_LightMix Interactive.jpg",
      "Cam_07_Post_LightMix Interactive.jpg",
      "Cam_09_Post_LightMix Interactive.jpg",
      "Cam 08.jpg",
      "close up.png",
    ],
  },
  "fire-rebuild-mckendree-01": {
    dir: "Signle Family Residence/Fire Rebuild/Mckendree 01_Pacific Palisades",
    files: ["Mc Kendree-front.jpg", "Mc Kendree-back.jpg", "Side front.jpg", "Side back.jpg"],
  },
  "fire-rebuild-mckendree-02": {
    dir: "Signle Family Residence/Fire Rebuild/Mckendree 02_Pacific Palisades",
    files: [
      "tmp_ac172554-430d-4943-b547-edea5c3bf917.jpeg",
      "tmp_c46677c3-b458-44ab-8287-d6f7d161125b.jpeg",
      "tmp_faf0a2ae-b461-4c8c-ba77-d66c3811e331.jpeg",
    ],
  },
};

let missing = 0;
for (const [slug, cfg] of Object.entries(CURATION)) {
  for (const f of cfg.files) {
    if (!fs.existsSync(path.join(srcRoot, cfg.dir, f))) {
      console.error(`MISSING: ${slug} -> ${cfg.dir}/${f}`);
      missing++;
    }
  }
}
if (missing) {
  console.error(`\n${missing} source file(s) not found - fix the curation before applying.`);
  process.exit(1);
}

for (const [slug, cfg] of Object.entries(CURATION)) {
  const outDir = path.resolve("public/projects", slug);
  console.log(`\n${slug}  (${cfg.files.length} images)`);
  if (apply) fs.mkdirSync(outDir, { recursive: true });

  const paths = [];
  for (let i = 0; i < cfg.files.length; i++) {
    const src = path.join(srcRoot, cfg.dir, cfg.files[i]);
    const name = `${String(i + 1).padStart(2, "0")}.webp`;
    paths.push(`/projects/${slug}/${name}`);
    if (!apply) {
      const m = await sharp(src).metadata();
      console.log(`  ${name}  <- ${cfg.files[i]}  (${m.width}x${m.height})`);
      continue;
    }
    const buf = await sharp(src)
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toBuffer();
    fs.writeFileSync(path.join(outDir, name), buf);
    console.log(`  ${name}  <- ${cfg.files[i]}  (${Math.round(buf.length / 1024)}KB)`);
  }
  console.log(`  gallery: ${JSON.stringify(paths)}`);
}

console.log(apply ? "\nWritten. Now run update-project-structure.mjs to wire the database." : "\nDry run - pass --apply to write.");
