/**
 * One-off: fills remaining placeholder "real information" with plausible
 * random values, since the client will correct them from the admin later
 * (project years in Projects; phone/address already hand-set in defaults.ts
 * — this script only needs to patch the running DB + assign per-project years).
 *
 * Run from web/:  npx tsx scripts/fill-placeholder-stats.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

const SLUGS = [
  "apartments-hesperia", "town-homes-la-habra", "senior-housing-fontana", "moreno-valley",
  "hesperia-47-west", "condominium-temple-simi-valley", "office-san-diego", "hesperia-commercial",
  "auto-part-riverside", "truck-servicing-fontana", "cannabis-lounge", "sfr-lot-07", "sfr-lot-09",
  "san-pedro-house", "tustin-house", "rollaway-6663",
  "affordable-housing-136", "affordable-housing-77", "affordable-housing-72", "affordable-housing-62",
  "crenshaw-apartments", "mixed-use-114", "studio-apartment-158", "ball-residence", "sfr-lot-08",
  "fire-rebuild-kagawa-st", "fire-rebuild-mckendree-01", "fire-rebuild-mckendree-02", "fire-rebuild-temecula",
];

// Weighted toward the firm's real founding year (2021) through present.
const YEAR_POOL = ["2021", "2022", "2022", "2023", "2023", "2023", "2024", "2024", "2025"];
const randomYear = () => YEAR_POOL[Math.floor(Math.random() * YEAR_POOL.length)];

async function main() {
  // 1) Rewrite SEED_PROJECTS in defaults.ts so fresh seeds match the DB.
  const file = path.resolve(__dirname, "..", "src", "content", "defaults.ts");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const yearMap: Record<string, string> = {};

  for (let i = 0; i < lines.length; i++) {
    for (const slug of SLUGS) {
      if (lines[i].includes(`slug: "${slug}"`) && lines[i].includes('year: ""')) {
        const year = randomYear();
        yearMap[slug] = year;
        lines[i] = lines[i].replace('year: ""', `year: "${year}"`);
        break;
      }
    }
  }
  fs.writeFileSync(file, lines.join("\n"));
  console.log(`defaults.ts: assigned years to ${Object.keys(yearMap).length}/${SLUGS.length} projects`);

  // 2) Patch the running DB to match (upsert by slug — only touches `year`).
  let dbUpdated = 0;
  for (const [slug, year] of Object.entries(yearMap)) {
    const res = await db.project.updateMany({ where: { slug }, data: { year } });
    dbUpdated += res.count;
  }

  // 3) Merge-patch the `site` block's phone/address — never overwrite the
  //    whole JSON blob, so any other admin-edited fields survive untouched.
  const site = await db.block.findUnique({ where: { key: "site" } });
  if (site) {
    const data = (site.data && typeof site.data === "object" ? site.data : {}) as Record<string, unknown>;
    const patched = {
      ...data,
      phone: "+1 (310) 555-0148",
      address1: "1420 Sepulveda Blvd, Suite 310",
      address2: "Los Angeles, CA 90025",
    };
    await db.block.update({ where: { key: "site" }, data: { data: patched as Prisma.InputJsonValue } });
    console.log("site block: phone/address patched");
  } else {
    console.log("site block: no row yet — defaults.ts values will apply on first read");
  }

  console.log("DB projects updated:", dbUpdated);
  console.log("Year assignments:", yearMap);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
