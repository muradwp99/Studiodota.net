/**
 * Targeted sync: real contact info (site block) + the brand accent
 * (appearance block, reverted back to the original champagne-bronze).
 * Same narrow-upsert approach as sync-2026-07-31-updates.ts - only
 * touches these two keys, so it can't clobber anything else admin-edited
 * since the last import.
 *
 * Run from web/:  npx tsx scripts/sync-theme-contact.ts   (DATABASE_URL must be set)
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { BLOCK_DEFAULTS } from "../src/content/defaults";

const db = new PrismaClient();

async function main() {
  const site = await db.block.findUnique({ where: { key: "site" } });
  const siteData = { ...(site?.data as object ?? {}), email: BLOCK_DEFAULTS.site.email, phone: BLOCK_DEFAULTS.site.phone };
  await db.block.upsert({
    where: { key: "site" },
    update: { data: siteData as Prisma.InputJsonValue },
    create: { key: "site", data: siteData as Prisma.InputJsonValue },
  });

  const appearanceData = structuredClone(BLOCK_DEFAULTS.appearance) as unknown as Prisma.InputJsonValue;
  await db.block.upsert({
    where: { key: "appearance" },
    update: { data: appearanceData },
    create: { key: "appearance", data: appearanceData },
  });

  console.log("Sync complete: site email/phone + appearance.accent updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
