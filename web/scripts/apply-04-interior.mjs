/**
 * Wires the 04_Interior batch (see optimize-04-interior.mjs) into the DB:
 * appends new gallery images to bell-residence-chino and jurien-bay, and
 * creates 7 new "interior" category projects after the existing sort order.
 *
 * Usage: node scripts/apply-04-interior.mjs [--apply]
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");

const APPEND = {
  "bell-residence-chino": ["/projects/bell-residence/02.webp", "/projects/bell-residence/03.webp"],
  "jurien-bay": ["/projects/jurien-bay/03.webp", "/projects/jurien-bay/04.webp", "/projects/jurien-bay/05.webp"],
};

const NEW_PROJECTS = [
  { slug: "bar", title: "Bar", summary: "A bar interior - layered lighting and finishes studied across eight camera views.", sector: "Hospitality", services: ["Interior Architecture", "3D Visualization"], gallery: "bar" },
  { slug: "fisher-st", title: "Fisher St Residence", summary: "A residence interior on Fisher St - great room, kitchen, and patio studied for light and flow.", sector: "Single Family Residence", services: ["Architectural Design", "3D Visualization"], gallery: "fisher-st" },
  { slug: "garments-office", title: "Garments Office", summary: "A garments-company office interior - workspace layout and finishes across nine studies.", sector: "Office", services: ["Interior Architecture", "3D Visualization"], gallery: "garments-office" },
  { slug: "humairas-residence", title: "Humaira's Residence", summary: "A residence interior - living, bedroom, and master spaces studied across four views.", sector: "Single Family Residence", services: ["Architectural Design", "3D Visualization"], gallery: "humairas-residence" },
  { slug: "michaels-residence", title: "Michael's Residence", summary: "A residence interior - living room, dining, and foyer resolved for material and light.", sector: "Single Family Residence", services: ["Architectural Design", "3D Visualization"], gallery: "michaels-residence" },
  { slug: "mr-amins-kitchen", title: "Mr. Amin's Kitchen", summary: "A kitchen interior studied across three camera views.", sector: "Single Family Residence", services: ["Interior Architecture", "3D Visualization"], gallery: "mr-amins-kitchen" },
  { slug: "nandos-restaurant", title: "Nando's Restaurant", summary: "A restaurant interior for Nando's - dining floor and ambience studied across five views.", sector: "Hospitality", services: ["Interior Architecture", "3D Visualization"], gallery: "nandos-restaurant" },
];

const COUNTS = { bar: 8, "fisher-st": 4, "garments-office": 9, "humairas-residence": 4, "michaels-residence": 3, "mr-amins-kitchen": 3, "nandos-restaurant": 5 };
const gal = (slug, n) => Array.from({ length: n }, (_, i) => `/projects/${slug}/${String(i + 1).padStart(2, "0")}.webp`);

const say = (s) => console.log(s);

async function main() {
  say(`--- append (${apply ? "APPLY" : "DRY RUN"}) ---`);
  for (const [slug, add] of Object.entries(APPEND)) {
    const p = await db.project.findUnique({ where: { slug } });
    if (!p) { say(`  !! ${slug} not found`); continue; }
    const gallery = [...(Array.isArray(p.gallery) ? p.gallery : []), ...add];
    say(`  ${slug}: ${p.gallery.length} -> ${gallery.length} images`);
    if (apply) await db.project.update({ where: { id: p.id }, data: { gallery } });
  }

  say("\n--- new projects ---");
  const maxSort = await db.project.aggregate({ where: { deletedAt: null }, _max: { sort: true } });
  let sort = (maxSort._max.sort ?? -1) + 1;
  for (const p of NEW_PROJECTS) {
    const n = COUNTS[p.gallery];
    const gallery = gal(p.gallery, n);
    const data = {
      title: p.title,
      summary: p.summary,
      category: "interior",
      sector: p.sector,
      location: "",
      year: "",
      services: p.services,
      heroImage: gallery[0],
      interiorImage: gallery[1] ?? gallery[0],
      gallery,
      published: true,
      sort,
    };
    say(`  ${p.slug.padEnd(20)} sort=${sort}  ${n} images`);
    if (apply) {
      await db.project.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    }
    sort += 1;
  }

  say(`\n${apply ? "APPLIED" : "DRY RUN"} - re-run with --apply to write`);
}

main().finally(() => db.$disconnect());
