// Replaces the placeholder testimonials (fake names + stock Unsplash photos)
// with 2 real client testimonials. No portrait photos provided - the
// Testimonials component already falls back to an initials avatar when
// `image` is empty (Sections.tsx ~line 745/794), so that's left blank
// rather than using a stock photo for a real named person.
//
// Run from web/:  node scripts/update-testimonials.mjs [--prod]
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const useProd = process.argv.includes("--prod");
const envFile = useProd ? ".env.prod" : ".env";
const url = readFileSync(envFile, "utf8").match(/DATABASE_URL="([^"]+)"/)[1];
const db = new PrismaClient({ datasources: { db: { url } } });

const featured = {
  name: "Ofir Jacob",
  role: "President, South Coast Construction and Development",
  image: "",
  quote: "She is creative, organized, and always on top of the details, which makes the whole process simple for us.",
};
const quotes = [
  {
    name: "Howard B., Esq.",
    role: "Pacific Palisades",
    image: "",
    quote: "Nubaira has been a pleasure to work with and a real asset in our efforts to rebuild the home we lost in the Palisades Fire.",
  },
];

async function main() {
  const block = await db.block.findUniqueOrThrow({ where: { key: "home.testimonials" } });
  const data = { ...block.data, featured, quotes };
  await db.block.update({ where: { key: "home.testimonials" }, data: { data } });
  console.log(`Updated home.testimonials on ${useProd ? "Hostinger" : "local"}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
