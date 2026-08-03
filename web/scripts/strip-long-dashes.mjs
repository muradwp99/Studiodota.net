// Replaces long dashes in CMS content with plain punctuation.
//
// The site's house style uses a hyphen, not an em/en dash (see the earlier
// content dash cleanup). This covers the database, which is what the live
// site actually renders - the content/*.ts defaults are already clean.
//
//   "a — b"  -> "a - b"     (spaced: keep it as a spaced hyphen)
//   "a—b"    -> "a - b"     (unspaced em dash reads as a break, so space it)
//   "10–20"  -> "10-20"     (en dash between digits is a range, close it up)
//
// Usage (from web/):
//   node scripts/strip-long-dashes.mjs          # dry run
//   node scripts/strip-long-dashes.mjs --apply

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");

const hasLongDash = (s) => /[–—‒―]/.test(s);
const fix = (s) =>
  s
    // numeric ranges close up: 10–20 -> 10-20
    .replace(/(\d)\s*[–—‒―]\s*(\d)/g, "$1-$2")
    // everything else becomes a spaced hyphen
    .replace(/\s*[–—‒―]\s*/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();

let count = 0;

for (const b of await db.block.findMany()) {
  let changed = false;
  const walk = (node, path) => {
    if (typeof node === "string") {
      if (hasLongDash(node)) {
        const next = fix(node);
        console.log(`block ${b.key}${path}\n  - ${node.slice(0, 100)}\n  + ${next.slice(0, 100)}`);
        changed = true;
        count++;
        return next;
      }
      return node;
    }
    if (Array.isArray(node)) return node.map((v, i) => walk(v, `${path}[${i}]`));
    if (node && typeof node === "object") {
      const out = {};
      for (const k of Object.keys(node)) out[k] = walk(node[k], `${path}.${k}`);
      return out;
    }
    return node;
  };
  const next = walk(b.data, "");
  if (changed && apply) await db.block.update({ where: { key: b.key }, data: { data: next } });
}

const PROJECT_FIELDS = ["title", "summary", "excerpt", "body", "location", "category", "sector", "seoTitle", "seoDescription"];
for (const p of await db.project.findMany({ where: { deletedAt: null } })) {
  const data = {};
  for (const f of PROJECT_FIELDS) {
    if (typeof p[f] === "string" && hasLongDash(p[f])) {
      console.log(`project ${p.slug}.${f}\n  - ${p[f].slice(0, 100)}\n  + ${fix(p[f]).slice(0, 100)}`);
      data[f] = fix(p[f]);
      count++;
    }
  }
  if (Object.keys(data).length && apply) await db.project.update({ where: { id: p.id }, data });
}

for (const g of await db.galleryItem.findMany().catch(() => [])) {
  const data = {};
  for (const f of ["title", "sector"]) {
    if (typeof g[f] === "string" && hasLongDash(g[f])) {
      console.log(`gallery ${g.id}.${f}\n  - ${g[f]}\n  + ${fix(g[f])}`);
      data[f] = fix(g[f]);
      count++;
    }
  }
  if (Object.keys(data).length && apply) await db.galleryItem.update({ where: { id: g.id }, data });
}

for (const post of await db.post.findMany({ where: { deletedAt: null } }).catch(() => [])) {
  const data = {};
  for (const f of ["title", "excerpt", "body", "seoTitle", "seoDescription"]) {
    if (typeof post[f] === "string" && hasLongDash(post[f])) {
      console.log(`post ${post.slug}.${f}\n  - ${post[f].slice(0, 90)}\n  + ${fix(post[f]).slice(0, 90)}`);
      data[f] = fix(post[f]);
      count++;
    }
  }
  if (Object.keys(data).length && apply) await db.post.update({ where: { id: post.id }, data });
}

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${count} strings`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
