/**
 * One-off: (1) replaces every em-dash/en-dash in defaults.ts and the live DB
 * content with a plain hyphen (spaced or tight, matching how the dash was
 * originally used), and (2) writes real focus-keyword/title/description SEO
 * data for every published project, post, and built-in page block (all
 * currently blank — the SEO panel/scoring system was built but never
 * populated). Skips home.about per the client's request.
 *
 * Run from web/:  npx tsx scripts/fix-dashes-and-seo.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

const DASH_RE = /(\s*)[—–](\s*)/g;
function cleanDashes(s: string): string {
  return s.replace(DASH_RE, (_m, before: string, after: string) => (before || after ? " - " : "-"));
}
function deepCleanDashes<T>(value: T): T {
  if (typeof value === "string") return cleanDashes(value) as unknown as T;
  if (Array.isArray(value)) return value.map(deepCleanDashes) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = deepCleanDashes(v);
    return out as T;
  }
  return value;
}

// ---- SEO content (focus keyword kept out of the visible title/description
// only when the page is legal boilerplate, not meant to rank on a term). ----
const PROJECT_SEO: Record<string, { title: string; description: string; focusKeyword: string }> = {
  "apartments-hesperia": { focusKeyword: "multifamily architecture", title: "Apartments @ Hesperia - Multifamily Architecture", description: "A multifamily architecture project in Hesperia, CA, resolved through massing, courtyards, and street presence for a high-desert site." },
  "town-homes-la-habra": { focusKeyword: "townhome architecture", title: "Town Homes @ La Habra - Townhome Architecture", description: "A townhome architecture development in La Habra, CA, with repeating unit rhythm, shared drives, and a warm material palette." },
  "senior-housing-fontana": { focusKeyword: "senior housing design", title: "Senior Housing @ Fontana - Senior Housing Design", description: "Senior housing design in Fontana, CA, built around accessibility, shade, and shared community space across four exterior studies." },
  "moreno-valley": { focusKeyword: "residential architecture", title: "Moreno Valley - Residential Architecture", description: "A residential architecture community in Moreno Valley, CA, with streetscape, building, and amenity-pool studies for every stage." },
  "hesperia-47-west": { focusKeyword: "multifamily development", title: "Hesperia @ 47 West - Multifamily Development", description: "47 West is a Hesperia multifamily development balancing repetition, articulation, and desert light across four camera studies." },
  "condominium-temple-simi-valley": { focusKeyword: "mixed use architecture", title: "Condominium & Temple - Mixed Use Architecture", description: "A mixed use architecture project in Simi Valley, CA, pairing a condominium with a temple on one site, from massing to entry." },
  "office-san-diego": { focusKeyword: "office building design", title: "Office @ San Diego - Office Building Design", description: "An office building design concept in San Diego, CA, with clean lines, a louvered sun screen, and lake-view planning." },
  "hesperia-commercial": { focusKeyword: "commercial architecture", title: "Hesperia @ Commercial - Commercial Architecture", description: "A commercial architecture project in Hesperia, CA, studied through signage, storefront glazing, and a clear customer approach." },
  "auto-part-riverside": { focusKeyword: "commercial building design", title: "Auto Part @ Riverside - Commercial Building Design", description: "A commercial building design for an auto-parts retailer in Riverside, CA, with bold volumes and a clear entry canopy." },
  "truck-servicing-fontana": { focusKeyword: "industrial facility design", title: "Truck Servicing @ Fontana - Industrial Facility Design", description: "An industrial facility design in Fontana, CA, with service bays, yard circulation, and street frontage studied from every angle." },
  "cannabis-lounge": { focusKeyword: "hospitality interior design", title: "Cannabis Lounge - Hospitality Interior Design", description: "A hospitality interior design project for a consumption lounge, shaped by layered lighting, dark joinery, and tuned seating zones." },
  "sfr-lot-07": { focusKeyword: "single family home design", title: "Lot 07 - Single Family Home Design", description: "A single family home design in Southern California, a contemporary two-storey house studied from the front, rear, and above." },
  "sfr-lot-09": { focusKeyword: "single family residence design", title: "Lot 09 - Single Family Residence Design", description: "A single family residence design studied from the street, the yard, and above, part of Studiodota's California portfolio." },
  "san-pedro-house": { focusKeyword: "custom home design", title: "San Pedro House - Custom Home Design", description: "A custom home design in San Pedro, CA, balancing glazing, privacy, and outdoor living across matched front and rear studies." },
  "tustin-house": { focusKeyword: "residential remodel design", title: "Tustin House - Residential Remodel Design", description: "A residential remodel design in Tustin, CA, reimagining an existing home with a new elevation, entry, and material palette." },
  "rollaway-6663": { focusKeyword: "single family home design", title: "6663 Rollaway - Single Family Home Design", description: "A single family home design at 6663 Rollaway, a street-facing residence studied through massing, roofline, and entry sequence." },
};

const POST_SEO: Record<string, { title: string; description: string; focusKeyword: string }> = {
  "designing-for-daylight": { focusKeyword: "designing for daylight", title: "Designing for Daylight - Studiodota Journal", description: "Designing for daylight starts with orientation, glazing, and section, our notes on how light shapes a building's whole feeling." },
  "material-honesty": { focusKeyword: "material honesty", title: "Material Honesty in Modern Architecture", description: "Material honesty means letting concrete, timber, and stone read as themselves rather than dressing them up, a note from Studiodota." },
  "planning-with-people": { focusKeyword: "planning with people", title: "Planning With People, Not Just Plots", description: "Planning with people comes before plots in our approach to public realm design and community masterplanning." },
  "low-carbon-by-design": { focusKeyword: "low carbon by design", title: "Low Carbon by Design, Not by Add-On", description: "Low carbon by design starts with the first sketch, through form, structure, and what you choose not to build, not bolted on later." },
  "interiors-that-last": { focusKeyword: "interiors that last", title: "Interiors That Last: Light, Material, Flow", description: "Interiors that last are the product of light, material, and how people actually move through a space, not an afterthought." },
  "reading-a-site": { focusKeyword: "reading a site", title: "Reading a Site Before Drawing a Line", description: "Reading a site before drawing a line means listening to the land long before it's drawn, our approach to process." },
};

// Keyed by Block key. `home.about` intentionally excluded.
const PAGE_SEO: Record<string, { title: string; description: string; focusKeyword: string }> = {
  "page.services": { focusKeyword: "architecture services", title: "Architecture Services - Studiodota Studio", description: "Full-service architecture services in Southern California, from pre-design and feasibility through construction documentation." },
  "page.projects": { focusKeyword: "architecture portfolio", title: "Architecture Portfolio - Studiodota Projects", description: "Browse our architecture portfolio across Southern California, from single-family homes and remodels to 150-unit communities." },
  "page.gallery": { focusKeyword: "architecture gallery", title: "Architecture Gallery - Renderings & Studies", description: "An architecture gallery of renderings and studies from across the practice, filterable by discipline or viewed all at once." },
  "page.journal": { focusKeyword: "architecture journal", title: "Architecture Journal - Studiodota Blog", description: "Craft, process, and ideas from our architecture journal, covering daylight, materials, sustainability, and building well." },
  "page.contact": { focusKeyword: "architecture firm", title: "Contact Our Architecture Firm - Studiodota", description: "Contact our architecture firm with your brief, site details, drawings, or references, and we'll turn them into a considered design." },
  "page.terms": { focusKeyword: "terms and conditions", title: "Terms and Conditions - Studiodota", description: "The terms and conditions that apply when you use this website or get in touch with us about a project." },
  "page.privacy": { focusKeyword: "privacy policy", title: "Privacy Policy - Studiodota", description: "A plain-English summary of our privacy policy: what we collect when you contact us, why we collect it, and how long we keep it." },
};

async function main() {
  // 1) defaults.ts — blind text-level dash cleanup (safe: comments aren't
  // functionally important either, so uniform cleanup is simplest & reliable).
  const defaultsPath = path.resolve(__dirname, "..", "src", "content", "defaults.ts");
  const before = fs.readFileSync(defaultsPath, "utf8");
  const after = cleanDashes(before);
  fs.writeFileSync(defaultsPath, after);
  const dashCount = (before.match(DASH_RE) ?? []).length;
  console.log(`defaults.ts: cleaned ${dashCount} dash occurrence(s)`);

  // 2) Live DB — Block rows: clean dashes in `data`, and merge in page SEO.
  const blocks = await db.block.findMany();
  let blockDashFixes = 0;
  for (const b of blocks) {
    if (b.key === "home.about") continue; // excluded per client request
    const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
    const cleaned = deepCleanDashes(data) as Record<string, unknown>;
    const cleanedStr = JSON.stringify(cleaned);
    if (cleanedStr !== JSON.stringify(data)) blockDashFixes++;

    const pageSeo = PAGE_SEO[b.key];
    let finalData = cleaned;
    if (pageSeo) {
      const seo = (cleaned.seo && typeof cleaned.seo === "object" ? cleaned.seo : {}) as Record<string, unknown>;
      finalData = { ...cleaned, seo: { ...seo, title: pageSeo.title, description: pageSeo.description, focusKeyword: pageSeo.focusKeyword } };
    }
    await db.block.update({ where: { key: b.key }, data: { data: finalData as Prisma.InputJsonValue } });
  }
  console.log(`DB blocks: dash-cleaned ${blockDashFixes}, SEO written for ${Object.keys(PAGE_SEO).length} page blocks`);

  // 3) Projects — clean dashes in title/summary, write SEO.
  const projects = await db.project.findMany();
  let projSeoWritten = 0;
  for (const p of projects) {
    const title = cleanDashes(p.title);
    const summary = cleanDashes(p.summary);
    const seoInfo = PROJECT_SEO[p.slug];
    const existingSeo = (p.seo && typeof p.seo === "object" ? p.seo : {}) as Record<string, unknown>;
    const seo = seoInfo ? { ...existingSeo, title: seoInfo.title, description: seoInfo.description, focusKeyword: seoInfo.focusKeyword } : deepCleanDashes(existingSeo);
    if (seoInfo) projSeoWritten++;
    await db.project.update({ where: { id: p.id }, data: { title, summary, seo: seo as Prisma.InputJsonValue } });
  }
  console.log(`Projects: ${projects.length} dash-cleaned, SEO written for ${projSeoWritten}`);

  // 4) Posts — clean dashes in title/excerpt/intro/sections, write SEO.
  const posts = await db.post.findMany();
  let postSeoWritten = 0;
  for (const p of posts) {
    const title = cleanDashes(p.title);
    const excerpt = cleanDashes(p.excerpt);
    const intro = cleanDashes(p.intro);
    const sections = deepCleanDashes(p.sections);
    const seoInfo = POST_SEO[p.slug];
    const existingSeo = (p.seo && typeof p.seo === "object" ? p.seo : {}) as Record<string, unknown>;
    const seo = seoInfo ? { ...existingSeo, title: seoInfo.title, description: seoInfo.description, focusKeyword: seoInfo.focusKeyword } : deepCleanDashes(existingSeo);
    if (seoInfo) postSeoWritten++;
    await db.post.update({ where: { id: p.id }, data: { title, excerpt, intro, sections: sections as Prisma.InputJsonValue, seo: seo as Prisma.InputJsonValue } });
  }
  console.log(`Posts: ${posts.length} dash-cleaned, SEO written for ${postSeoWritten}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
