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
const envFile = useProd ? ".env.prod" : ".env";
const url = readFileSync(envFile, "utf8").match(/DATABASE_URL="([^"]+)"/)![1];
const db = new PrismaClient({ datasources: { db: { url } } });

type Row = Record<string, unknown>;
const asRow = (v: unknown): Row | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : null;

/** Merge `patch` into the stored row, seeding from defaults if absent. */
async function patchBlock(key: string, patch: Row) {
  const row = await db.block.findUnique({ where: { key } });
  const base = asRow(row?.data) ?? (BLOCK_DEFAULTS[key as keyof typeof BLOCK_DEFAULTS] as Row) ?? {};
  const data = { ...base, ...patch } as never;
  await db.block.upsert({ where: { key }, create: { key, data }, update: { data } });
  console.log(`  ${row ? "updated" : "created"}  ${key}`);
}

async function main() {
  console.log(`Applying content updates to ${useProd ? "Hostinger" : "local"} ...`);

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
  const why = BLOCK_DEFAULTS["home.whyChoose"];
  await patchBlock("home.whyChoose", {
    cardMidTop: { ...why.cardMidTop, end: projects.length },
    cardMidBottom: { ...why.cardMidBottom, end: cities },
    cardRight: { ...why.cardRight, end: sectors },
  });

  await patchBlock("home.showreel", { items: BLOCK_DEFAULTS["home.showreel"].items });

  // The social card was a 654x654 render — under the 1200x630 minimum, so
  // every share upscaled and square-cropped it.
  await patchBlock("site", { ogImage: BLOCK_DEFAULTS.site.ogImage });

  // Pre-Design now carries the concept study the client supplied, replacing
  // another use of that same 654x654 render; phase 03 is renamed to
  // "Architecture Design", which moves its anchor id too.
  await patchBlock("page.services", { items: BLOCK_DEFAULTS["page.services"].items });
  await db.redirect.upsert({
    where: { from: "/services#design-development" },
    create: { from: "/services#design-development", to: "/services#architecture-design", permanent: true },
    update: { to: "/services#architecture-design", permanent: true },
  });

  // Site tagline / meta title.
  await patchBlock("site", { tagline: BLOCK_DEFAULTS.site.tagline, metaTitle: BLOCK_DEFAULTS.site.metaTitle });

  const homeAbout = BLOCK_DEFAULTS["home.about"];
  await patchBlock("home.about", {
    stats: homeAbout.stats.map((s) =>
      s.label === "Projects in the portfolio" ? { ...s, end: projects.length }
      : s.label === "Sectors served" ? { ...s, end: sectors }
      : s,
    ),
  });

  // 3 — the homepage section goes dark; the content lives on its own page.
  const layout = await db.block.findUnique({ where: { key: "home.layout" } });
  const stored = asRow(layout?.data)?.sections as { id: string; enabled: boolean }[] | undefined;
  const sections = (stored ?? BLOCK_DEFAULTS["home.layout"].sections).map((s) =>
    s.id === "testimonials" ? { ...s, enabled: false } : s,
  );
  await patchBlock("home.layout", { sections });
  await patchBlock("page.clientVoices", BLOCK_DEFAULTS["page.clientVoices"] as unknown as Row);

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
