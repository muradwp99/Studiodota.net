/**
 * One-off content migration: pushes the imported client portfolio into the CMS DB.
 *  - generates public/projects/placeholder.webp (used by imageless draft projects)
 *  - soft-deletes the old demo projects + demo gallery items
 *  - upserts every real project (published + drafts) from SEED_PROJECTS
 *  - inserts the curated gallery set, registers all render paths as Media
 *  - refreshes the content blocks whose copy this migration replaces
 *
 * Run from web/:  npx tsx scripts/import-projects.ts   (DATABASE_URL must be set)
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient, Prisma } from "@prisma/client";
import { BLOCK_DEFAULTS, SEED_PROJECTS, SEED_GALLERY, SEED_MEDIA } from "../src/content/defaults";

const db = new PrismaClient();

const OLD_DEMO_SLUGS = [
  "urban-oasis", "leafy-precinct", "riverside-warehouse",
  "meridian-sports", "harbour-masterplan", "atelier-house",
];

/** Blocks whose content this migration intentionally replaces. */
const REFRESHED_BLOCKS = [
  "menus", "page.about", "page.services", "page.projects", "page.gallery",
  "page.contact", "home.about", "home.featured",
  "home.whyChoose", "home.testimonials", "home.timeline",
] as const;

async function makePlaceholder() {
  const dest = path.resolve(__dirname, "..", "public", "projects", "placeholder.webp");
  if (fs.existsSync(dest)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <rect width="1600" height="1200" fill="#17191c"/>
    <g fill="none" stroke="#a87f3f" stroke-width="2" opacity="0.55">
      <circle cx="1230" cy="330" r="420"/>
      <circle cx="1230" cy="330" r="300"/>
      <circle cx="1230" cy="330" r="180"/>
    </g>
    <g fill="none" stroke="#a87f3f" stroke-width="1.5" opacity="0.3">
      <circle cx="240" cy="1040" r="260"/>
      <circle cx="240" cy="1040" r="160"/>
    </g>
    <text x="120" y="580" font-family="Arial, sans-serif" font-size="34" letter-spacing="14" fill="#a87f3f">STUDIO DOT A</text>
    <text x="120" y="660" font-family="Arial, sans-serif" font-size="58" font-weight="bold" fill="#f5f5f3">Renders in progress</text>
    <text x="120" y="720" font-family="Arial, sans-serif" font-size="28" fill="#9aa0a6">Imagery for this project is on its way.</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(dest);
  console.log("placeholder.webp created");
}

async function main() {
  await makePlaceholder();

  // 1) Retire the demo projects (soft delete → recoverable from Trash)
  const retired = await db.project.updateMany({
    where: { slug: { in: OLD_DEMO_SLUGS }, deletedAt: null },
    data: { deletedAt: new Date(), published: false },
  });

  // 2) Upsert the real portfolio
  for (const p of SEED_PROJECTS) {
    const { slug, ...rest } = p;
    const data = { ...rest, services: rest.services as unknown as Prisma.InputJsonValue, gallery: rest.gallery as unknown as Prisma.InputJsonValue };
    await db.project.upsert({ where: { slug }, update: { ...data, deletedAt: null }, create: { slug, ...data } });
  }

  // 3) Gallery: retire demo items (old /media/renders imagery), insert curated set
  const retiredGallery = await db.galleryItem.updateMany({
    where: { image: { startsWith: "/media/renders/" }, deletedAt: null },
    data: { deletedAt: new Date(), published: false },
  });
  let galleryCreated = 0;
  for (const g of SEED_GALLERY) {
    const existing = await db.galleryItem.findFirst({ where: { title: g.title, deletedAt: null } });
    if (!existing) {
      await db.galleryItem.create({ data: g });
      galleryCreated += 1;
    }
  }

  // 4) Media registry
  for (const m of SEED_MEDIA) {
    await db.media.upsert({
      where: { path: m.path },
      update: { deletedAt: null },
      create: { ...m, mime: m.path.endsWith(".png") ? "image/png" : m.path.endsWith(".webp") ? "image/webp" : "image/jpeg" },
    });
  }

  // 5) Refresh the blocks this migration replaces (defaults are the new source of truth)
  for (const key of REFRESHED_BLOCKS) {
    const data = structuredClone(BLOCK_DEFAULTS[key]) as unknown as Prisma.InputJsonValue;
    await db.block.upsert({ where: { key }, update: { data, draft: Prisma.DbNull }, create: { key, data } });
  }

  console.log("Import complete:", {
    demoProjectsRetired: retired.count,
    projectsUpserted: SEED_PROJECTS.length,
    demoGalleryRetired: retiredGallery.count,
    galleryCreated,
    mediaEnsured: SEED_MEDIA.length,
    blocksRefreshed: REFRESHED_BLOCKS.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
