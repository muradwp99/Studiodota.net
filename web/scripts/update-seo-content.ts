/**
 * One-off follow-up to fix-dashes-and-seo.ts: the first SEO pass used
 * multi-word focus keywords that didn't appear verbatim in the title/
 * description, scoring "OK" (64) on the RankMath-style analyzer instead of
 * "Good". This rewrites just the seo.title/description/focusKeyword fields
 * with shorter keywords proven (via seoScore.ts) to score 86-100 across all
 * projects, posts, and page blocks. Dash cleanup already applied - untouched.
 *
 * Run from web/:  npx tsx scripts/update-seo-content.ts
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

type Entry = { title: string; description: string; focusKeyword: string };

const PROJECT_SEO: Record<string, Entry> = {
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

const POST_SEO: Record<string, Entry> = {
  "designing-for-daylight": { focusKeyword: "designing for daylight", title: "Designing for Daylight", description: "Designing for daylight starts with orientation, glazing, and section, our notes on how light shapes a building's whole feeling." },
  "material-honesty": { focusKeyword: "material honesty", title: "Material Honesty in Modern Architecture", description: "Material honesty means letting concrete, timber, and stone read as themselves rather than dressing them up, a note from Studiodota." },
  "planning-with-people": { focusKeyword: "planning with people", title: "Planning With People, Not Just Plots", description: "Planning with people comes before plots in our approach to public realm design and community masterplanning." },
  "low-carbon-by-design": { focusKeyword: "low carbon by design", title: "Low Carbon by Design, Not by Add-On", description: "Low carbon by design starts with the first sketch, through form, structure, and what you choose not to build, not bolted on later." },
  "interiors-that-last": { focusKeyword: "interiors that last", title: "Interiors That Last: Light, Material, Flow", description: "Interiors that last are the product of light, material, and how people actually move through a space, not an afterthought." },
  "reading-a-site": { focusKeyword: "reading a site", title: "Reading a Site Before Drawing a Line", description: "Reading a site before drawing a line means listening to the land long before it's drawn, our approach to process." },
};

// Keyed by Block key. `home.about` intentionally excluded.
const PAGE_SEO: Record<string, Entry> = {
  "page.services": { focusKeyword: "architecture services", title: "Architecture Services", description: "Full-service architecture services in Southern California, from pre-design and feasibility through construction documentation." },
  "page.projects": { focusKeyword: "architecture portfolio", title: "Architecture Portfolio", description: "Browse our architecture portfolio across Southern California, from single-family homes and remodels to 150-unit communities." },
  "page.gallery": { focusKeyword: "architecture gallery", title: "Architecture Gallery - Renderings & Studies", description: "An architecture gallery of renderings and studies from across the practice, filterable by discipline or viewed all at once." },
  "page.journal": { focusKeyword: "architecture journal", title: "Architecture Journal", description: "Craft, process, and ideas from our architecture journal, covering daylight, materials, sustainability, and building well." },
  "page.contact": { focusKeyword: "architecture firm", title: "Contact Our Architecture Firm", description: "Contact our architecture firm with your brief, site details, drawings, or references, and we'll turn them into a considered design." },
  "page.terms": { focusKeyword: "terms and conditions", title: "Terms and Conditions", description: "The terms and conditions that apply when you use this website or get in touch with us about a project." },
  "page.privacy": { focusKeyword: "privacy policy", title: "Privacy Policy", description: "A plain-English summary of our privacy policy: what we collect when you contact us, why we collect it, and how long we keep it." },
};

async function main() {
  let n = 0;
  for (const [slug, seoInfo] of Object.entries(PROJECT_SEO)) {
    const p = await db.project.findUnique({ where: { slug } });
    if (!p) continue;
    const existing = (p.seo && typeof p.seo === "object" ? p.seo : {}) as Record<string, unknown>;
    await db.project.update({ where: { slug }, data: { seo: { ...existing, ...seoInfo } as Prisma.InputJsonValue } });
    n++;
  }
  console.log(`Projects updated: ${n}`);

  n = 0;
  for (const [slug, seoInfo] of Object.entries(POST_SEO)) {
    const p = await db.post.findUnique({ where: { slug } });
    if (!p) continue;
    const existing = (p.seo && typeof p.seo === "object" ? p.seo : {}) as Record<string, unknown>;
    await db.post.update({ where: { slug }, data: { seo: { ...existing, ...seoInfo } as Prisma.InputJsonValue } });
    n++;
  }
  console.log(`Posts updated: ${n}`);

  n = 0;
  for (const [key, seoInfo] of Object.entries(PAGE_SEO)) {
    const b = await db.block.findUnique({ where: { key } });
    if (!b) continue;
    const data = (b.data && typeof b.data === "object" ? b.data : {}) as Record<string, unknown>;
    const existingSeo = (data.seo && typeof data.seo === "object" ? data.seo : {}) as Record<string, unknown>;
    await db.block.update({ where: { key }, data: { data: { ...data, seo: { ...existingSeo, ...seoInfo } } as Prisma.InputJsonValue } });
    n++;
  }
  console.log(`Page blocks updated: ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
