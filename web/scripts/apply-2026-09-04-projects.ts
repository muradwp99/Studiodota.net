/**
 * Project catalogue pass, 2026-09-04 — the client's review of the portfolio
 * against the Projects.zip delivery.
 *
 *   - Categories: 136 Units to affordable housing; Apartments at Hesperia and
 *     Hesperia at 47 West to multifamily; fire rebuilds into their own
 *     category so they stop hiding inside single family.
 *   - Years corrected per the client's notes.
 *   - Renames: 6663 Rollaway to Stanley Housing, Michael's to Jacob Residence
 *     (slug follows, with a redirect off the old URL), Senior Living sector to
 *     Senior House.
 *   - Publishes Studio Apartment - 158 Units and creates Aiglon House, the two
 *     folders in the zip whose renders were never imported. Run
 *     scripts/import-2026-09-04-projects.mjs first — this wires up the files
 *     that script writes.
 *
 * Idempotent. From web/:
 *   npx tsx scripts/apply-2026-09-04-projects.ts [--prod]
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { EMPTY_SEO } from "../src/content/defaults";

const useProd = process.argv.includes("--prod");
const url = readFileSync(useProd ? ".env.prod" : ".env", "utf8").match(/DATABASE_URL="([^"]+)"/)![1];
const db = new PrismaClient({ datasources: { db: { url } } });

/** Field edits by slug. */
const EDITS: Record<string, Record<string, string | boolean>> = {
  // "In the Mixed Unit I can see there is 136 unit please take to the
  // affordable housing category" — sector already said Affordable Housing,
  // only the filter category was wrong.
  "affordable-housing-136": { category: "affordable-housing", year: "2026" },
  "affordable-housing-62": { year: "2026" },
  "affordable-housing-72": { year: "2025" },
  "affordable-housing-77": { year: "2025" },

  // Fire rebuilds: their own category, all dated 2025.
  "fire-rebuild-mckendree-01": { category: "fire-rebuild", year: "2025" },
  "fire-rebuild-mckendree-02": { category: "fire-rebuild", year: "2025" },
  "fire-rebuild-kagawa-st": { category: "fire-rebuild", year: "2025" },
  "fire-rebuild-temecula": { category: "fire-rebuild", year: "2025" },

  "san-pedro-house": { year: "2024" },
  "rollaway-6663": { title: "Stanley Housing" },
  "senior-housing-fontana": { sector: "Senior House" },

  // Both are apartment blocks; they were filed under mixed use.
  "apartments-hesperia": { category: "multifamily" },
  "hesperia-47-west": { category: "multifamily" },
};

/** Slug changes: old -> new, with a 301 left behind. */
const RENAMES: Record<string, { slug: string; title: string }> = {
  "michaels-residence": { slug: "jacob-residence", title: "Jacob Residence" },
};

const NEW_PROJECTS = [
  {
    slug: "fire-rebuild-aiglon-house",
    title: "Aiglon House",
    summary:
      "A Pacific Palisades fire rebuild - a contemporary residence stepped into its garden, studied from the street approach, the front elevation, and the rear terraces.",
    category: "fire-rebuild",
    sector: "Fire Rebuild",
    location: "Pacific Palisades, CA",
    year: "2025",
    services: ["Architectural Design", "3D Visualization"],
    heroImage: "/projects/fire-rebuild-aiglon-house/01.webp",
    interiorImage: "/projects/fire-rebuild-aiglon-house/03.webp",
    gallery: [
      "/projects/fire-rebuild-aiglon-house/01.webp",
      "/projects/fire-rebuild-aiglon-house/02.webp",
      "/projects/fire-rebuild-aiglon-house/03.webp",
    ],
    published: true,
    sort: 9,
  },
];

/** Slug -> gallery for rows that existed but had no imagery until now. */
const GALLERIES: Record<string, { gallery: string[]; heroImage: string; interiorImage: string; published: boolean }> = {
  "studio-apartment-158": {
    gallery: [1, 2, 3, 4, 5].map((n) => `/projects/studio-apartment-158/0${n}.webp`),
    heroImage: "/projects/studio-apartment-158/01.webp",
    interiorImage: "/projects/studio-apartment-158/03.webp",
    published: true,
  },
};

async function main() {
  console.log(`Applying project catalogue changes to ${useProd ? "Hostinger" : "local"} ...\n`);

  for (const [slug, data] of Object.entries(EDITS)) {
    const row = await db.project.findUnique({ where: { slug } });
    if (!row) {
      console.log(`  skipped   ${slug} (no such project)`);
      continue;
    }
    await db.project.update({ where: { slug }, data });
    console.log(`  edited    ${slug}  ${JSON.stringify(data)}`);
  }

  for (const [oldSlug, { slug, title }] of Object.entries(RENAMES)) {
    const row = await db.project.findUnique({ where: { slug: oldSlug } });
    if (!row) {
      console.log(`  skipped   ${oldSlug} (already renamed or absent)`);
      continue;
    }
    await db.project.update({ where: { slug: oldSlug }, data: { slug, title } });
    await db.redirect.upsert({
      where: { from: `/projects/${oldSlug}` },
      create: { from: `/projects/${oldSlug}`, to: `/projects/${slug}`, permanent: true },
      update: { to: `/projects/${slug}`, permanent: true },
    });
    console.log(`  renamed   ${oldSlug} -> ${slug} ("${title}") + 301`);
  }

  for (const [slug, data] of Object.entries(GALLERIES)) {
    const row = await db.project.findUnique({ where: { slug } });
    if (!row) {
      console.log(`  skipped   ${slug} (no such project)`);
      continue;
    }
    await db.project.update({ where: { slug }, data });
    console.log(`  published ${slug}  (${data.gallery.length} images)`);
  }

  for (const p of NEW_PROJECTS) {
    const existing = await db.project.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await db.project.update({ where: { slug: p.slug }, data: p });
      console.log(`  updated   ${p.slug}`);
    } else {
      await db.project.create({ data: { ...p, seo: EMPTY_SEO } });
      console.log(`  created   ${p.slug}  ("${p.title}")`);
    }
  }

  const remaining = await db.project.findMany({
    where: { published: false, deletedAt: null },
    select: { slug: true, title: true },
  });
  if (remaining.length) {
    console.log(`\nStill unpublished — no renders exist for these, in the zip or anywhere else:`);
    remaining.forEach((r) => console.log(`  ${r.slug}  (${r.title})`));
  }

  const total = await db.project.count({ where: { published: true, deletedAt: null } });
  console.log(`\n${total} published projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
