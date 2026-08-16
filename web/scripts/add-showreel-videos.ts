/**
 * Wires the 3 remaining self-hosted hero mp4s into the homepage Showreel
 * (ah136-flythrough.mp4 was already wired to Affordable Housing - 136 Units).
 * Edits only the "home.showreel" Block row in place - does NOT touch
 * BLOCK_DEFAULTS, since defaults.ts is stale placeholder content and the
 * live showreel items were hand-edited directly in the DB.
 *
 * Run from web/:  npx tsx scripts/add-showreel-videos.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();

const MP4_BY_TITLE: Record<string, string> = {
  "Ball Residence": "/media/contact-hero.mp4",
  "Mixed Use - 114 Units": "/media/gallery-hero.mp4",
  "Fire Rebuild - McKendree": "/media/services-hero.mp4",
};

async function main() {
  const block = await db.block.findUniqueOrThrow({ where: { key: "home.showreel" } });
  const data = block.data as { items: Array<{ title: string; mp4?: string }> };

  for (const item of data.items) {
    const mp4 = MP4_BY_TITLE[item.title];
    if (mp4) item.mp4 = mp4;
  }

  await db.block.update({
    where: { key: "home.showreel" },
    data: { data: data as unknown as Prisma.InputJsonValue },
  });

  console.log("Updated showreel items:", data.items.map((i) => ({ title: i.title, mp4: i.mp4 })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
