// One-off: full replace of the Hostinger production DB with local dev's data,
// per explicit user instruction. Backs up Hostinger's current rows to a local
// JSON file first (outside the repo) as a safety net before deleting anything.
//
// Run from web/:  node scripts/migrate-local-to-hostinger.mjs
import { readFileSync, writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const LOCAL_URL = readFileSync("D:/Studiodota.net/web/.env", "utf8").match(/DATABASE_URL="([^"]+)"/)[1];
const PROD_URL = readFileSync("D:/Studiodota.net/web/.env.prod", "utf8").match(/DATABASE_URL="([^"]+)"/)[1];

const localDb = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
const prodDb = new PrismaClient({ datasources: { db: { url: PROD_URL } } });

// User before Session (FK); the rest have no cross-table FKs. Insert walks
// this forward (parents first), delete walks it reversed (children first).
const TABLES = ["user", "session", "block", "project", "post", "galleryItem", "page", "media", "redirect", "notFoundLog", "contactMessage"];

async function main() {
  // 1. Backup Hostinger's current data.
  const backup = {};
  for (const t of TABLES) backup[t] = await prodDb[t].findMany();
  const backupPath = `C:/Users/murad/AppData/Local/Temp/claude/D--Studiodota-net/7c8abcef-73ea-4e3a-9ae5-c781aa98c110/scratchpad/hostinger-backup-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log("Backed up Hostinger data to:", backupPath);
  console.log("Backup row counts:", Object.fromEntries(TABLES.map((t) => [t, backup[t].length])));

  // 2. Delete Hostinger rows, children first.
  for (const t of [...TABLES].reverse()) {
    await prodDb[t].deleteMany({});
  }
  console.log("Cleared all Hostinger tables.");

  // 3. Copy local rows into Hostinger, parents first.
  const inserted = {};
  for (const t of TABLES) {
    const rows = await localDb[t].findMany();
    if (rows.length) await prodDb[t].createMany({ data: rows });
    inserted[t] = rows.length;
  }
  console.log("Inserted row counts:", JSON.stringify(inserted, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await localDb.$disconnect();
    await prodDb.$disconnect();
  });
