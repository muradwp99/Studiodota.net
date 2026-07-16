/**
 * Typed content layer. Studiodota — architecture & design practice.
 */

export const site = {
  name: "Studiodota",
  tagline: "Architecture & Design Studio",
  email: "studio@studiodota.net",
  phone: "+44 20 0000 0000",
};

export type NavGroup = {
  label: string;
  blurb: string;
  links: { label: string; href: string; hint?: string }[];
};

export type NavItem = {
  label: string;
  href: string;
  mega?: NavGroup[];
};

export const nav: NavItem[] = [
  {
    label: "Work",
    href: "/projects",
    mega: [
      {
        label: "By sector",
        blurb: "Projects delivered across the built environment.",
        links: [
          { label: "Residential", href: "/projects?category=residential", hint: "Homes & apartments" },
          { label: "Commercial", href: "/projects?category=commercial", hint: "Offices & retail" },
          { label: "Institutional", href: "/projects?category=institutional", hint: "Civic & sport" },
          { label: "Masterplan", href: "/projects?category=masterplan", hint: "Precincts & public realm" },
        ],
      },
    ],
  },
  { label: "Services", href: "/services" },
  { label: "Studio", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
];

export type Service = {
  id: string;
  title: string;
  blurb: string;
  detail: string;
};

export const services: Service[] = [
  {
    id: "architecture",
    title: "Architectural Design",
    blurb: "Full-service design from first concept to a completed building.",
    detail:
      "We lead projects end to end — brief, concept, planning, technical design, and construction — resolving form, structure, and detail into buildings built to last.",
  },
  {
    id: "interior",
    title: "Interior Architecture",
    blurb: "Interiors shaped by light, material, and the way people move.",
    detail:
      "Spatial planning, materials, and lighting resolved together so interiors feel considered, comfortable, and quietly refined.",
  },
  {
    id: "urban",
    title: "Urban & Masterplanning",
    blurb: "Precincts and public realm planned around how communities live.",
    detail:
      "Mixed-use precincts, phasing strategies, and public realm designed for movement, density, and long-term value.",
  },
  {
    id: "renovation",
    title: "Renovation & Restoration",
    blurb: "New life for existing and heritage structures, handled with care.",
    detail:
      "Sensitive interventions that respect the existing fabric while bringing light, performance, and use up to modern standards.",
  },
  {
    id: "landscape",
    title: "Landscape & Environment",
    blurb: "Outdoor space designed as part of the architecture, not after it.",
    detail:
      "Gardens, courtyards, and public grounds integrated with the build for climate, ecology, and everyday life.",
  },
  {
    id: "sustainability",
    title: "Sustainability",
    blurb: "Low-carbon, high-performance buildings by design.",
    detail:
      "Passive design, embodied-carbon thinking, and building performance embedded from the first sketch — never bolted on.",
  },
];

export const outcomes = [
  {
    no: "01",
    title: "Approvals, with less friction",
    body: "Clear, well-argued design and documentation help planning committees say yes sooner.",
  },
  {
    no: "02",
    title: "Buildings people want to use",
    body: "We design for daily life, not just the drawing — spaces that keep working long after handover.",
  },
  {
    no: "03",
    title: "Value that lasts",
    body: "Durable materials and considered detailing protect your investment for decades.",
  },
];

export const stats = [
  { value: "20", suffix: "+", label: "Years of practice" },
  { value: "400", suffix: "+", label: "Projects completed" },
  { value: "24", suffix: "", label: "Specialists on the team" },
  { value: "18", suffix: "", label: "Design awards" },
];

export type Project = {
  slug: string;
  title: string;
  summary: string;
  category: "residential" | "commercial" | "institutional" | "masterplan";
  sector: string;
  year: string;
  services: string[];
  tone: [string, string];
};

export const projects: Project[] = [
  {
    slug: "urban-oasis",
    title: "Urban Oasis Apartments",
    summary: "An upscale urban residence with layered outdoor terraces and a refined contemporary exterior.",
    category: "residential",
    sector: "Residential",
    year: "2025",
    services: ["Architecture", "Interiors"],
    tone: ["#3a2f24", "#0b0b0c"],
  },
  {
    slug: "leafy-precinct",
    title: "Leafy Apartment Precinct",
    summary: "A leafy low-rise precinct with elevated outlooks and generous, planted shared terraces.",
    category: "residential",
    sector: "Residential",
    year: "2025",
    services: ["Architecture", "Landscape"],
    tone: ["#2b3327", "#0b0b0c"],
  },
  {
    slug: "riverside-warehouse",
    title: "Riverside Warehouse Development",
    summary: "A glass-fronted commercial precinct built for access, daylight, and adaptable future tenants.",
    category: "commercial",
    sector: "Commercial",
    year: "2024",
    services: ["Architecture", "Masterplan"],
    tone: ["#22303a", "#0b0b0c"],
  },
  {
    slug: "meridian-sports",
    title: "Meridian Sports Centre",
    summary: "A sculptural civic sports centre anchoring an active street with a bold public presence.",
    category: "institutional",
    sector: "Institutional",
    year: "2024",
    services: ["Architecture", "Interiors"],
    tone: ["#3a2530", "#0b0b0c"],
  },
  {
    slug: "harbour-masterplan",
    title: "Harbour Quarter Masterplan",
    summary: "A mixed-use harbour quarter masterplan resolved across phases, promenades, and public realm.",
    category: "masterplan",
    sector: "Masterplan",
    year: "2025",
    services: ["Masterplan", "Urban design"],
    tone: ["#2f2b3a", "#0b0b0c"],
  },
  {
    slug: "atelier-house",
    title: "Atelier House",
    summary: "A private residence composed around daylight, landscape, and a calm, tactile material palette.",
    category: "residential",
    sector: "Residential",
    year: "2025",
    services: ["Architecture", "Interiors"],
    tone: ["#3a3324", "#0b0b0c"],
  },
];

export const testimonials = [
  {
    quote:
      "Studiodota guided us from a difficult site to a building the whole community is proud of. Calm, rigorous, and genuinely collaborative.",
    name: "Development Director",
    org: "Commercial developer, London",
  },
  {
    quote:
      "They resolved the interiors and the structure as one idea. The finished spaces feel effortless to be in.",
    name: "Head of Property",
    org: "Residential developer",
  },
  {
    quote:
      "Accurate, on time, and a real design partner through planning and construction.",
    name: "Principal",
    org: "Architecture practice",
  },
];

export const process = [
  {
    step: "01",
    title: "Brief & feasibility",
    body: "We define goals, site, budget, and constraints — then test what's genuinely possible.",
  },
  {
    step: "02",
    title: "Concept design",
    body: "Options explored and refined into a clear, considered design direction you can trust.",
  },
  {
    step: "03",
    title: "Technical design",
    body: "Detailed drawings, coordination with engineers, and planning or consent submissions.",
  },
  {
    step: "04",
    title: "Construction & handover",
    body: "On-site support through construction to a resolved, snag-free, occupied building.",
  },
];

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: number;
};

export const posts: Post[] = [
  {
    slug: "designing-for-daylight",
    title: "Designing for daylight",
    excerpt: "How orientation, glazing, and section quietly shape a building's whole feeling.",
    category: "Craft",
    date: "2026-06-18",
    readingTime: 6,
  },
  {
    slug: "material-honesty",
    title: "Material honesty in modern architecture",
    excerpt: "Why we let concrete, timber, and stone read as themselves rather than dressing them up.",
    category: "Philosophy",
    date: "2026-05-02",
    readingTime: 5,
  },
  {
    slug: "planning-with-people",
    title: "Planning with people, not just plots",
    excerpt: "Our approach to public realm and community-led masterplanning.",
    category: "Urbanism",
    date: "2026-03-27",
    readingTime: 4,
  },
];

export const serviceOptions = [
  "Architectural Design",
  "Interior Architecture",
  "Urban & Masterplanning",
  "Renovation & Restoration",
  "Landscape & Environment",
  "Sustainability",
];
