/**
 * Default content for every editable block. Single source of truth shared by:
 *  - prisma/seed.ts       (initial DB rows)
 *  - src/lib/content.ts   (runtime fallback when a block is missing)
 *  - src/lib/pageRegistry (admin form field specs mirror these shapes)
 *
 * Image values are full public paths. Plain data only — no imports.
 */

const R = (n: string) => `/media/renders/${n}.jpg`;

export const BLOCK_DEFAULTS = {
  site: {
    name: "Studiodota",
    tagline: "Architecture & Design Studio",
    email: "studio@studiodota.net",
    phone: "+44 20 0000 0000",
    address1: "88 Grand Avenue, Suite 1200",
    address2: "London, UK",
    metaTitle: "Studiodota — Architecture & Design Studio",
    metaDescription:
      "Studiodota is an architecture and design practice creating buildings and spaces defined by clarity, craft, and lasting value — from concept to completion.",
    footerHeadline: "An architecture & design studio shaping spaces built to endure.",
    footerServices: [
      "Architectural Design",
      "Interior Architecture",
      "Urban & Masterplanning",
      "Renovation & Restoration",
      "Sustainability",
    ],
    socials: [
      { label: "IG", href: "#" },
      { label: "LI", href: "#" },
      { label: "FB", href: "#" },
      { label: "YT", href: "#" },
      { label: "X", href: "#" },
    ],
  },

  nav: {
    getStartedLabel: "Get Started",
    blogLabel: "Blog",
    contactLabel: "Contact",
  },

  "home.hero": {
    slides: [{ image: R("hero") }, { image: R("meridian-sports") }, { image: R("harbour-masterplan") }],
    titleAccent: "Studio",
    titleRestLine1: "of architecture",
    titleRestLine2: "& design",
    lede: "Studiodota is an architecture and design practice. We shape buildings and spaces that are precise, human, and built to endure — guiding every project from first sketch to completion.",
    ctaLabel: "Show Portfolio",
    ctaHref: "/projects",
  },

  "home.about": {
    kicker: "(SD 02) — ABOUT",
    title: "Architecture that stands for clarity and purpose.",
    paragraph1:
      "Studiodota is an architecture and design practice defined by a minimal yet human-centered philosophy. Guided by decades of collective expertise, we approach every project with rigor, precision, and creativity — buildings shaped with clarity, restraint, and long-lasting value.",
    paragraph2:
      "Our practice spans scales and disciplines, from residential and commercial architecture to cultural institutions and urban design. By blending technical expertise with cultural awareness, we create environments that respect context, enhance daily life, and inspire those who experience them.",
    ctaLabel: "Explore the studio",
    stats: [
      { end: 20, suffix: "+", label: "Years of experience", desc: "Designing spaces that combine function and beauty." },
      { end: 100, suffix: "+", label: "Completed projects", desc: "Across residential, commercial, and cultural sectors." },
      { end: 85, suffix: "%", label: "Repeat clients", desc: "Reflecting long-term trust and lasting relationships." },
      { end: 12, suffix: "", label: "Countries served", desc: "Delivering projects with global reach and local sensitivity." },
    ],
  },

  "home.services": {
    kicker: "Our Service",
    title: "What we do.",
    items: [
      {
        title: "Architectural Design",
        sub: "Crafting functional, aesthetic, and purposeful building concepts — from first sketch through to a completed building.",
        tags: ["Concepting", "Space planning", "Building design"],
        image: R("atelier-house"),
      },
      {
        title: "Interior Architecture",
        sub: "Shaping interiors that feel comfortable, refined, and balanced through light, material, and considered detail.",
        tags: ["Moodboarding", "Styling", "Layouting"],
        image: R("interior"),
      },
      {
        title: "Urban & Masterplanning",
        sub: "Precincts and public realm planned around the way real communities live, gather, and move.",
        tags: ["Zoning", "Public realm", "Phasing"],
        image: R("harbour-masterplan"),
      },
      {
        title: "Renovation & Restoration",
        sub: "New life for existing and heritage structures, handled with precision, restraint, and care.",
        tags: ["Assessment", "Heritage", "Delivery"],
        image: R("riverside-warehouse"),
      },
    ],
  },

  "home.whyChoose": {
    label: "Why choose us",
    title: "A studio dedicated to better spaces.",
    body: "A full-service architecture studio committed to delivering thoughtful, high-quality spaces. Our work blends creativity, technical skill, and attention to detail.",
    ctaLabel: "Explore our work",
    cardLeft: { image: R("atelier-house"), prefix: "£", end: 85, suffix: "M +", label: "Value delivered across residential and commercial projects." },
    cardMidTop: { end: 112, suffix: " +", label: "Completed architectural works across the UK and internationally." },
    cardMidBottom: { end: 2, suffix: "M sq ft.", label: "Total built environment we've planned, designed, or overseen." },
    cardRight: { image: R("riverside-warehouse"), end: 210, suffix: " +", label: "Partners, builders, and clients." },
  },

  "home.featured": {
    kicker: "(SD 04) — FEATURED PROJECTS",
    title: "Inside,",
    titleMuted: "Outside",
    linkLabel: "View all projects →",
    items: [
      { slug: "urban-oasis", title: "Urban Oasis Apartments", location: "London, UK", year: "2025", image: R("urban-oasis") },
      { slug: "atelier-house", title: "Atelier House", location: "Copenhagen, Denmark", year: "2025", image: R("atelier-house") },
      { slug: "meridian-sports", title: "Meridian Sports Centre", location: "Manchester, UK", year: "2024", image: R("meridian-sports") },
      { slug: "harbour-masterplan", title: "Harbour Quarter Masterplan", location: "Oslo, Norway", year: "2025", image: R("harbour-masterplan") },
    ],
  },

  "home.showreel": {
    label: "Showreel",
    linkLabel: "Explore the gallery →",
    items: [
      { image: R("atelier-house"), title: "Atelier House", kicker: "Residential", youtubeId: "zwagmtVuZoI" },
      { image: R("interior"), title: "Studio Vale", kicker: "Interior", youtubeId: "daL7TkzyW7k" },
      { image: R("meridian-sports"), title: "Meridian", kicker: "Civic", youtubeId: "FnrPZuN0m-0" },
      { image: R("urban-oasis"), title: "Urban Oasis", kicker: "Residential", youtubeId: "gToL_3ouPcI" },
      { image: R("harbour-masterplan"), title: "Harbour Quarter", kicker: "Masterplan", youtubeId: "lOJO1osi9po" },
    ],
  },

  "home.process": {
    label: "Our work process",
    intro:
      "At Studiodota, great architecture begins with understanding. Our process is clear, transparent, and client-focused — from first sketch to handover. Click each step to see how we work.",
    ctaLabel: "Start your project",
    steps: [
      { n: "01", title: "Consultation", body: "We start by understanding your brief, references, and goals in a focused kickoff.", image: R("interior") },
      { n: "02", title: "Technical planning", body: "Measured drawings, structure, and a shared programme with clear milestones.", image: R("atelier-house") },
      { n: "03", title: "Design development", body: "Materials, structure, and detail resolved against annotated design reviews.", image: R("meridian-sports") },
      { n: "04", title: "Author supervision", body: "We guide the design through each review round — no guesswork, no drift.", image: R("riverside-warehouse") },
      { n: "05", title: "Construction support", body: "On-site coordination and detailing through construction to protect the design intent.", image: R("urban-oasis") },
      { n: "06", title: "Project completion", body: "The completed building handed over — documented, resolved, and ready to occupy.", image: R("harbour-masterplan") },
    ],
  },

  "home.timeline": {
    title: "Projects timeline",
    items: [
      { year: "2021", n: "01.", pre: "The", accent: "Pinnacle", post: "Residence", image: R("atelier-house") },
      { year: "2022", n: "02.", pre: "Urban", accent: "Haven", post: "Apartments", image: R("urban-oasis") },
      { year: "2023", n: "03.", pre: "Leafy", accent: "Court", post: "Precinct", image: R("leafy-precinct") },
      { year: "2024", n: "04.", pre: "Riverside", accent: "Works", post: "District", image: R("riverside-warehouse") },
      { year: "2025", n: "05.", pre: "Meridian", accent: "Sports", post: "Centre", image: R("meridian-sports") },
      { year: "2026", n: "06.", pre: "The", accent: "Horizon", post: "Masterplan", image: R("harbour-masterplan") },
    ],
  },

  "home.testimonials": {
    label: "What clients say",
    title: "Thoughtful work, fast enough to matter.",
    featured: {
      quote:
        "Studiodota turned a complex brief into a building our community immediately embraced. The clarity they bring to every decision shows up in the finished space.",
      name: "Maya Chen",
      role: "Co-founder & CEO, Northline",
    },
    quotes: [
      { quote: "They operate like an extension of our team. Strategic, calm, and relentless about outcomes.", name: "Jordan Reyes", role: "Head of Product, Vanta" },
      { quote: "From day one, they asked the right questions — and delivered a building our clients are proud of.", name: "Aisha Patel", role: "Development Director, Fieldway" },
    ],
    ctaLabel: "Work with us",
  },

  "home.clients": {
    label: "We work with world's top companies",
    rowA: ["Deloitte.", "amazon", "Disney", "Microsoft", "accenture", "EY", "TOYOTA", "CISCO"],
    rowB: ["AIRBUS", "Booking.com", "1stDIBS", "BELMOND", "MUJI", "Olson Kundig", "One&Only", "Artemide"],
  },

  "home.statement": {
    label: "The practice",
    word: "STUDIODOTA",
    image: R("harbour-masterplan"),
    body: "Buildings shaped with clarity, restraint, and lasting value — guided from the first sketch to the final resolved detail.",
  },

  "home.faq": {
    label: "FAQs",
    title: "Frequently asked questions",
    cardInitials: "SD",
    cardTitle: "Book a 15 min call",
    cardBody: "If you have any questions, just book a 15-minute call with us before starting.",
    cardCta: "Book a free call",
    items: [
      { q: "What does your studio specialise in?", a: "Architectural design, interior architecture, urban and masterplanning, and renovation — full-service, from concept through construction." },
      { q: "Do you work with early-stage projects?", a: "Yes — from a feasibility study to a fully developed brief, we can start wherever you are." },
      { q: "How long does a typical project take?", a: "It depends on scale — concept design takes weeks, while full projects run through construction over several months. We agree a clear programme up front." },
      { q: "Can you work within our site and planning constraints?", a: "Absolutely. We design around your brief, budget, site conditions, and local planning context." },
      { q: "What do you need from me to get started?", a: "Your brief and goals, the site address or a survey, and any references — we handle the rest." },
    ],
  },

  "home.journals": {
    title: "Discover insights, trends, and inspiration.",
    viewAllLabel: "View all",
  },

  "home.cta": {
    label: "Get in touch",
    title: "Let's build something lasting.",
    body: "Tell us about your site, your brief, or the idea you can't stop thinking about. We reply within one business day.",
    submitLabel: "Start the conversation",
    image: R("harbour-masterplan"),
  },

  "page.services": {
    eyebrow: "What we do",
    title: "Every discipline your project needs.",
    lede: "From first sketch through to handover — one practice covering every stage of architecture and design for private and commercial clients.",
    image: R("harbour-masterplan"),
    statement: "Six disciplines, one continuous practice — so nothing is lost between concept and completion.",
    ctaTitle: "Not sure which you need? Start with a vision.",
    ctaLabel: "Get a quote",
    items: [
      {
        id: "architecture",
        title: "Architectural Design",
        detail: "We lead projects end to end — brief, concept, planning, technical design, and construction — resolving form, structure, and detail into buildings built to last.",
        blurb: "Full-service design from first concept to a completed building.",
        image: R("atelier-house"),
        tags: ["Concept", "Planning", "Technical design", "Delivery"],
      },
      {
        id: "interior",
        title: "Interior Architecture",
        detail: "Spatial planning, materials, and lighting resolved together so interiors feel considered, comfortable, and quietly refined.",
        blurb: "Interiors shaped by light, material, and the way people move.",
        image: R("interior"),
        tags: ["Space planning", "Materials", "Lighting", "FF&E"],
      },
      {
        id: "urban",
        title: "Urban & Masterplanning",
        detail: "Mixed-use precincts, phasing strategies, and public realm designed for movement, density, and long-term value.",
        blurb: "Precincts and public realm planned around how communities live.",
        image: R("harbour-masterplan"),
        tags: ["Zoning", "Public realm", "Phasing", "Density"],
      },
      {
        id: "renovation",
        title: "Renovation & Restoration",
        detail: "Sensitive interventions that respect the existing fabric while bringing light, performance, and use up to modern standards.",
        blurb: "New life for existing and heritage structures, handled with care.",
        image: R("riverside-warehouse"),
        tags: ["Assessment", "Heritage", "Retrofit", "Delivery"],
      },
      {
        id: "landscape",
        title: "Landscape & Environment",
        detail: "Gardens, courtyards, and public grounds integrated with the build for climate, ecology, and everyday life.",
        blurb: "Outdoor space designed as part of the architecture, not after it.",
        image: R("leafy-precinct"),
        tags: ["Courtyards", "Ecology", "Climate", "Public grounds"],
      },
      {
        id: "sustainability",
        title: "Sustainability",
        detail: "Passive design, embodied-carbon thinking, and building performance embedded from the first sketch — never bolted on.",
        blurb: "Low-carbon, high-performance buildings by design.",
        image: R("meridian-sports"),
        tags: ["Passive design", "Embodied carbon", "Performance", "Certification"],
      },
    ],
  },

  "page.about": {
    eyebrow: "The studio",
    title: "An architecture practice built on clarity.",
    lede: "Studiodota is a team of architects and designers turning briefs, sites, and ambitions into buildings — considered, durable, and made for the people who use them.",
    whyLabel: "Why we exist",
    why1: "Good architecture is quiet. It resolves the real problems — light, space, movement, cost, climate — without shouting about it. That restraint is where lasting value comes from.",
    why2: "We work across scales, from private homes to civic and mixed-use schemes, leading each project from first sketch through construction. Accurate, collaborative, and dependable.",
    stats: [
      { value: "20", suffix: "+", label: "Years of practice" },
      { value: "400", suffix: "+", label: "Projects completed" },
      { value: "24", suffix: "", label: "Specialists on the team" },
      { value: "18", suffix: "", label: "Design awards" },
    ],
    processTitle: "How we work.",
    process: [
      { step: "01", title: "Brief & feasibility", body: "We define goals, site, budget, and constraints — then test what's genuinely possible." },
      { step: "02", title: "Concept design", body: "Options explored and refined into a clear, considered design direction you can trust." },
      { step: "03", title: "Technical design", body: "Detailed drawings, coordination with engineers, and planning or consent submissions." },
      { step: "04", title: "Construction & handover", body: "On-site support through construction to a resolved, snag-free, occupied building." },
    ],
    ctaTitle: "Let's build something that lasts.",
    ctaLabel: "Get a quote",
  },

  "page.projects": {
    eyebrow: "Selected work",
    title: "Projects that speak for themselves.",
    lede: "Over 400 projects delivered across the built environment — a selection of recent architecture and design work below.",
    image: R("meridian-sports"),
  },

  "page.gallery": {
    eyebrow: "Gallery",
    title: "A closer look at the work.",
    lede: "Photography and film from across the practice — filter by discipline, or take in everything at once.",
    image: R("interior"),
  },

  "page.journal": {
    eyebrow: "Journal",
    title: "Notes from the studio.",
    lede: "Craft, process, and ideas — on daylight, materials, sustainability, and the discipline of building well.",
    image: R("interior"),
    bannerImage: "/media/blog-banner.png",
    bannerAlt: "Let's build something lasting — get in touch",
  },

  "page.contact": {
    eyebrow: "Start with a vision",
    title: "Tell us about your project.",
    lede: "Share your brief, site details, drawings, or references. We'll turn them into a considered design — guided from first concept through to construction.",
    image: R("urban-oasis"),
    formLabel: "Enquiry",
    formTitle: "Send us the brief.",
    whatToSend: "A brief or wishlist, the site address or a survey, any existing drawings, and references or moodboards. A rough sketch is a fine place to start.",
    turnaround: "Concept design takes a few weeks; full projects run over several months. We'll confirm a clear programme with your proposal.",
    asideImage: R("atelier-house"),
    serviceOptions: [
      "Architectural Design",
      "Interior Architecture",
      "Urban & Masterplanning",
      "Renovation & Restoration",
      "Landscape & Environment",
      "Sustainability",
    ],
  },

  menus: {
    primary: [
      { label: "Services", href: "/services" },
      { label: "Gallery", href: "/gallery" },
      { label: "Projects", href: "/projects" },
      { label: "Blog", href: "/journal" },
      { label: "Contact", href: "/contact" },
    ],
    footerPages: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Portfolio", href: "/projects" },
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
    ],
  },

  taxonomies: {
    postCategories: ["Craft", "Philosophy", "Urbanism", "Sustainability", "Interiors", "Process", "Lifestyle"] as string[],
  },

  plugins: {
    /** [{ id, active, settings }] — settings validated against each plugin's own field spec */
    states: [] as { id: string; active: boolean; settings: Record<string, unknown> }[],
  },

  appearance: {
    activeTheme: "studiodota",
  },

  "page.privacy": {
    eyebrow: "Legal",
    title: "Privacy policy",
    lede: "Plain-English summary of what we collect when you contact us, why, and how long we keep it.",
    sections: [
      { heading: "What we collect", body: "When you submit the enquiry form we collect the details you provide — your name, email address, optional phone number and company, the service you need, and your project description, including any files you attach." },
      { heading: "Why we collect it", body: "Solely to respond to your enquiry, prepare a quote, and deliver the work you ask us to do. We do not sell your data or use it for advertising." },
      { heading: "How long we keep it", body: "Enquiry submissions are stored securely and automatically deleted after 180 days unless they become part of an active project, in which case they are retained for the duration of our working relationship and any legal record-keeping obligations." },
      { heading: "Your choices", body: "You can ask us to access, correct, or delete the information we hold about you at any time. Email us and we will action the request." },
      { heading: "Cookies", body: "This site uses only the essential cookies required to function. We do not run advertising or cross-site tracking cookies." },
    ],
  },
} as const;

/* Mutable, tuple-widened block value types for runtime use (CMS data can have
 * any number of list items, and rows are plain mutable JSON). */
type DeepMutable<T> = T extends readonly (infer E)[]
  ? DeepMutable<E>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T;
export type BlockKey = keyof typeof BLOCK_DEFAULTS;
export type BlockData = { [K in BlockKey]: DeepMutable<(typeof BLOCK_DEFAULTS)[K]> };

/* ---- Collection seed data (tables, not blocks) ---- */

export const SEED_PROJECTS = [
  { slug: "urban-oasis", title: "Urban Oasis Apartments", summary: "An upscale urban residence with layered outdoor terraces and a refined contemporary exterior.", category: "residential", sector: "Residential", location: "London, UK", year: "2025", services: ["Architecture", "Interiors"], heroImage: R("urban-oasis"), sort: 0 },
  { slug: "leafy-precinct", title: "Leafy Apartment Precinct", summary: "A leafy low-rise precinct with elevated outlooks and generous, planted shared terraces.", category: "residential", sector: "Residential", location: "Copenhagen, Denmark", year: "2025", services: ["Architecture", "Landscape"], heroImage: R("leafy-precinct"), sort: 1 },
  { slug: "riverside-warehouse", title: "Riverside Warehouse Development", summary: "A glass-fronted commercial precinct built for access, daylight, and adaptable future tenants.", category: "commercial", sector: "Commercial", location: "Rotterdam, Netherlands", year: "2024", services: ["Architecture", "Masterplan"], heroImage: R("riverside-warehouse"), sort: 2 },
  { slug: "meridian-sports", title: "Meridian Sports Centre", summary: "A sculptural civic sports centre anchoring an active street with a bold public presence.", category: "institutional", sector: "Institutional", location: "Manchester, UK", year: "2024", services: ["Architecture", "Interiors"], heroImage: R("meridian-sports"), sort: 3 },
  { slug: "harbour-masterplan", title: "Harbour Quarter Masterplan", summary: "A mixed-use harbour quarter masterplan resolved across phases, promenades, and public realm.", category: "masterplan", sector: "Masterplan", location: "Oslo, Norway", year: "2025", services: ["Masterplan", "Urban design"], heroImage: R("harbour-masterplan"), sort: 4 },
  { slug: "atelier-house", title: "Atelier House", summary: "A private residence composed around daylight, landscape, and a calm, tactile material palette.", category: "residential", sector: "Residential", location: "Copenhagen, Denmark", year: "2025", services: ["Architecture", "Interiors"], heroImage: R("atelier-house"), sort: 5 },
];

export const SEED_GALLERY = [
  { title: "Alpine House", sector: "Private residence", image: R("hero"), category: "architecture", type: "photo", tall: true, sort: 0 },
  { title: "Atelier House", sector: "Residential", image: R("atelier-house"), category: "residential", type: "photo", sort: 1 },
  { title: "Studio Vale", sector: "Interior film", image: R("interior"), category: "residential", type: "video", youtubeId: "daL7TkzyW7k", sort: 2 },
  { title: "Urban Oasis", sector: "Apartments", image: R("urban-oasis"), category: "residential", type: "photo", sort: 3 },
  { title: "Meridian Centre", sector: "Civic flythrough", image: R("meridian-sports"), category: "architecture", type: "video", youtubeId: "FnrPZuN0m-0", tall: true, sort: 4 },
  { title: "Harbour Quarter", sector: "Masterplan", image: R("harbour-masterplan"), category: "commercial", type: "photo", sort: 5 },
  { title: "Leafy Precinct", sector: "Residential", image: R("leafy-precinct"), category: "residential", type: "photo", sort: 6 },
  { title: "Riverside Works", sector: "Commercial", image: R("riverside-warehouse"), category: "commercial", type: "photo", sort: 7 },
  { title: "Glass & Steel", sector: "Commercial", image: R("office-tower"), category: "commercial", type: "photo", sort: 8 },
  { title: "Sky Terrace", sector: "Rooftop amenity", image: R("rooftop-pool"), category: "residential", type: "video", youtubeId: "gToL_3ouPcI", sort: 9 },
  { title: "Public Realm", sector: "Commercial", image: R("harbour-masterplan"), category: "commercial", type: "photo", tall: true, sort: 10 },
  { title: "Poolside Living", sector: "Residential interior", image: R("living-pool"), category: "residential", type: "photo", sort: 11 },
  { title: "Civic Hall", sector: "Institutional", image: R("meridian-sports"), category: "commercial", type: "photo", sort: 12 },
  { title: "Courtyard", sector: "Landscape film", image: R("leafy-precinct"), category: "residential", type: "video", youtubeId: "zwagmtVuZoI", sort: 13 },
];

export const SEED_MEDIA = [
  "hero", "atelier-house", "interior", "urban-oasis", "leafy-precinct",
  "riverside-warehouse", "meridian-sports", "harbour-masterplan",
  "office-tower", "living-pool", "rooftop-pool",
].map((n) => ({ path: R(n), alt: n.replace(/-/g, " ") }))
  .concat([
    { path: "/media/blog-banner.png", alt: "Journal CTA banner" },
    { path: "/media/cta-banner.png", alt: "Start your project banner" },
  ]);
