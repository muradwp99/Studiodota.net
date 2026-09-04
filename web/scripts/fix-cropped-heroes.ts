/**
 * Point wide, full-bleed slots at renders that are actually wide.
 *
 * The office-san-diego set is the studio's oldest and its renders are square
 * (654x654 and smaller). A square source in a 16:9 hero is `object-fit: cover`,
 * so ~44% of the image is cropped away AND what's left is upscaled ~2.7x —
 * measured live on /projects/office-san-diego. 06 and 07 in the same set are
 * true 16:9 (841x473), so using one as the hero removes the crop entirely and
 * drops the upscale to ~1.6x. No new assets needed.
 *
 * The images themselves are still below the 1200px the layout wants; only
 * re-exported renders can fix that, and this script leaves a report of which
 * files those are.
 *
 * From web/:  npx tsx scripts/fix-cropped-heroes.ts [--prod]
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const useProd = process.argv.includes("--prod");
const url = readFileSync(useProd ? ".env.prod" : ".env", "utf8").match(/DATABASE_URL="([^"]+)"/)![1];
const db = new PrismaClient({ datasources: { db: { url } } });

/** slug -> the wide render in that set that should carry the hero. */
const WIDE_HERO: Record<string, string> = {
  "office-san-diego": "/projects/office-san-diego/07.webp",
};

/** Layout wants at least this much width for a full-bleed slot. */
const MIN_WIDTH = 1200;

async function report() {
  const rows: { path: string; w: number; h: number }[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(webp|jpe?g|png)$/i.test(f)) rows.push({ path: p, w: 0, h: 0 });
    }
  };
  walk("public/projects");
  const small: string[] = [];
  for (const r of rows) {
    const m = await sharp(r.path).metadata();
    if ((m.width ?? 0) < MIN_WIDTH) small.push(`${m.width}x${m.height}  ${r.path.replace(/\\/g, "/")}`);
  }
  console.log(`\n${small.length} of ${rows.length} project images are under ${MIN_WIDTH}px wide:`);
  small.sort().forEach((s) => console.log("  " + s));
  console.log("\nThese need re-exported renders — nothing in code can add the missing detail.");
}

async function main() {
  for (const [slug, heroImage] of Object.entries(WIDE_HERO)) {
    const project = await db.project.findUnique({ where: { slug }, select: { heroImage: true } });
    if (!project) {
      console.log(`  skipped   ${slug} (no such project)`);
      continue;
    }
    if (project.heroImage === heroImage) {
      console.log(`  already   ${slug}`);
      continue;
    }
    await db.project.update({ where: { slug }, data: { heroImage } });
    console.log(`  hero      ${slug}: ${project.heroImage} -> ${heroImage}`);
  }
  if (!useProd) await report();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
