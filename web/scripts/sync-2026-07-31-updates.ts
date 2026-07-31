/**
 * Targeted sync for the 2026-07-31 content update: publishes/creates exactly
 * the projects touched this round, refreshes exactly the blocks whose AI
 * placeholder images were replaced, and adds any new gallery items.
 *
 * Deliberately narrower than import-projects.ts's full-array loop: SEED_PROJECTS
 * and BLOCK_DEFAULTS also contain entries the admin may have hand-edited since
 * the original import (SEO copy, corrected years, redesigned testimonials...);
 * upserting everything would silently clobber those. Only touch what changed.
 *
 * Run from web/:  npx tsx scripts/sync-2026-07-31-updates.ts   (DATABASE_URL must be set)
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { BLOCK_DEFAULTS, SEED_PROJECTS, SEED_GALLERY } from "../src/content/defaults";

const db = new PrismaClient();

const TOUCHED_PROJECT_SLUGS = [
  "affordable-housing-136", "affordable-housing-77", "affordable-housing-72", "affordable-housing-62",
  "crenshaw-apartments", "mixed-use-114",
  "covina-residence", "cyclebar", "row-house", "bell-residence-chino", "jurien-bay",
] as const;

const TOUCHED_BLOCKS = [
  "home.services", "home.showreel", "home.process", "home.statement", "home.cta",
  "page.journal", "page.contact",
] as const;

async function main() {
  const projects = SEED_PROJECTS.filter((p) => (TOUCHED_PROJECT_SLUGS as readonly string[]).includes(p.slug));
  for (const p of projects) {
    const { slug, ...rest } = p;
    const data = { ...rest, services: rest.services as unknown as Prisma.InputJsonValue, gallery: rest.gallery as unknown as Prisma.InputJsonValue };
    await db.project.upsert({ where: { slug }, update: { ...data, deletedAt: null }, create: { slug, ...data } });
  }

  for (const key of TOUCHED_BLOCKS) {
    const data = structuredClone(BLOCK_DEFAULTS[key]) as unknown as Prisma.InputJsonValue;
    await db.block.upsert({ where: { key }, update: { data, draft: Prisma.DbNull }, create: { key, data } });
  }

  let galleryCreated = 0;
  for (const g of SEED_GALLERY) {
    const existing = await db.galleryItem.findFirst({ where: { title: g.title, deletedAt: null } });
    if (!existing) {
      await db.galleryItem.create({ data: g });
      galleryCreated += 1;
    }
  }

  console.log("Sync complete:", { projectsUpserted: projects.length, blocksRefreshed: TOUCHED_BLOCKS.length, galleryCreated });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
