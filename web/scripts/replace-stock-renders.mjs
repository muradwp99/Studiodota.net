// Swaps every /media/renders/*.jpg reference for one of the studio's own renders.
//
// The site was built on a template whose stock imagery lives in
// public/media/renders/ - atelier-house, meridian-sports, harbour-masterplan and
// so on are somebody else's buildings. Most of it has been replaced, but stale
// references survive in places nobody looks: a dead `home.hero.slides` array
// still serialised into the homepage payload, CMS page blocks, and unpublished
// gallery rows that would start showing other people's work the moment someone
// ticked "published" in the admin.
//
// Mapping is by subject where the stock name implies one, so the substitution
// stays sensible rather than arbitrary.
//
// Usage (from web/):
//   node scripts/replace-stock-renders.mjs          # dry run
//   node scripts/replace-stock-renders.mjs --apply

import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const P = (p) => `/projects/${p}`;

// stock render name -> a real project render of comparable subject
const MAP = {
  hero: P("office-san-diego/01.webp"),
  interior: P("cannabis-lounge/01.webp"),
  "atelier-house": P("tustin-house/01.webp"),
  "urban-oasis": P("moreno-valley/01.webp"),
  "leafy-precinct": P("senior-housing-fontana/01.webp"),
  "harbour-masterplan": P("affordable-housing-136/01.webp"),
  "meridian-sports": P("condominium-temple-simi-valley/01.webp"),
  "office-tower": P("office-san-diego/04.webp"),
  "riverside-warehouse": P("truck-servicing-fontana/01.webp"),
  "rooftop-pool": P("moreno-valley/02.webp"),
  "living-pool": P("moreno-valley/03.webp"),
};
const FALLBACK = P("office-san-diego/01.webp");

const resolve = (url) => {
  const name = (url.match(/\/media\/renders\/([^/.]+)\./) || [])[1];
  return (name && MAP[name]) || FALLBACK;
};

// Fail before writing if any target is missing.
const bad = [...new Set([...Object.values(MAP), FALLBACK])].filter(
  (p) => !existsSync(path.join(path.resolve("public"), p)),
);
if (bad.length) {
  console.error("These replacement files do not exist under public/:\n  " + bad.join("\n  "));
  process.exit(1);
}

let count = 0;
const rewrite = (node, label) => {
  if (typeof node === "string") {
    if (node.includes("/media/renders/")) {
      const next = resolve(node);
      console.log(`${label}\n  - ${node}\n  + ${next}`);
      count++;
      return next;
    }
    return node;
  }
  if (Array.isArray(node)) return node.map((v, i) => rewrite(v, `${label}[${i}]`));
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) out[k] = rewrite(node[k], `${label}.${k}`);
    return out;
  }
  return node;
};

for (const b of await db.block.findMany()) {
  const before = count;
  const next = rewrite(b.data, `block ${b.key}`);
  if (count > before && apply) await db.block.update({ where: { key: b.key }, data: { data: next } });
}

for (const [model, key] of [["project", "slug"], ["post", "slug"], ["galleryItem", "id"], ["page", "slug"]]) {
  let rows = [];
  try {
    rows = await db[model].findMany();
  } catch {
    continue;
  }
  for (const r of rows) {
    const data = {};
    for (const f of Object.keys(r)) {
      if (f === "id" || r[f] === null) continue;
      const before = count;
      const next = rewrite(r[f], `${model} ${r[key]}.${f}`);
      if (count > before) data[f] = next;
    }
    if (Object.keys(data).length && apply) await db[model].update({ where: { id: r.id }, data });
  }
}

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${count} references`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
