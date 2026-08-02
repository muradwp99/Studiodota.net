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

const PROJECT_FIELDS = ["title", "excerpt", "body", "location", "category", "seoTitle", "seoDescription"];

let projectEdits = 0;
let blockEdits = 0;
let stringEdits = 0;
const skippedEmails = [];

for (const p of await db.project.findMany({ where: { deletedAt: null } })) {
  const data = {};
  for (const f of PROJECT_FIELDS) {
    if (shouldFix(p[f])) {
      console.log(`project ${p.slug}.${f}\n  - ${p[f]}\n  + ${fix(p[f])}`);
      data[f] = fix(p[f]);
    } else if (typeof p[f] === "string" && p[f].includes("@")) {
      skippedEmails.push(`project ${p.slug}.${f}`);
    }
  }
  if (Object.keys(data).length) {
    if (apply) await db.project.update({ where: { id: p.id }, data });
    projectEdits++;
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

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${projectEdits} projects, ${blockEdits} blocks (${stringEdits} strings)`);
if (skippedEmails.length) console.log(`skipped as email: ${skippedEmails.join(", ")}`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
