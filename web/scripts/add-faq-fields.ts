/**
 * One-off: merge-patches the new `description`/support-row fields into the
 * live `home.faq` block (added alongside the gradient/icon redesign) without
 * touching any admin-edited existing fields.
 *
 * Run from web/:  npx tsx scripts/add-faq-fields.ts
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

const NEW_FIELDS = {
  description: "Everything you need to know about our process, timelines, and how we take a project from first sketch to completion.",
  supportLabel: "Need more help?",
  supportBody: "We're happy to talk through your brief in more detail.",
  supportCta: "Contact us",
};

async function main() {
  const row = await db.block.findUnique({ where: { key: "home.faq" } });
  if (!row) {
    console.log("home.faq: no DB row yet — defaults.ts values will apply on first read");
    return;
  }
  const data = (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>;
  const patched = { ...NEW_FIELDS, ...data };
  await db.block.update({ where: { key: "home.faq" }, data: { data: patched as Prisma.InputJsonValue } });
  console.log("home.faq: patched with description/support fields");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
