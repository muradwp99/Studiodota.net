/**
 * Client-requested content pass, 2026-09-04. Mirrors src/content/defaults.ts
 * into the live Block rows — defaults only cover a fresh or unreachable DB, so
 * without this the running site keeps serving the old stored values.
 *
 *   1. Showreel titles renamed to what each film actually shows.
 *   2. Portfolio stats recounted from the Project table instead of rounded.
 *   3. Testimonials moved off the homepage into page.clientVoices.
 *   4. "Client Voices" added to the header and footer menus.
 *   5. Who we are gains the What we do / capabilities / qualifications copy.
 *
 * Idempotent — safe to run twice. From web/:
 *   npx tsx scripts/apply-2026-09-04-updates.ts [--prod]
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { BLOCK_DEFAULTS } from "../src/content/defaults";

const useProd = process.argv.includes("--prod");
const dryRun = process.argv.includes("--dry-run");
const envFile = useProd ? ".env.prod" : ".env";
const url = readFileSync(envFile, "utf8").match(/DATABASE_URL="([^"]+)"/)![1];
const db = new PrismaClient({ datasources: { db: { url } } });

type Row = Record<string, unknown>;
const asRow = (v: unknown): Row | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : null;

/**
 * Merge `patch` into the stored row, seeding from defaults if absent.
 *
 * With --dry-run nothing is written: it prints, key by key, what the write
 * would change. Same code path as the real run, so the rehearsal can't drift
 * from what actually executes.
 */
async function patchBlock(key: string, patch: Row) {
  const row = await db.block.findUnique({ where: { key } });
  const base = asRow(row?.data) ?? (BLOCK_DEFAULTS[key as keyof typeof BLOCK_DEFAULTS] as Row) ?? {};
  const data = { ...base, ...patch } as never;

  if (dryRun) {
    const changed = Object.keys(patch).filter((k) => JSON.stringify(base[k]) !== JSON.stringify(patch[k]));
    const added = Object.keys(patch).filter((k) => base[k] === undefined);
    console.log(`  ${row ? "would update" : "would CREATE"}  ${key}`);
    if (!row) {
      console.log(`      seeds ${Object.keys(patch).length} keys from defaults`);
    } else if (!changed.length) {
      console.log(`      no change (already applied)`);
    } else {
      for (const k of changed) {
        const tag = added.includes(k) ? "add   " : "change";
        console.log(`      ${tag} ${k}: ${JSON.stringify(base[k])?.slice(0, 80) ?? "(absent)"}`);
        console.log(`             -> ${JSON.stringify(patch[k])?.slice(0, 80)}`);
      }
    }
    const untouched = Object.keys(base).filter((k) => !(k in patch));
    if (untouched.length) console.log(`      keeps: ${untouched.join(", ")}`);
    return;
  }

  await db.block.upsert({ where: { key }, create: { key, data }, update: { data } });
  console.log(`  ${row ? "updated" : "created"}  ${key}`);
}

async function main() {
  console.log(`${dryRun ? "DRY RUN against" : "Applying content updates to"} ${useProd ? "Hostinger (PRODUCTION)" : "local"} ...`);

  // 1 + 2 — recount from the source of truth so the stats can't drift again
  // the next time projects are published.
  const projects = await db.project.findMany({
    where: { published: true, deletedAt: null },
    select: { sector: true, location: true },
  });
  const sectors = new Set(projects.map((p) => p.sector).filter(Boolean)).size;
  const cities = new Set(
    projects.map((p) => (p.location ?? "").split(",")[0].trim()).filter(Boolean),
  ).size;
  console.log(`  counted ${projects.length} published projects, ${sectors} sectors, ${cities} cities`);

  // The "Why choose us" cards count the same portfolio as the stats band —
  // they drifted apart before (29 vs 25 projects, 7 sectors vs 14), so both
  // are recounted from the same query here.
  // Only the counts and their suffixes are this pass's business — the card
  // images and labels stay as stored.
  const why = BLOCK_DEFAULTS["home.whyChoose"];
  const whyStored = asRow((await db.block.findUnique({ where: { key: "home.whyChoose" } }))?.data) ?? {};
  const card = (key: "cardMidTop" | "cardMidBottom" | "cardRight", end: number) => ({
    ...(asRow(whyStored[key]) ?? (why[key] as unknown as Row)),
    end,
    suffix: why[key].suffix,
  });
  await patchBlock("home.whyChoose", {
    cardMidTop: card("cardMidTop", projects.length),
    cardMidBottom: card("cardMidBottom", cities),
    cardRight: card("cardRight", sectors),
  });

  // Showreel: only the titles and kickers were wrong. Merge them onto the
  // STORED items rather than replacing the array, so each entry keeps whatever
  // image/mp4/youtubeId the live row carries.
  const reelStored = (asRow((await db.block.findUnique({ where: { key: "home.showreel" } }))?.data)?.items as Row[]) ?? [];
  const reelWanted = BLOCK_DEFAULTS["home.showreel"].items;
  await patchBlock("home.showreel", {
    items: (reelStored.length ? reelStored : (reelWanted as unknown as Row[])).map((stored, i) => {
      const want = reelWanted[i];
      return want ? { ...stored, title: want.title, kicker: want.kicker } : stored;
    }),
  });

  // The social card was a 654x654 render — under the 1200x630 minimum, so
  // every share upscaled and square-cropped it.
  await patchBlock("site", { ogImage: BLOCK_DEFAULTS.site.ogImage });

  // Services: this pass changes exactly two phases — Pre-Design gets the
  // client's concept study, and phase 03 is renamed to "Architecture Design"
  // (which moves its anchor id). Every other phase keeps its stored value:
  // production's images for Schematic Design, Construction Documentation and
  // Additional Services were picked in the admin and differ from defaults.ts,
  // so writing the defaults array wholesale would quietly revert them.
  const svcStored = (asRow((await db.block.findUnique({ where: { key: "page.services" } }))?.data)?.items as Row[]) ?? [];
  const svcWanted = BLOCK_DEFAULTS["page.services"].items;
  await patchBlock("page.services", {
    items: (svcStored.length ? svcStored : (svcWanted as unknown as Row[])).map((stored, i) => {
      const want = svcWanted[i];
      if (!want) return stored;
      if (want.id === "pre-design") return { ...stored, image: want.image };
      if (want.id === "architecture-design") return { ...stored, id: want.id, title: want.title, image: want.image };
      return stored;
    }),
  });
  // No redirect for the old #design-development anchor: proxy.ts matches on
  // req.nextUrl.pathname, and a fragment is never sent to the server, so such a
  // row could never fire. The in-site links are generated from this id
  // (layout.tsx builds the mega-menu hrefs from it), so they moved with it; an
  // external deep link just lands on /services at the top of the page.

  // Site tagline / meta title.
  await patchBlock("site", { tagline: BLOCK_DEFAULTS.site.tagline, metaTitle: BLOCK_DEFAULTS.site.metaTitle });

  // The admin's category dropdown had drifted from the public filter bar:
  // "fire-rebuild" could not be picked at all (so the category this pass
  // introduces was unreachable from the editor) and "office" was selectable
  // but had no filter, stranding anything filed under it.
  await patchBlock("taxonomies", { projectCategories: BLOCK_DEFAULTS.taxonomies.projectCategories });

  // Stats: merge onto the stored rows matched by label, so a stat the client
  // added in the admin survives instead of being dropped by a 4-item replace.
  const homeAbout = BLOCK_DEFAULTS["home.about"];
  const statsStored = (asRow((await db.block.findUnique({ where: { key: "home.about" } }))?.data)?.stats as Row[]) ?? [];
  const wantStat = (label: unknown) => homeAbout.stats.find((s) => s.label === label);
  await patchBlock("home.about", {
    stats: (statsStored.length ? statsStored : (homeAbout.stats as unknown as Row[])).map((stored) => {
      const want = wantStat(stored.label);
      if (!want) return stored;
      const end =
        want.label === "Projects in the portfolio" ? projects.length
        : want.label === "Sectors served" ? sectors
        : want.end;
      return { ...stored, end, suffix: want.suffix, desc: want.desc };
    }),
  });

  // 3 — the homepage section goes dark; the content lives on its own page.
  const layout = await db.block.findUnique({ where: { key: "home.layout" } });
  const stored = asRow(layout?.data)?.sections as { id: string; enabled: boolean }[] | undefined;
  const sections = (stored ?? BLOCK_DEFAULTS["home.layout"].sections).map((s) =>
    s.id === "testimonials" ? { ...s, enabled: false } : s,
  );
  await patchBlock("home.layout", { sections });
  // SEED ONLY, never overwrite. Passing the whole defaults object as a patch
  // would make every top-level key win over the stored row — so a second run
  // would blank exactly the two fields this block exists to have filled in
  // later: featured[].paragraphs (the Vargas transcript) and video.mp4. The
  // header promises this script is safe to run twice, so it has to be.
  // Missing keys are still added, which is how a new field reaches an existing
  // row without touching what an editor has written.
  {
    const key = "page.clientVoices";
    const row = await db.block.findUnique({ where: { key } });
    const stored = asRow(row?.data);
    const seed = BLOCK_DEFAULTS[key] as unknown as Row;
    if (!stored) {
      await patchBlock(key, seed);
    } else {
      const additions = Object.fromEntries(Object.entries(seed).filter(([k]) => stored[k] === undefined));
      if (Object.keys(additions).length) {
        await patchBlock(key, additions);
      } else {
        console.log(`  kept      ${key} (already seeded — editor content left alone)`);
      }
    }
  }

  // 4 — menus. Insert once, after Projects, leaving any client reordering of
  // the other items alone.
  const menus = await db.block.findUnique({ where: { key: "menus" } });
  const menuData = asRow(menus?.data);
  type Item = { label: string; href: string; children?: unknown[] };
  const insertAfter = <T extends Item>(list: T[], afterHref: string, entry: T): T[] => {
    if (list.some((x) => x.href === entry.href)) return list;
    const at = list.findIndex((x) => x.href === afterHref);
    const next = [...list];
    next.splice(at < 0 ? next.length : at + 1, 0, entry);
    return next;
  };
  await patchBlock("menus", {
    primary: insertAfter(
      (menuData?.primary as Item[]) ?? [...BLOCK_DEFAULTS.menus.primary],
      "/projects",
      { label: "Client Voices", href: "/client-voices", children: [] },
    ),
    footerPages: insertAfter(
      (menuData?.footerPages as Item[]) ?? [...BLOCK_DEFAULTS.menus.footerPages],
      "/projects",
      { label: "Client Voices", href: "/client-voices" },
    ),
  });

  // 5 — Who we are: the docx sections that were never on the page, plus the
  // recounted stats.
  const a = BLOCK_DEFAULTS["page.about"];
  await patchBlock("page.about", {
    stats: a.stats.map((s) =>
      s.label === "Projects in the portfolio" ? { ...s, value: String(projects.length) }
      : s.label === "Sectors across Southern California" ? { ...s, value: String(sectors) }
      : s,
    ),
    doLabel: a.doLabel, doTitle: a.doTitle, doIntro: a.doIntro, doBody: a.doBody,
    capabilitiesLabel: a.capabilitiesLabel, capabilitiesTitle: a.capabilitiesTitle,
    capabilities: a.capabilities, capabilitiesClose: a.capabilitiesClose,
    capabilitiesImage: a.capabilitiesImage,
    qualificationsLabel: a.qualificationsLabel, qualificationsTitle: a.qualificationsTitle,
    qualifications: a.qualifications, qualificationsClose: a.qualificationsClose,
  });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
