// Sentence-cases SHOUTY ALL-CAPS section kickers.
//
// The old eyebrow style forced uppercase in CSS, so content was authored in
// caps and the two happened to agree. The quieter variants (--rule, --plain)
// deliberately do NOT transform case, which left "WHO WE ARE" shouting in a
// treatment designed to be calm. Casing belongs to the content; the variant
// decides whether to uppercase it.
//
// Only touches strings that are entirely caps, so intentional mixed-case and
// acronym-bearing copy is left alone.
//
// Usage (from web/):
//   node scripts/sentence-case-kickers.mjs          # dry run
//   node scripts/sentence-case-kickers.mjs --apply

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");

const FIELDS = new Set(["kicker", "label", "eyebrow"]);
// Entirely caps, at least two letters, and more than one word or a long word -
// keeps short acronyms like "FAQ" or "SD" from being mangled.
const SHOUTY = (s) => /^[^a-z]*$/.test(s) && (s.match(/[A-Z]/g) || []).length >= 4;
const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

let count = 0;
for (const b of await db.block.findMany()) {
  let changed = false;
  const walk = (node, path, key) => {
    if (typeof node === "string") {
      if (FIELDS.has(key) && SHOUTY(node)) {
        const next = sentence(node);
        console.log(`${b.key}${path}\n  - ${node}\n  + ${next}`);
        changed = true;
        count++;
        return next;
      }
      return node;
    }
    if (Array.isArray(node)) return node.map((v, i) => walk(v, `${path}[${i}]`, key));
    if (node && typeof node === "object") {
      const out = {};
      for (const k of Object.keys(node)) out[k] = walk(node[k], `${path}.${k}`, k);
      return out;
    }
    return node;
  };
  const next = walk(b.data, "", "");
  if (changed && apply) await db.block.update({ where: { key: b.key }, data: { data: next } });
}

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${count} strings`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
