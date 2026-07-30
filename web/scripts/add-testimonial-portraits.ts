/**
 * One-off: patches the live `home.testimonials` block with real (stock)
 * portrait photos, replacing the abstract SVG-bust placeholders, matched by
 * name so any other admin-edited fields survive untouched.
 *
 * Run from web/:  npx tsx scripts/add-testimonial-portraits.ts
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

const PORTRAITS: Record<string, string> = {
  "Maya Chen": "https://images.unsplash.com/photo-1769636929388-99eff95d3bf1?auto=format&fit=crop&w=800&q=80",
  "Jordan Reyes": "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?auto=format&fit=crop&w=800&q=80",
  "Aisha Patel": "https://images.unsplash.com/photo-1780733058027-680a7c841fe5?auto=format&fit=crop&w=800&q=80",
};

async function main() {
  const row = await db.block.findUnique({ where: { key: "home.testimonials" } });
  if (!row) {
    console.log("home.testimonials: no DB row yet — defaults.ts values will apply on first read");
    return;
  }
  const data = (row.data && typeof row.data === "object" ? row.data : {}) as {
    featured?: { name?: string; image?: string };
    quotes?: { name?: string; image?: string }[];
  };

  let patched = 0;
  if (data.featured?.name && PORTRAITS[data.featured.name]) {
    data.featured.image = PORTRAITS[data.featured.name];
    patched++;
  }
  for (const q of data.quotes ?? []) {
    if (q.name && PORTRAITS[q.name]) {
      q.image = PORTRAITS[q.name];
      patched++;
    }
  }

  await db.block.update({ where: { key: "home.testimonials" }, data: { data: data as Prisma.InputJsonValue } });
  console.log(`home.testimonials: patched ${patched} portrait(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
