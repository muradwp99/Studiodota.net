/**
 * One-off backfill for the 2 harmless-but-real shape-drift patterns the
 * live-vs-admin audit found in the Block table (see audit dimension
 * "db-shape"): 4 page.* blocks store a partial 3-key seo object instead of
 * the full 13-key shape, and menus.primary items are missing `children`.
 * Both are already defensively coerced everywhere they're read (seo.ts's
 * str()/bool() helpers, Navbar.tsx's `?? []`), so this doesn't fix a visible
 * bug - it just makes the stored data match BLOCK_DEFAULTS's documented
 * shape, the way sanitizeSeo() would produce if someone hit Save on each
 * page's SEO tab.
 *
 * Run from web/:  npx tsx scripts/backfill-block-shape-drift.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { EMPTY_SEO } from "../src/content/defaults";

const db = new PrismaClient();

const SEO_BLOCK_KEYS = ["page.gallery", "page.privacy", "page.projects", "page.services"] as const;

async function main() {
  const seoUpdates: string[] = [];
  for (const key of SEO_BLOCK_KEYS) {
    const block = await db.block.findUnique({ where: { key } });
    if (!block) continue;
    const data = block.data as { seo?: Record<string, unknown> };
    if (!data.seo) continue;
    data.seo = { ...EMPTY_SEO, ...data.seo };
    await db.block.update({ where: { key }, data: { data: data as unknown as Prisma.InputJsonValue } });
    seoUpdates.push(key);
  }

  const menus = await db.block.findUnique({ where: { key: "menus" } });
  let menusUpdated = false;
  if (menus) {
    const data = menus.data as { primary?: Array<{ children?: unknown[] }> };
    if (data.primary?.some((item) => item.children === undefined)) {
      data.primary = data.primary.map((item) => ({ ...item, children: item.children ?? [] }));
      await db.block.update({ where: { key: "menus" }, data: { data: data as unknown as Prisma.InputJsonValue } });
      menusUpdated = true;
    }
  }

  console.log("Backfilled SEO shape on:", seoUpdates);
  console.log("Backfilled menus.primary children:", menusUpdated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
