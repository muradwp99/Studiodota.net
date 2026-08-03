// Replaces "@" used as the word "at" across project titles and CMS block
// content: "Apartments @ Hesperia" -> "Apartments at Hesperia".
//
// Slugs are deliberately NOT touched, so existing URLs keep working.
// Email addresses are detected and skipped - studioa.arch@gmail.com must
// survive this untouched.
//
// Usage (from web/):
//   node scripts/rename-at.mjs          # dry run, prints every change
//   node scripts/rename-at.mjs --apply  # write to the database
//
// Re-runnable: once applied there is nothing left to match.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");

// "@" as a word needs whitespace on at least one side. An email address
// (name@domain.tld) has none, which is what keeps it out of the match.
const AT = /\s*@\s*/g;
const EMAILISH = /[A-Za-z0-9._%+-]@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const fix = (s) => s.replace(AT, " at ").replace(/\s{2,}/g, " ").trim();
const shouldFix = (s) => typeof s === "string" && s.includes("@") && !EMAILISH.test(s);

// `seo` is a JSON column, the rest are scalars — deepFix below handles both.
const PROJECT_FIELDS = ["title", "summary", "excerpt", "body", "location", "category", "sector", "seo", "seoTitle", "seoDescription"];

let projectEdits = 0;
let blockEdits = 0;
let stringEdits = 0;
const skippedEmails = [];

// Walks strings at any depth. Projects need this and not just a scalar-column
// loop, because `seo` is a JSON column: a scalar-only pass renamed the visible
// title but left "Apartments @ Hesperia" inside seo.title, so the page heading
// and its <title>/og:title disagreed.
const deepFix = (node, path, onHit) => {
  if (typeof node === "string") {
    if (shouldFix(node)) {
      onHit(path, node, fix(node));
      return fix(node);
    }
    if (node.includes("@")) skippedEmails.push(path);
    return node;
  }
  if (Array.isArray(node)) return node.map((v, i) => deepFix(v, `${path}[${i}]`, onHit));
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) out[k] = deepFix(node[k], `${path}.${k}`, onHit);
    return out;
  }
  return node;
};

for (const p of await db.project.findMany({ where: { deletedAt: null } })) {
  const data = {};
  for (const f of PROJECT_FIELDS) {
    let touched = false;
    const next = deepFix(p[f], `project ${p.slug}.${f}`, (path, from, to) => {
      console.log(`${path}\n  - ${from}\n  + ${to}`);
      touched = true;
    });
    if (touched) data[f] = next;
  }
  if (Object.keys(data).length) {
    if (apply) await db.project.update({ where: { id: p.id }, data });
    projectEdits++;
  }
}

// Gallery items carry their own copy of the project titles, so they need the
// same pass - missing this table left "@" visible on /gallery after the
// projects and blocks were already clean.
let galleryEdits = 0;
for (const g of await db.galleryItem.findMany().catch(() => [])) {
  const data = {};
  for (const f of ["title", "sector"]) {
    if (shouldFix(g[f])) {
      console.log(`gallery ${g.id}.${f}\n  - ${g[f]}\n  + ${fix(g[f])}`);
      data[f] = fix(g[f]);
    }
  }
  if (Object.keys(data).length) {
    if (apply) await db.galleryItem.update({ where: { id: g.id }, data });
    galleryEdits++;
  }
}

for (const b of await db.block.findMany()) {
  let changed = false;
  const walk = (node, path) => {
    if (typeof node === "string") {
      if (shouldFix(node)) {
        console.log(`block ${b.key}${path}\n  - ${node}\n  + ${fix(node)}`);
        changed = true;
        stringEdits++;
        return fix(node);
      }
      if (node.includes("@")) skippedEmails.push(`block ${b.key}${path}`);
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
  if (changed) {
    if (apply) await db.block.update({ where: { key: b.key }, data: { data: next } });
    blockEdits++;
  }
}

console.log(
  `\n${apply ? "APPLIED" : "DRY RUN"}: ${projectEdits} projects, ${galleryEdits} gallery items, ${blockEdits} blocks (${stringEdits} strings)`,
);
if (skippedEmails.length) console.log(`skipped as email: ${skippedEmails.join(", ")}`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
