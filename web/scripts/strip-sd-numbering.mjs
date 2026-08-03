// Removes the decorative "(SD 02) - " prefix from section kickers.
//
// The numbering implied an ordered sequence, but the homepage sections are not
// one - nobody reads "WHO WE ARE" as step 2 of anything, and the numbers were
// not even contiguous (02, 04). A marker should encode something true about
// the block it labels; this one just decorated it. The one place ordering is
// real - the six-step work process - keeps its numbers.
//
// Usage (from web/):
//   node scripts/strip-sd-numbering.mjs          # dry run
//   node scripts/strip-sd-numbering.mjs --apply

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");

// "(SD 02) - WHO WE ARE" -> "WHO WE ARE". Also tolerates en/em dashes and a
// missing space, and the bare "SD 02" form without parentheses.
const SD_PREFIX = /^\(?\s*SD\s*\d+\s*\)?\s*[-–—]?\s*/i;

let count = 0;
for (const b of await db.block.findMany()) {
  let changed = false;
  const walk = (node, path) => {
    if (typeof node === "string") {
      if (SD_PREFIX.test(node)) {
        const next = node.replace(SD_PREFIX, "").trim();
        if (next && next !== node) {
          console.log(`${b.key}${path}\n  - ${node}\n  + ${next}`);
          changed = true;
          count++;
          return next;
        }
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

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${count} strings`);
if (!apply) console.log("re-run with --apply to write these changes");

await db.$disconnect();
