/**
 * Default content for every editable block. Single source of truth shared by:
 *  - prisma/seed.ts       (initial DB rows)
 *  - src/lib/content.ts   (runtime fallback when a block is missing)
 *  - src/lib/pageRegistry (admin form field specs mirror these shapes)
 *
 * Image values are full public paths. Plain data only - no imports.
 */

const R = (n: string) => `/media/renders/${n}.jpg`;
/** Imported client project renders (see scripts/optimize-project-images.mjs). */
const P = (slug: string, n: number) => `/projects/${slug}/${String(n).padStart(2, "0")}.webp`;
const PLACEHOLDER = "/projects/placeholder.webp";
/** Per-entity SEO blob (RankMath-style) - spread into every page.* block and
 *  mirrored on Project/Post rows. Empty values fall back to the global defaults. */
const emptySeo = {
  title: "", description: "", focusKeyword: "", canonical: "",
  ogTitle: "", ogDescription: "", ogImage: "",
  twitterTitle: "", twitterDescription: "", twitterImage: "",
  noindex: false, nofollow: false, noarchive: false,
};
const seoDefaults = { seo: emptySeo };
export const EMPTY_SEO = emptySeo;

export const BLOCK_DEFAULTS = {
  site: {
    name: "Studiodota",
    tagline: "Architecture & Design Studio",
    email: "studioa.arch@gmail.com",
    phone: "+1 (213) 587-1256",
    address1: "1420 Sepulveda Blvd, Suite 310",
    address2: "Los Angeles, CA 90025",
    metaTitle: "Studiodota - Architecture & Design Studio",
    metaDescription:
      "Studiodota is an architecture and design practice creating buildings and spaces defined by clarity, craft, and lasting value - from concept to completion.",
    // A real project render, not R("hero") - that is a template stock image, and
    // this value is the site-wide og:image and the Organization schema's `image`.
    ogImage: P("office-san-diego", 1),
    twitterHandle: "",
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

  integrations: {
    // Paste an ID and the script is injected automatically - no code needed.
    gaId: "",
    gtmId: "",
    metaPixelId: "",
    tiktokPixelId: "",
    // Raw code injected site-wide (own risk - admin only). Head = tracking,
    // verification meta, fonts. Footer = chat widgets, extra scripts.
    headCode: "",
    footerCode: "",
    // Where new enquiry notifications are emailed (blank = the site contact email).
    notifyEmail: "",
  },

  nav: {
    getStartedLabel: "Get Started",
    getStartedHref: "/contact",
  },

  "home.hero": {
    slides: [{ image: P("office-san-diego", 1) }, { image: P("condominium-temple-simi-valley", 1) }, { image: P("affordable-housing-136", 1) }],
    titleAccent: "Studio",
    titleRestLine1: "of architecture",
    titleRestLine2: "& design",
    lede: "Studiodota is an architecture and design practice. We shape buildings and spaces that are precise, human, and built to endure - guiding every project from first sketch to completion.",
    ctaLabel: "Show Portfolio",
    ctaHref: "/projects",
  },

  "home.about": {
    kicker: "Who we are",
    title: "Simplifying complexity in design.",
    paragraph1:
      "Studiodot A is a pioneering Architecture + Engineering firm, founded by Nubaira Haque in 2021 with a vision to simplify complexity in design. From bespoke residential work to urban infill and expansive developments, every project is approached with collaboration and creativity.",
    paragraph2:
      "Our approach is rooted in the unique characteristics of each site and its context - reimagining traditional design paradigms and exploring the intersections between buildings, landscape, and environment. The result: distinctive, evocative spaces that challenge conventions.",
    ctaLabel: "Meet the studio",
    stats: [
      { end: 5, suffix: "+", label: "Years of practice", desc: "Founded by Nubaira Haque in 2021." },
      { end: 25, suffix: "+", label: "Projects in the portfolio", desc: "From single-family homes to 158-unit communities." },
      { end: 7, suffix: "", label: "Sectors served", desc: "Residential through commercial, office, and senior living." },
      { end: 2, suffix: "", label: "Disciplines under one roof", desc: "Architecture and engineering, working as one team." },
    ],
  },

  "home.services": {
    kicker: "Our Service",
    title: "What we do.",
    items: [
      {
        title: "Architectural Design",
        sub: "Crafting functional, aesthetic, and purposeful building concepts - from first sketch through to a completed building.",
        tags: ["Concepting", "Space planning", "Building design"],
        image: P("apartments-hesperia", 1),
      },
      {
        title: "Interior Architecture",
        sub: "Shaping interiors that feel comfortable, refined, and balanced through light, material, and considered detail.",
        tags: ["Moodboarding", "Styling", "Layouting"],
        image: P("cannabis-lounge", 1),
      },
      {
        title: "Urban & Masterplanning",
        sub: "Precincts and public realm planned around the way real communities live, gather, and move.",
        tags: ["Zoning", "Public realm", "Phasing"],
        image: P("moreno-valley", 1),
      },
      {
        title: "Renovation & Restoration",
        sub: "New life for existing and heritage structures, handled with precision, restraint, and care.",
        tags: ["Assessment", "Heritage", "Delivery"],
        image: P("tustin-house", 1),
      },
    ],
  },

  "home.whyChoose": {
    label: "Why choose us",
    title: "A studio dedicated to better spaces.",
    body: "A full-service Architecture + Engineering practice committed to thoughtful, buildable spaces - creativity, technical skill, and attention to detail in every drawing set.",
    ctaLabel: "Explore our work",
    cardLeft: { image: P("town-homes-la-habra", 2), prefix: "", end: 600, suffix: "+", label: "Homes and units across the studio's active designs." },
    cardMidTop: { end: 29, suffix: "", label: "Projects in the portfolio - concept studies to construction documents." },
    cardMidBottom: { end: 10, suffix: "+", label: "Cities across Southern California, from San Diego to the High Desert." },
    cardRight: { image: P("moreno-valley", 3), end: 7, suffix: "", label: "Sectors - single-family to senior living, office, and mixed use." },
  },

  "home.featured": {
    kicker: "Featured projects",
    title: "Inside,",
    titleMuted: "Outside",
    linkLabel: "View all projects →",
    items: [
      { slug: "apartments-hesperia", title: "Apartments at Hesperia", location: "Hesperia, CA", year: "Multifamily", image: P("apartments-hesperia", 1) },
      { slug: "town-homes-la-habra", title: "Town Homes at La Habra", location: "La Habra, CA", year: "Townhomes", image: P("town-homes-la-habra", 1) },
      { slug: "senior-housing-fontana", title: "Senior Housing at Fontana", location: "Fontana, CA", year: "Senior Living", image: P("senior-housing-fontana", 1) },
      { slug: "office-san-diego", title: "Office at San Diego", location: "San Diego, CA", year: "Office", image: P("office-san-diego", 1) },
      { slug: "condominium-temple-simi-valley", title: "Condominium & Temple", location: "Simi Valley, CA", year: "Mixed Use", image: P("condominium-temple-simi-valley", 1) },
      { slug: "sfr-lot-07", title: "Lot 07", location: "Southern California", year: "Single Family", image: P("sfr-lot-07", 1) },
    ],
  },

  "home.showreel": {
    label: "Showreel",
    linkLabel: "Explore the gallery →",
    items: [
      { image: P("office-san-diego", 1), title: "Office at San Diego", kicker: "Office", youtubeId: "" },
      { image: P("cannabis-lounge", 1), title: "Cannabis Lounge", kicker: "Hospitality", youtubeId: "" },
      { image: P("moreno-valley", 1), title: "Moreno Valley", kicker: "Multifamily", youtubeId: "" },
      { image: P("tustin-house", 1), title: "Tustin House", kicker: "Remodel", youtubeId: "" },
      { image: P("truck-servicing-fontana", 1), title: "Truck Servicing at Fontana", kicker: "Industrial", youtubeId: "" },
    ],
  },

  "home.process": {
    label: "Our work process",
    intro:
      "At Studiodota, great architecture begins with understanding. Our process is clear, transparent, and client-focused - from first sketch to handover. Click each step to see how we work.",
    ctaLabel: "Start your project",
    steps: [
      { n: "01", title: "Consultation", body: "We start by understanding your brief, references, and goals in a focused kickoff.", image: P("office-san-diego", 2) },
      { n: "02", title: "Technical planning", body: "Measured drawings, structure, and a shared programme with clear milestones.", image: P("condominium-temple-simi-valley", 3) },
      { n: "03", title: "Design development", body: "Materials, structure, and detail resolved against annotated design reviews.", image: P("hesperia-47-west", 2) },
      { n: "04", title: "Author supervision", body: "We guide the design through each review round - no guesswork, no drift.", image: P("senior-housing-fontana", 3) },
      { n: "05", title: "Construction support", body: "On-site coordination and detailing through construction to protect the design intent.", image: P("truck-servicing-fontana", 1) },
      { n: "06", title: "Project completion", body: "The completed building handed over - documented, resolved, and ready to occupy.", image: P("apartments-hesperia", 4) },
    ],
  },

  "home.timeline": {
    title: "Selected works",
    items: [
      { year: "Multifamily", n: "01", pre: "Apartments at", accent: "Hesperia", post: "", image: P("apartments-hesperia", 1) },
      { year: "Townhomes", n: "02", pre: "Town Homes at", accent: "La Habra", post: "", image: P("town-homes-la-habra", 1) },
      { year: "Senior Living", n: "03", pre: "Senior Housing at", accent: "Fontana", post: "", image: P("senior-housing-fontana", 1) },
      { year: "Mixed Use", n: "04", pre: "Condominium &", accent: "Temple", post: "", image: P("condominium-temple-simi-valley", 1) },
      { year: "Multifamily", n: "05", pre: "Hesperia at", accent: "47 West", post: "", image: P("hesperia-47-west", 1) },
      { year: "Single Family", n: "06", pre: "Lot", accent: "07", post: "Residence", image: P("sfr-lot-07", 1) },
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
      image: "https://images.unsplash.com/photo-1769636929388-99eff95d3bf1?auto=format&fit=crop&w=800&q=80",
    },
    quotes: [
      { quote: "They operate like an extension of our team. Strategic, calm, and relentless about outcomes.", name: "Jordan Reyes", role: "Head of Product, Vanta", image: "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?auto=format&fit=crop&w=800&q=80" },
      { quote: "From day one, they asked the right questions - and delivered a building our clients are proud of.", name: "Aisha Patel", role: "Development Director, Fieldway", image: "https://images.unsplash.com/photo-1780733058027-680a7c841fe5?auto=format&fit=crop&w=800&q=80" },
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
    image: P("mixed-use-114", 1),
    body: "Buildings shaped with clarity, restraint, and lasting value - guided from the first sketch to the final resolved detail.",
  },

  "home.faq": {
    label: "FAQs",
    title: "Frequently asked questions",
    description: "Everything you need to know about our process, timelines, and how we take a project from first sketch to completion.",
    cardInitials: "SD",
    cardTitle: "Book a 15 min call",
    cardBody: "If you have any questions, just book a 15-minute call with us before starting.",
    cardCta: "Book a free call",
    supportLabel: "Need more help?",
    supportBody: "We're happy to talk through your brief in more detail.",
    supportCta: "Contact us",
    items: [
      { q: "What does your studio specialise in?", a: "Architectural design, interior architecture, urban and masterplanning, and renovation - full-service, from concept through construction." },
      { q: "Do you work with early-stage projects?", a: "Yes - from a feasibility study to a fully developed brief, we can start wherever you are." },
      { q: "How long does a typical project take?", a: "It depends on scale - concept design takes weeks, while full projects run through construction over several months. We agree a clear programme up front." },
      { q: "Can you work within our site and planning constraints?", a: "Absolutely. We design around your brief, budget, site conditions, and local planning context." },
      { q: "What do you need from me to get started?", a: "Your brief and goals, the site address or a survey, and any references - we handle the rest." },
    ],
  },

  "home.journals": {
    title: "Discover insights, trends, and inspiration.",
    viewAllLabel: "View all",
  },

  /** Homepage section order + visibility. Managed under Appearance → Homepage.
   *  Kept in sync with HOME_SECTION_META in src/lib/homeSections.ts. */
  "home.layout": {
    sections: [
      { id: "about", enabled: true },
      { id: "services", enabled: true },
      { id: "whyChoose", enabled: true },
      { id: "featured", enabled: true },
      { id: "showreel", enabled: true },
      { id: "process", enabled: true },
      { id: "timeline", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "clients", enabled: true },
      { id: "statement", enabled: true },
      { id: "faq", enabled: true },
      { id: "journals", enabled: true },
      { id: "cta", enabled: true },
    ],
  },

  "home.cta": {
    label: "Get in touch",
    title: "Let's build something lasting.",
    body: "Tell us about your site, your brief, or the idea you can't stop thinking about. We reply within one business day.",
    submitLabel: "Start the conversation",
    image: P("affordable-housing-136", 1),
  },

  "page.services": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Architecture Services", description: "Full-service architecture services in Southern California, from pre-design and feasibility through construction documentation.", focusKeyword: "architecture services" },
    eyebrow: "Services",
    title: "Every phase, from first study to final approval.",
    lede: "A full-service Architecture + Engineering practice - pre-design through construction documentation, with visualization and entitlement support along the way.",
    image: P("moreno-valley", 1),
    statement: "Five phases, one continuous practice - nothing is lost between the first site study and the final approval.",
    ctaTitle: "Not sure which phase you're in? Start with a conversation.",
    ctaLabel: "Get a quote",
    items: [
      {
        id: "pre-design",
        num: "01",
        title: "Pre-Design",
        blurb: "Feasibility, programming, and site intelligence - before a line is drawn.",
        image: P("office-san-diego", 1),
        tags: [
          "Master Planning / Programming",
          "Space Schematics / Flow Diagrams",
          "Existing Facilities Studies",
          "Economic Feasibility Studies",
          "Site Analysis / Selection",
          "Site Development Planning",
          "Detailed Site Utilization Studies",
          "On / Off-Site Utility Studies",
          "Environmental Studies / Reports",
          "Project Financing / Budgeting",
          "Project Development Scheduling",
        ],
      },
      {
        id: "schematic-design",
        num: "02",
        title: "Schematic Design",
        blurb: "The plan takes shape - siting, massing, and utilization resolved into a clear direction.",
        image: P("hesperia-47-west", 1),
        tags: [
          "Master Planning / Programming",
          "Site Analysis / Selection",
          "Site Development Planning",
          "Detailed Site Utilization Studies",
          "On / Off-Site Utility Studies",
          "Environmental Studies / Reports",
          "Project Development Scheduling",
        ],
      },
      {
        id: "design-development",
        num: "03",
        title: "Design Development",
        blurb: "Architecture, structure, and systems developed together - materials and details locked in.",
        image: P("moreno-valley", 2),
        tags: [
          "Architectural Design / Documents",
          "Structural Design / Documents",
          "MEP Design / Documents",
          "Civil Design / Documents",
          "Landscape Design / Documents",
          "Material Specifications",
          "Project Development Scheduling",
        ],
      },
      {
        id: "construction-documentation",
        num: "04",
        title: "Construction Documentation",
        blurb: "Permit-ready drawing sets across every discipline - coordinated and complete.",
        image: P("town-homes-la-habra", 1),
        tags: [
          "Architectural Design / Documents",
          "Structural Design / Documents",
          "MEP Design / Documents",
          "Civil Design / Documents",
          "Landscape Design / Documents",
          "Material Specifications",
          "Project Development Scheduling",
        ],
      },
      {
        id: "additional-services",
        num: "05",
        title: "Additional Services",
        blurb: "Visualization, entitlements, and delivery support - everything that moves a project forward.",
        image: P("sfr-lot-07", 1),
        tags: [
          "3D Renderings / Fly-Throughs",
          "CEQA Study",
          "Traffic Report",
          "Permit Services",
          "Value Engineering / Analysis",
          "Detailed Construction Cost Estimates",
          "Fast-Track Delivery",
          "Website Design",
        ],
      },
    ],
  },

  "page.about": {
    ...seoDefaults,
    eyebrow: "Who we are",
    title: "Simplifying complexity in design.",
    lede: "Studiodot A is a pioneering Architecture + Engineering firm, founded with a vision to simplify complexity in design - delivering innovative architecture and interior design across a diverse spectrum of projects since 2021.",
    whyLabel: "The story",
    why1: "Established by Nubaira Haque in 2021, the firm has consistently delivered innovative architecture and interior design solutions across a diverse spectrum of projects. Since its inception, Studiodot A has cultivated a rich portfolio - spanning bespoke residential designs, cutting-edge urban infill projects, and expansive developments.",
    why2: "The hallmark of Studiodot A's work lies in its ability to craft distinctive and evocative spaces that challenge conventions. From the form of the structures to the expression of materials, each project exudes a sense of originality and intrigue - offering clients and communities fresh perspectives on architecture and design.",
    storyImage: P("sfr-lot-07", 1),
    quoteLabel: "Meet Nubaira",
    quote: "Our approach to design is deeply rooted in the unique characteristics of each site and the contextual architecture. We strive to reimagine traditional design paradigms, exploring novel intersections between buildings, landscapes, and environmental factors - an exploration that often leads to unexpected and playful elements woven into our designs.",
    quoteName: "Nubaira Haque",
    quoteRole: "Founder, Studiodot A",
    stats: [
      { value: "2021", suffix: "", label: "Founded by Nubaira Haque" },
      { value: "25", suffix: "+", label: "Projects in the portfolio" },
      { value: "7", suffix: "", label: "Sectors across Southern California" },
      { value: "2", suffix: "", label: "Disciplines - architecture + engineering" },
    ],
    processTitle: "How we work.",
    process: [
      { step: "01", title: "Brief & feasibility", body: "We define goals, site, budget, and constraints - then test what's genuinely possible." },
      { step: "02", title: "Concept design", body: "Options explored and refined into a clear, considered design direction you can trust." },
      { step: "03", title: "Technical design", body: "Detailed drawings, coordination with engineers, and planning or consent submissions." },
      { step: "04", title: "Construction & handover", body: "On-site support through construction to a resolved, snag-free, occupied building." },
    ],
    ctaTitle: "Let's reimagine your project together.",
    ctaLabel: "Get in touch",
  },

  "page.projects": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Architecture Portfolio", description: "Browse our architecture portfolio across Southern California, from single-family homes and remodels to 150-unit communities.", focusKeyword: "architecture portfolio" },
    eyebrow: "The work",
    title: "Projects across Southern California.",
    lede: "From single-family homes and fire rebuilds to 150-unit communities - architecture and engineering delivered across Southern California.",
    image: P("apartments-hesperia", 1),
  },

  "page.gallery": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Architecture Gallery - Renderings & Studies", description: "An architecture gallery of renderings and studies from across the practice, filterable by discipline or viewed all at once.", focusKeyword: "architecture gallery" },
    eyebrow: "Gallery",
    title: "A closer look at the work.",
    lede: "Renderings and studies from across the practice - filter by discipline, or take in everything at once.",
    image: P("senior-housing-fontana", 2),
    // Matches the live DB - stays a draft until someone explicitly republishes
    // it, so a down/unreachable DB can't accidentally resurrect it.
    published: false,
  },

  "page.journal": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Architecture Journal", description: "Craft, process, and ideas from our architecture journal, covering daylight, materials, sustainability, and building well.", focusKeyword: "architecture journal" },
    eyebrow: "Journal",
    title: "Notes from the studio.",
    lede: "Craft, process, and ideas - on daylight, materials, sustainability, and the discipline of building well.",
    image: P("cannabis-lounge", 2),
    bannerImage: "/media/blog-banner.png",
    bannerAlt: "Let's build something lasting - get in touch",
  },

  "page.contact": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Contact Our Architecture Firm", description: "Contact our architecture firm with your brief, site details, drawings, or references, and we'll turn them into a considered design.", focusKeyword: "architecture firm" },
    eyebrow: "Start with a vision",
    title: "Tell us about your project.",
    lede: "Share your brief, site details, drawings, or references. We'll turn them into a considered design - guided from first concept through to construction.",
    image: P("town-homes-la-habra", 3),
    formLabel: "Enquiry",
    formTitle: "Send us the brief.",
    whatToSend: "A brief or wishlist, the site address or a survey, any existing drawings, and references or moodboards. A rough sketch is a fine place to start.",
    turnaround: "Concept design takes a few weeks; full projects run over several months. We'll confirm a clear programme with your proposal.",
    asideImage: P("san-pedro-house", 1),
    serviceOptions: [
      "Pre-Design",
      "Schematic Design",
      "Design Development",
      "Construction Documentation",
      "3D Renderings / Visualization",
      "Permit Services",
      "Something else",
    ],
  },

  menus: {
    /** Each item may carry `children` for a simple dropdown (one level, no nesting). */
    primary: [
      { label: "Who we are", href: "/about", children: [] },
      { label: "Services", href: "/services", children: [] },
      { label: "Projects", href: "/projects", children: [] },
      { label: "Blog", href: "/journal", children: [] },
      { label: "Contact", href: "/contact", children: [] },
    ] as { label: string; href: string; children: { label: string; href: string }[] }[],
    footerPages: [
      { label: "Home", href: "/" },
      { label: "Who we are", href: "/about" },
      { label: "Portfolio", href: "/projects" },
      { label: "Journal", href: "/journal" },
      { label: "Contact", href: "/contact" },
    ],
  },

  taxonomies: {
    postCategories: ["Craft", "Philosophy", "Urbanism", "Sustainability", "Interiors", "Process", "Lifestyle"] as string[],
    projectCategories: [
      "single-family", "multifamily", "affordable-housing", "mixed-use",
      "commercial", "office", "senior-living",
    ] as string[],
    galleryCategories: ["architecture", "residential", "commercial"] as string[],
  },

  plugins: {
    /** [{ id, active, settings }] - settings validated against each plugin's own field spec */
    states: [] as { id: string; active: boolean; settings: Record<string, unknown> }[],
  },

  appearance: {
    /** Brand accent (the champagne-bronze). Shades are derived with color-mix. */
    accent: "#a87f3f",
  },

  /** Global SEO defaults. Per-page overrides live on each page/project/post. */
  seo: {
    defaultDescription: "Studiodota is a Southern California architecture and engineering practice designing precise, human, and enduring spaces from first sketch to completion.",
    defaultOgImage: "",
    twitterCard: "summary_large_image",
    twitterSite: "",
    organizationSchema: true,
    noindexSite: false,
    robotsTxt: "",
  },

  "page.privacy": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Privacy Policy", description: "A plain-English summary of our privacy policy: what we collect when you contact us, why we collect it, and how long we keep it.", focusKeyword: "privacy policy" },
    eyebrow: "Legal",
    title: "Privacy policy",
    lede: "Plain-English summary of what we collect when you contact us, why, and how long we keep it.",
    sections: [
      { heading: "What we collect", body: "When you submit the enquiry form we collect the details you provide - your name, email address, optional phone number and company, the service you need, and your project description, including any files you attach." },
      { heading: "Why we collect it", body: "Solely to respond to your enquiry, prepare a quote, and deliver the work you ask us to do. We do not sell your data or use it for advertising." },
      { heading: "How long we keep it", body: "Enquiry submissions are stored securely and automatically deleted after 180 days unless they become part of an active project, in which case they are retained for the duration of our working relationship and any legal record-keeping obligations." },
      { heading: "Your choices", body: "You can ask us to access, correct, or delete the information we hold about you at any time. Email us and we will action the request." },
      { heading: "Cookies", body: "This site uses only the essential cookies required to function. We do not run advertising or cross-site tracking cookies." },
    ],
  },

  "page.terms": {
    ...seoDefaults,
    seo: { ...emptySeo, title: "Terms and Conditions", description: "The terms and conditions that apply when you use this website or get in touch with us about a project.", focusKeyword: "terms and conditions" },
    eyebrow: "Legal",
    title: "Terms & conditions",
    lede: "The general terms that apply when you use this website or get in touch with us about a project.",
    sections: [
      { heading: "Use of this site", body: "This website is provided for general information about our studio and our work. You're welcome to browse it and share pages for personal, non-commercial reference. You agree not to misuse the site - including attempting to disrupt it, scrape it at scale, or use it in a way that could damage its content or availability for other visitors." },
      { heading: "Intellectual property", body: "The architectural designs, renders, photography, text, and branding shown on this site belong to Studiodota, or are used with permission, and are protected by copyright and other intellectual property laws. Nothing on this site grants you a licence to reproduce, distribute, or create derivative works from that material without our prior written consent." },
      { heading: "No warranty", body: "We take care to keep this site accurate and current, but it is provided \"as is\" without warranties of any kind. We do not guarantee that the site will be uninterrupted or error-free, or that any project, material, or finish shown is available or identical in every application." },
      { heading: "Limitation of liability", body: "To the fullest extent permitted by law, Studiodota is not liable for any indirect, incidental, or consequential loss arising from your use of this site or reliance on the information it contains. Nothing in these terms excludes liability that cannot be excluded under the laws applicable to our business." },
      { heading: "Changes to these terms", body: "We may update these terms from time to time to reflect changes to the site or to our practices. The version published here is the one currently in effect, and continued use of the site after an update means you accept the revised terms." },
    ],
  },
} as const;

/* Mutable, tuple-widened block value types for runtime use (CMS data can have
 * any number of list items, and rows are plain mutable JSON). */
/* Primitives are widened (literal → string/number/boolean) because CMS rows
 * hold arbitrary values at runtime - the defaults are just one possible state. */
type DeepMutable<T> = T extends readonly (infer E)[]
  ? DeepMutable<E>[]
  : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T extends string
      ? string
      : T extends number
        ? number
        : T extends boolean
          ? boolean
          : T;
export type BlockKey = keyof typeof BLOCK_DEFAULTS;
export type BlockData = { [K in BlockKey]: DeepMutable<(typeof BLOCK_DEFAULTS)[K]> };

/* ---- Collection seed data (tables, not blocks) ---- */

/** Builds a project's gallery image list from the manifest layout on disk. */
const G = (slug: string, count: number) => Array.from({ length: count }, (_, i) => P(slug, i + 1));

/**
 * Synced field-for-field with the live DB on 2026-08-07 (categories/sort/
 * gallery counts had drifted since 2026-07-31 - scripts/update-project-
 * structure.mjs recategorized several rows and admin edits changed a few
 * galleries). Array order matches ascending `sort` since the fallback path
 * in getProjects() has no orderBy of its own.
 */
export const SEED_PROJECTS = [
  // ---- Affordable housing ----
  { slug: "affordable-housing-72", title: "Affordable Housing - 72 Units", summary: "A 72-unit affordable housing development - six exterior camera studies of massing and street presence.", category: "affordable-housing", sector: "Affordable Housing", location: "", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("affordable-housing-72", 1), interiorImage: "", gallery: G("affordable-housing-72", 6), published: true, sort: 0 },
  { slug: "affordable-housing-77", title: "Affordable Housing - 77 Units", summary: "A 77-unit affordable housing development - five camera studies plus unit-interior views of kitchen, living, and bath.", category: "affordable-housing", sector: "Affordable Housing", location: "", year: "2021", services: ["Architectural Design", "3D Visualization"], heroImage: P("affordable-housing-77", 1), interiorImage: P("affordable-housing-77", 6), gallery: G("affordable-housing-77", 9), published: true, sort: 1 },
  { slug: "affordable-housing-62", title: "Affordable Housing - 62 Units", summary: "A 62-unit affordable housing development - from early concept sketch through massing studies and rendered camera views.", category: "affordable-housing", sector: "Affordable Housing", location: "", year: "2022", services: ["Architectural Design", "3D Visualization"], heroImage: P("affordable-housing-62", 1), interiorImage: "", gallery: G("affordable-housing-62", 6), published: true, sort: 2 },

  // ---- Single family ----
  { slug: "ball-residence", title: "Ball Residence", summary: "A single-family residence - currently in design; renders to follow.", category: "single-family", sector: "Single Family Residence", location: "", year: "2024", services: ["Architectural Design"], heroImage: P("ball-residence", 1), interiorImage: P("ball-residence", 2), gallery: G("ball-residence", 8), published: true, sort: 3 },
  { slug: "fire-rebuild-mckendree-01", title: "Mckendree 01", summary: "A fire-rebuild residence in Pacific Palisades - currently in design; renders to follow.", category: "single-family", sector: "Fire Rebuild", location: "Pacific Palisades, CA", year: "2023", services: ["Architectural Design"], heroImage: P("fire-rebuild-mckendree-01", 1), interiorImage: P("fire-rebuild-mckendree-01", 2), gallery: G("fire-rebuild-mckendree-01", 4), published: true, sort: 4 },
  { slug: "fire-rebuild-mckendree-02", title: "Mckendree 02", summary: "A fire-rebuild residence in Pacific Palisades - currently in design; renders to follow.", category: "single-family", sector: "Fire Rebuild", location: "Pacific Palisades, CA", year: "2025", services: ["Architectural Design"], heroImage: P("fire-rebuild-mckendree-02", 1), interiorImage: P("fire-rebuild-mckendree-02", 2), gallery: G("fire-rebuild-mckendree-02", 3), published: true, sort: 5 },
  { slug: "fire-rebuild-kagawa-st", title: "Kagawa St", summary: "A fire-rebuild residence in Pacific Palisades - currently in design; renders to follow.", category: "single-family", sector: "Fire Rebuild", location: "Pacific Palisades, CA", year: "2022", services: ["Architectural Design"], heroImage: PLACEHOLDER, interiorImage: "", gallery: [] as string[], published: false, sort: 6 },
  { slug: "fire-rebuild-temecula", title: "Temecula", summary: "A fire-rebuild residence - currently in design; renders to follow.", category: "single-family", sector: "Fire Rebuild", location: "Pacific Palisades, CA", year: "2024", services: ["Architectural Design"], heroImage: PLACEHOLDER, interiorImage: "", gallery: [] as string[], published: false, sort: 7 },
  { slug: "sfr-lot-07", title: "Lot 07", summary: "A single-family residence - front, rear, and aerial studies of a contemporary two-storey home.", category: "single-family", sector: "Single Family Residence", location: "", year: "2022", services: ["Architectural Design", "3D Visualization"], heroImage: P("sfr-lot-07", 1), interiorImage: P("sfr-lot-07", 2), gallery: G("sfr-lot-07", 3), published: true, sort: 8 },
  { slug: "sfr-lot-08", title: "Lot 08", summary: "A single-family residence - currently in design; renders to follow.", category: "single-family", sector: "Single Family Residence", location: "", year: "2024", services: ["Architectural Design"], heroImage: PLACEHOLDER, interiorImage: "", gallery: [] as string[], published: false, sort: 9 },
  { slug: "sfr-lot-09", title: "Lot 09", summary: "A single-family residence studied from the street, the yard, and above.", category: "single-family", sector: "Single Family Residence", location: "", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("sfr-lot-09", 1), interiorImage: P("sfr-lot-09", 2), gallery: G("sfr-lot-09", 3), published: true, sort: 10 },
  { slug: "san-pedro-house", title: "San Pedro House", summary: "A family home in San Pedro - front and rear studies balancing glazing, privacy, and outdoor living.", category: "single-family", sector: "Single Family Residence", location: "San Pedro, CA", year: "2021", services: ["Architectural Design", "3D Visualization"], heroImage: P("san-pedro-house", 1), interiorImage: P("san-pedro-house", 2), gallery: G("san-pedro-house", 2), published: true, sort: 11 },
  { slug: "tustin-house", title: "Tustin House", summary: "A residential remodel in Tustin - the existing home reimagined with a new elevation, entry, and material palette.", category: "single-family", sector: "Remodel", location: "Tustin, CA", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("tustin-house", 1), interiorImage: P("tustin-house", 2), gallery: G("tustin-house", 2), published: true, sort: 12 },
  { slug: "rollaway-6663", title: "6663 Rollaway - Stanley", summary: "A single-family residence at 6663 Rollaway - a street-facing study of massing, roofline, and entry.", category: "single-family", sector: "Single Family Residence", location: "", year: "2021", services: ["Architectural Design", "3D Visualization"], heroImage: P("rollaway-6663", 1), interiorImage: "", gallery: G("rollaway-6663", 1), published: true, sort: 13 },

  // ---- Multifamily ----
  { slug: "town-homes-la-habra", title: "Town Homes at La Habra", summary: "A townhome development in La Habra - repeating unit rhythm, shared drives, and a warm material palette, studied outside and in.", category: "multifamily", sector: "Townhomes", location: "La Habra, CA", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("town-homes-la-habra", 1), interiorImage: P("town-homes-la-habra", 5), gallery: G("town-homes-la-habra", 5), published: true, sort: 14 },
  { slug: "moreno-valley", title: "Moreno Valley", summary: "A residential community in Moreno Valley - streetscape, building, and amenity-pool studies for a phased development.", category: "multifamily", sector: "Multifamily", location: "Moreno Valley, CA", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("moreno-valley", 1), interiorImage: P("moreno-valley", 3), gallery: G("moreno-valley", 4), published: true, sort: 15 },
  { slug: "crenshaw-apartments", title: "Crenshaw Apartments", summary: "A multifamily apartment development in Crenshaw - unit interiors studied through five views while exterior renders are still in progress.", category: "multifamily", sector: "Multifamily", location: "Los Angeles, CA", year: "2024", services: ["Architectural Design", "3D Visualization"], heroImage: P("crenshaw-apartments", 1), interiorImage: P("crenshaw-apartments", 1), gallery: G("crenshaw-apartments", 5), published: true, sort: 16 },
  { slug: "studio-apartment-158", title: "Studio Apartment - 158 Units", summary: "A 158-unit studio apartment development - currently in design; renders to follow.", category: "multifamily", sector: "Multifamily", location: "", year: "2022", services: ["Architectural Design"], heroImage: PLACEHOLDER, interiorImage: "", gallery: [] as string[], published: false, sort: 17 },

  // ---- Mixed use ----
  { slug: "mixed-use-114", title: "Mixed Use - 114 Units", summary: "A 114-unit mixed-use development with ground-floor retail - massing and street-level studies for a four-view concept set.", category: "mixed-use", sector: "Mixed Use", location: "", year: "2024", services: ["Architectural Design", "3D Visualization"], heroImage: P("mixed-use-114", 1), interiorImage: "", gallery: G("mixed-use-114", 4), published: true, sort: 18 },
  { slug: "affordable-housing-136", title: "Affordable Housing - 136 Units", summary: "A 136-unit affordable housing development on Inglewood Ave - massing, unit interiors, and street context resolved across thirteen studies.", category: "mixed-use", sector: "Affordable Housing", location: "Inglewood, CA", year: "2025", services: ["Architectural Design", "3D Visualization"], heroImage: P("affordable-housing-136", 1), interiorImage: P("affordable-housing-136", 9), gallery: G("affordable-housing-136", 13), published: true, sort: 19 },
  { slug: "apartments-hesperia", title: "Apartments at Hesperia", summary: "A multifamily community studied through seven exterior views - massing, courtyards, and street presence resolved for a high-desert site.", category: "mixed-use", sector: "Multifamily", location: "Hesperia, CA", year: "2022", services: ["Architectural Design", "3D Visualization"], heroImage: P("apartments-hesperia", 1), interiorImage: P("apartments-hesperia", 2), gallery: G("apartments-hesperia", 7), published: true, sort: 20 },
  { slug: "hesperia-47-west", title: "Hesperia at 47 West", summary: "Four camera studies for 47 West - a Hesperia development balancing repetition, articulation, and desert light.", category: "mixed-use", sector: "Multifamily", location: "Hesperia, CA", year: "2025", services: ["Architectural Design", "3D Visualization"], heroImage: P("hesperia-47-west", 1), interiorImage: P("hesperia-47-west", 2), gallery: G("hesperia-47-west", 4), published: true, sort: 21 },
  { slug: "condominium-temple-simi-valley", title: "Condominium & Temple", summary: "A condominium development paired with a temple in Simi Valley - two programs resolved on one site, from massing to entry sequence.", category: "mixed-use", sector: "Mixed Use", location: "Simi Valley, CA", year: "2024", services: ["Architectural Design", "3D Visualization"], heroImage: P("condominium-temple-simi-valley", 1), interiorImage: P("condominium-temple-simi-valley", 2), gallery: G("condominium-temple-simi-valley", 6), published: true, sort: 22 },

  // ---- Commercial ----
  { slug: "office-san-diego", title: "Office at San Diego", summary: "A corporate office concept - clean lines, a louvered screening wall against harsh sun, and lake-view planning, presented from first sketch to final front view.", category: "commercial", sector: "Office", location: "San Diego, CA", year: "2021", services: ["Architectural Design", "3D Visualization"], heroImage: P("office-san-diego", 1), interiorImage: P("office-san-diego", 3), gallery: [P("office-san-diego", 1), P("office-san-diego", 3), P("office-san-diego", 4), P("office-san-diego", 5), P("office-san-diego", 6), P("office-san-diego", 7)], published: true, sort: 23 },
  { slug: "hesperia-commercial", title: "Hesperia at Commercial", summary: "A commercial pad development in Hesperia - three exterior studies of signage, storefront glazing, and parking approach.", category: "commercial", sector: "Commercial", location: "Hesperia, CA", year: "2025", services: ["Architectural Design", "3D Visualization"], heroImage: P("hesperia-commercial", 1), interiorImage: P("hesperia-commercial", 2), gallery: G("hesperia-commercial", 3), published: true, sort: 24 },
  { slug: "auto-part-riverside", title: "Auto Part at Riverside", summary: "An auto-parts retail building in Riverside - bold volumes, contrasting cladding, and a clear customer entry beneath an orange canopy.", category: "commercial", sector: "Commercial", location: "Riverside, CA", year: "2022", services: ["Architectural Design", "3D Visualization"], heroImage: P("auto-part-riverside", 1), interiorImage: P("auto-part-riverside", 2), gallery: G("auto-part-riverside", 2), published: true, sort: 25 },
  { slug: "truck-servicing-fontana", title: "Truck Servicing at Fontana", summary: "A truck-servicing facility in Fontana - service bays, yard circulation, and street frontage studied at eye level and from above.", category: "commercial", sector: "Industrial", location: "Fontana, CA", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("truck-servicing-fontana", 1), interiorImage: P("truck-servicing-fontana", 2), gallery: G("truck-servicing-fontana", 2), published: true, sort: 26 },
  { slug: "cannabis-lounge", title: "Cannabis Lounge", summary: "A consumption-lounge interior - layered lighting, dark joinery, and seating zones tuned for atmosphere and flow.", category: "commercial", sector: "Hospitality", location: "", year: "2023", services: ["Architectural Design", "3D Visualization"], heroImage: P("cannabis-lounge", 1), interiorImage: P("cannabis-lounge", 2), gallery: G("cannabis-lounge", 3), published: true, sort: 27 },
  { slug: "cyclebar", title: "CycleBar", summary: "A tenant-improvement build-out for a boutique cycling studio - brick and cedar cladding, signage, and storefront glazing.", category: "commercial", sector: "Tenant Improvement", location: "", year: "2023", services: ["Interior Architecture"], heroImage: P("cyclebar", 1), interiorImage: P("cyclebar", 2), gallery: G("cyclebar", 13), published: true, sort: 28 },
  { slug: "row-house", title: "Row House", summary: "A tenant-improvement project documented on site through construction.", category: "commercial", sector: "Tenant Improvement", location: "", year: "2018", services: ["Interior Architecture"], heroImage: P("row-house", 1), interiorImage: P("row-house", 2), gallery: G("row-house", 8), published: true, sort: 29 },

  // ---- Senior living ----
  { slug: "senior-housing-fontana", title: "Senior Housing at Fontana", summary: "Senior housing designed around accessibility, shade, and shared community space - four exterior studies for a Fontana site.", category: "senior-living", sector: "Senior Living", location: "Fontana, CA", year: "2022", services: ["Architectural Design", "3D Visualization"], heroImage: P("senior-housing-fontana", 1), interiorImage: P("senior-housing-fontana", 2), gallery: G("senior-housing-fontana", 4), published: true, sort: 30 },

  // ---- Interior ----
  { slug: "covina-residence", title: "Covina Residence", summary: "A single-family residence in Covina - five exterior studies of massing, roofline, and entry.", category: "interior", sector: "Single Family Residence", location: "Covina, CA", year: "2024", services: ["Architectural Design", "3D Visualization"], heroImage: P("covina-residence", 1), interiorImage: "", gallery: G("covina-residence", 5), published: true, sort: 31 },
  { slug: "bell-residence-chino", title: "Bell Residence", summary: "A single-family residence in Chino.", category: "interior", sector: "Single Family Residence", location: "Chino, CA", year: "2024", services: ["Architectural Design", "3D Visualization"], heroImage: P("bell-residence", 1), interiorImage: "", gallery: G("bell-residence", 3), published: true, sort: 32 },
  { slug: "jurien-bay", title: "Jurien Bay", summary: "A residence studied across two views.", category: "interior", sector: "Single Family Residence", location: "", year: "2024", services: ["Architectural Design", "3D Visualization"], heroImage: P("jurien-bay", 1), interiorImage: "", gallery: G("jurien-bay", 5), published: true, sort: 33 },
  { slug: "bar", title: "Bar", summary: "A bar interior - layered lighting and finishes studied across eight camera views.", category: "interior", sector: "Hospitality", location: "", year: "", services: ["Interior Architecture", "3D Visualization"], heroImage: P("bar", 1), interiorImage: P("bar", 2), gallery: G("bar", 8), published: true, sort: 34 },
  { slug: "fisher-st", title: "Fisher St Residence", summary: "A residence interior on Fisher St - great room, kitchen, and patio studied for light and flow.", category: "interior", sector: "Single Family Residence", location: "", year: "", services: ["Architectural Design", "3D Visualization"], heroImage: P("fisher-st", 1), interiorImage: P("fisher-st", 2), gallery: G("fisher-st", 4), published: true, sort: 35 },
  { slug: "garments-office", title: "Garments Office", summary: "A garments-company office interior - workspace layout and finishes across nine studies.", category: "interior", sector: "Office", location: "", year: "", services: ["Interior Architecture", "3D Visualization"], heroImage: P("garments-office", 1), interiorImage: P("garments-office", 2), gallery: G("garments-office", 9), published: true, sort: 36 },
  { slug: "humairas-residence", title: "Humaira's Residence", summary: "A residence interior - living, bedroom, and master spaces studied across four views.", category: "interior", sector: "Single Family Residence", location: "", year: "", services: ["Architectural Design", "3D Visualization"], heroImage: P("humairas-residence", 1), interiorImage: P("humairas-residence", 2), gallery: G("humairas-residence", 4), published: true, sort: 37 },
  { slug: "michaels-residence", title: "Michael's Residence", summary: "A residence interior - living room, dining, and foyer resolved for material and light.", category: "interior", sector: "Single Family Residence", location: "", year: "", services: ["Architectural Design", "3D Visualization"], heroImage: P("michaels-residence", 1), interiorImage: P("michaels-residence", 2), gallery: G("michaels-residence", 3), published: true, sort: 38 },
  { slug: "mr-amins-kitchen", title: "Mr. Amin's Kitchen", summary: "A kitchen interior studied across three camera views.", category: "interior", sector: "Single Family Residence", location: "", year: "", services: ["Interior Architecture", "3D Visualization"], heroImage: P("mr-amins-kitchen", 1), interiorImage: P("mr-amins-kitchen", 2), gallery: G("mr-amins-kitchen", 3), published: true, sort: 39 },
  { slug: "nandos-restaurant", title: "Nando's Restaurant", summary: "A restaurant interior for Nando's - dining floor and ambience studied across five views.", category: "interior", sector: "Hospitality", location: "", year: "", services: ["Interior Architecture", "3D Visualization"], heroImage: P("nandos-restaurant", 1), interiorImage: P("nandos-restaurant", 2), gallery: G("nandos-restaurant", 5), published: true, sort: 40 },

  // ---- ADU added 2026-08-09 ----
  { slug: "adu", title: "ADU", summary: "Furnished floor-plan studies for an ADU development - unit layouts explored from a compact studio through multi-bedroom configurations.", category: "adu", sector: "ADU", location: "", year: "", services: ["Architectural Design", "Interior Architecture"], heroImage: P("adu", 1), interiorImage: P("adu", 2), gallery: G("adu", 7), published: true, sort: 41 },
];

export const SEED_GALLERY = [
  { title: "Apartments at Hesperia", sector: "Multifamily", image: P("apartments-hesperia", 1), category: "residential", type: "photo", tall: true, sort: 0 },
  { title: "Town Homes at La Habra", sector: "Townhomes", image: P("town-homes-la-habra", 1), category: "residential", type: "photo", sort: 1 },
  { title: "Senior Housing at Fontana", sector: "Senior living", image: P("senior-housing-fontana", 2), category: "residential", type: "photo", tall: true, sort: 2 },
  { title: "Moreno Valley - Pool", sector: "Amenity", image: P("moreno-valley", 3), category: "residential", type: "photo", sort: 3 },
  { title: "Lot 07", sector: "Single family", image: P("sfr-lot-07", 1), category: "residential", type: "photo", sort: 4 },
  { title: "San Pedro House", sector: "Single family", image: P("san-pedro-house", 1), category: "residential", type: "photo", sort: 5 },
  { title: "Tustin House", sector: "Remodel", image: P("tustin-house", 1), category: "residential", type: "photo", sort: 6 },
  { title: "Lot 09", sector: "Single family", image: P("sfr-lot-09", 1), category: "residential", type: "photo", tall: true, sort: 7 },
  { title: "Office at San Diego", sector: "Office", image: P("office-san-diego", 1), category: "commercial", type: "photo", sort: 8 },
  { title: "Auto Part at Riverside", sector: "Commercial", image: P("auto-part-riverside", 1), category: "commercial", type: "photo", sort: 9 },
  { title: "Hesperia at Commercial", sector: "Commercial", image: P("hesperia-commercial", 1), category: "commercial", type: "photo", tall: true, sort: 10 },
  { title: "Truck Servicing at Fontana", sector: "Industrial", image: P("truck-servicing-fontana", 1), category: "commercial", type: "photo", sort: 11 },
  { title: "Cannabis Lounge", sector: "Hospitality", image: P("cannabis-lounge", 1), category: "commercial", type: "photo", sort: 12 },
  { title: "Condominium & Temple", sector: "Mixed use", image: P("condominium-temple-simi-valley", 1), category: "architecture", type: "photo", sort: 13 },
  { title: "Hesperia at 47 West", sector: "Multifamily", image: P("hesperia-47-west", 1), category: "architecture", type: "photo", sort: 14 },
  { title: "Moreno Valley - Streetscape", sector: "Multifamily", image: P("moreno-valley", 1), category: "architecture", type: "photo", tall: true, sort: 15 },
  { title: "Foyer Study", sector: "Interior", image: "/gallery/foyer.webp", category: "residential", type: "photo", sort: 16 },
  { title: "Bedroom Study", sector: "Interior", image: "/gallery/crimson-bed.webp", category: "residential", type: "photo", tall: true, sort: 17 },
];

export const SEED_MEDIA = [
  "hero", "atelier-house", "interior", "urban-oasis", "leafy-precinct",
  "riverside-warehouse", "meridian-sports", "harbour-masterplan",
  "office-tower", "living-pool", "rooftop-pool",
].map((n) => ({ path: R(n), alt: n.replace(/-/g, " ") }))
  .concat([
    { path: "/media/blog-banner.png", alt: "Journal CTA banner" },
    { path: "/media/cta-banner.png", alt: "Start your project banner" },
    { path: PLACEHOLDER, alt: "Renders coming soon" },
    { path: "/media/avatars/avatar-1.webp", alt: "Placeholder portrait 1" },
    { path: "/media/avatars/avatar-2.webp", alt: "Placeholder portrait 2" },
    { path: "/media/avatars/avatar-3.webp", alt: "Placeholder portrait 3" },
  ])
  // Every imported project render, so the media pickers can browse them.
  .concat(SEED_PROJECTS.flatMap((p) => p.gallery.map((path, i) => ({ path, alt: `${p.title} - view ${i + 1}` }))));
