/**
 * Typed content layer. Studiodota - architecture & design practice.
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
    href: "#",
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
  { label: "Services", href: "#" },
  { label: "Studio", href: "#" },
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
      "We lead projects end to end - brief, concept, planning, technical design, and construction - resolving form, structure, and detail into buildings built to last.",
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
      "Passive design, embodied-carbon thinking, and building performance embedded from the first sketch - never bolted on.",
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
    body: "We design for daily life, not just the drawing - spaces that keep working long after handover.",
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
    body: "We define goals, site, budget, and constraints - then test what's genuinely possible.",
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

export type PostSection = { id: string; heading: string; body: string[] };
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: number;
  image: string;
  inlineImage?: string;
  author: { name: string; role: string };
  intro: string;
  sections: PostSection[];
};

export const posts: Post[] = [
  {
    slug: "designing-for-daylight",
    title: "Designing for daylight",
    excerpt: "How orientation, glazing, and section quietly shape a building's whole feeling.",
    category: "Craft",
    date: "2026-06-18",
    readingTime: 6,
    image: "interior",
    inlineImage: "atelier-house",
    author: { name: "Elena Marsh", role: "Principal Architect" },
    intro:
      "Daylight is the cheapest and most powerful material in architecture - and the easiest to waste. Get it right and a modest room feels generous; get it wrong and no finish will rescue it. Here is how we design for light from the first sketch.",
    sections: [
      {
        id: "start-with-the-sun",
        heading: "Start with the sun, not the plan",
        body: [
          "Before we draw a single wall, we map how the sun crosses the site across the day and the year. Which rooms want the low, warm light of morning? Which need to be shielded from harsh afternoon glare? Orientation is a free design move, and it decides more about how a building feels than almost anything that follows.",
        ],
      },
      {
        id: "section-does-the-work",
        heading: "The section does the heavy lifting",
        body: [
          "Windows alone rarely bring light deep into a plan. A well-cut section does: a split level, a clerestory, or a carefully placed void can wash daylight across a room's back wall and halve the hours the lights are on. We design in section as much as in plan, because that is where daylight is really won or lost.",
        ],
      },
      {
        id: "glazing-with-intent",
        heading: "Glazing with intent",
        body: [
          "More glass is not more light - it is more glare, more heat, and more energy to manage. We size and place openings to their orientation, then shade them with the building's own geometry: deep reveals, overhangs, and screens that let winter sun in and keep summer sun out. The goal is even, usable light, not a wall of glass.",
        ],
      },
      {
        id: "test-it",
        heading: "Test it, don't guess it",
        body: [
          "Daylight is measurable, so we measure it. Shadow studies and daylight-factor models let us test a design before it is built and adjust while changes are still cheap. It means the quality of light we promise on paper is the quality that survives to the finished room.",
        ],
      },
    ],
  },
  {
    slug: "material-honesty",
    title: "Material honesty in modern architecture",
    excerpt: "Why we let concrete, timber, and stone read as themselves rather than dressing them up.",
    category: "Philosophy",
    date: "2026-05-02",
    readingTime: 5,
    image: "riverside-warehouse",
    inlineImage: "atelier-house",
    author: { name: "Tomas Reyes", role: "Associate, Detailing" },
    intro:
      "We let concrete, timber, and stone read as themselves rather than dressing them up. Honest materials age with grace and quietly tell the truth about how a building is made - and that honesty is what makes a space feel calm and enduring.",
    sections: [
      {
        id: "what-it-means",
        heading: "What material honesty means",
        body: [
          "Material honesty is simply letting a material do what it does well, and look like what it is. Board-formed concrete keeps the grain of its timber mould; oak is finished to feel like oak, not stained to imitate something rarer. The result is a palette with fewer materials, used with more conviction.",
        ],
      },
      {
        id: "detailing-the-join",
        heading: "Detailing the join",
        body: [
          "Honesty lives in the junctions. Where two materials meet, we resolve the join rather than hide it behind trim - a shadow gap, a clean reveal, a considered edge. Good detailing is what separates a surface that feels intentional from one that feels merely covered.",
        ],
      },
      {
        id: "ageing-as-a-feature",
        heading: "Ageing as a feature, not a fault",
        body: [
          "Real materials patina: timber silvers, brass darkens, stone wears smooth at the threshold. We choose materials that improve with use rather than degrade, so the building looks better in ten years than on handover day.",
        ],
      },
      {
        id: "less-finish",
        heading: "Less finish, more feeling",
        body: [
          "Every layer of applied finish is a maintenance liability and a small dishonesty. By reducing finishes and trusting the base materials, we build interiors that are quieter, more tactile, and far easier to live with over time.",
        ],
      },
    ],
  },
  {
    slug: "planning-with-people",
    title: "Planning with people, not just plots",
    excerpt: "Our approach to public realm and community-led masterplanning.",
    category: "Urbanism",
    date: "2026-03-27",
    readingTime: 5,
    image: "harbour-masterplan",
    inlineImage: "leafy-precinct",
    author: { name: "Priya Nair", role: "Head of Urbanism" },
    intro:
      "A masterplan is not a mosaic of plots to be filled - it is a framework for daily life. We plan for movement, gathering, and the slow accretion of community, then let the buildings follow.",
    sections: [
      {
        id: "start-with-the-walk",
        heading: "Start with the walk",
        body: [
          "The first thing we design in any precinct is the walk: the routes people take to the shop, the school, the station. Get the network of streets and paths right and everything else - density, frontage, street life - becomes easier. Get it wrong and no amount of good architecture will fix it.",
        ],
      },
      {
        id: "public-rooms",
        heading: "Public rooms, not leftover space",
        body: [
          "The best public realm is designed as deliberately as any interior. Squares, courtyards, and edges are 'public rooms' with a clear shape, orientation, and reason to linger - not the space left over once the buildings are placed.",
        ],
      },
      {
        id: "phasing-for-real-life",
        heading: "Phasing for real life",
        body: [
          "Precincts are built over years, not overnight. We phase so that each stage feels complete and lived-in on its own - a place people want to be even while the next stage is still a building site.",
        ],
      },
      {
        id: "the-plan-you-cant-draw",
        heading: "Designing for the plan you can't draw",
        body: [
          "A masterplan has to absorb decades of change no drawing can predict. We build in generous bones - robust streets, adaptable blocks, mixed uses - so the place can evolve without being redesigned.",
        ],
      },
    ],
  },
  {
    slug: "low-carbon-by-design",
    title: "Low-carbon by design, not by add-on",
    excerpt: "Cutting carbon starts with the first sketch - through form, structure, and what you choose not to build.",
    category: "Sustainability",
    date: "2026-02-11",
    readingTime: 6,
    image: "leafy-precinct",
    inlineImage: "meridian-sports",
    author: { name: "Elena Marsh", role: "Principal Architect" },
    intro:
      "Sustainability is not a package of gadgets bolted on at the end. The decisions that matter most for a building's carbon footprint are made in the first week - orientation, structure, and whether to build at all.",
    sections: [
      {
        id: "build-less",
        heading: "Build less, reuse more",
        body: [
          "The greenest square metre is the one you don't build. We test whether an existing structure can be kept, adapted, or extended before proposing anything new - retention is almost always the lower-carbon answer, and often the more characterful one.",
        ],
      },
      {
        id: "embodied-carbon",
        heading: "Embodied carbon is a design decision",
        body: [
          "The structure and materials of a building lock in carbon before anyone switches on a light. Choosing timber over concrete where we can, right-sizing structure, and specifying low-carbon mixes are design decisions, not procurement footnotes - so we make them early and deliberately.",
        ],
      },
      {
        id: "passive-first",
        heading: "Passive before active",
        body: [
          "A well-oriented, well-insulated, well-shaded building needs far less mechanical help. We exhaust passive strategies - form, fabric, daylight, natural ventilation - before adding systems, so the technology has less work to do and less to go wrong.",
        ],
      },
      {
        id: "measure-what-matters",
        heading: "Measure what matters",
        body: [
          "We track embodied and operational carbon through design the way we track cost, so trade-offs are made with real numbers. A target you don't measure is a target you'll miss.",
        ],
      },
    ],
  },
  {
    slug: "interiors-that-last",
    title: "Interiors that last: light, material, and flow",
    excerpt: "Interiors that feel effortless are the product of light, material, and how people actually move.",
    category: "Interiors",
    date: "2026-01-20",
    readingTime: 5,
    image: "living-pool",
    inlineImage: "urban-oasis",
    author: { name: "Sofia Lindqvist", role: "Head of Interior Architecture" },
    intro:
      "The interiors people love rarely shout. They resolve light, material, and flow into something that simply feels right to be in - and keeps feeling that way years after the trends that surrounded them have passed.",
    sections: [
      {
        id: "flow-first",
        heading: "Design the flow first",
        body: [
          "Before finishes, we design how a person moves through a space: where they pause, what they see first, how one room releases into the next. When the flow is right, a home feels larger and calmer than its floor area suggests.",
        ],
      },
      {
        id: "palette-over-decoration",
        heading: "A palette, not decoration",
        body: [
          "We build interiors from a tight material palette rather than a collection of decorative gestures. A few honest materials, repeated with discipline, read as considered and age far better than a room styled to a moment.",
        ],
      },
      {
        id: "light-in-layers",
        heading: "Light in layers",
        body: [
          "Great interior lighting is layered - daylight, ambient, task, and accent - and mostly invisible. We design the lighting with the architecture so the fittings disappear and only the effect remains.",
        ],
      },
      {
        id: "felt-not-noticed",
        heading: "Detailing you feel but don't notice",
        body: [
          "The comfort of a good interior comes from details most people never consciously see: the height of a sill, the reveal around a door, the warmth of a handle. We resolve them so the space feels effortless - which is the hardest effect to achieve.",
        ],
      },
    ],
  },
  {
    slug: "reading-a-site",
    title: "Reading a site before drawing a line",
    excerpt: "Every good building starts by listening to its site - long before a line is drawn.",
    category: "Process",
    date: "2025-12-08",
    readingTime: 5,
    image: "atelier-house",
    inlineImage: "harbour-masterplan",
    author: { name: "Tomas Reyes", role: "Associate" },
    intro:
      "Before we design anything, we read the site - its light, its edges, its history, and the way people already move through it. The best moves are usually already there, waiting to be found rather than invented.",
    sections: [
      {
        id: "walk-it",
        heading: "Walk it, in every season",
        body: [
          "Drawings and surveys only go so far. We walk a site at different times of day and, where we can, across seasons - noticing where the sun lands, where the wind funnels, where the views open and where they should be closed. Much of the brief is written by the site itself.",
        ],
      },
      {
        id: "constraints-are-the-brief",
        heading: "Constraints are the brief",
        body: [
          "A tight boundary, a level change, a protected tree - the constraints that look like problems are usually the source of a building's character. We treat them as the starting point of the design rather than obstacles to be flattened.",
        ],
      },
      {
        id: "context-without-pastiche",
        heading: "Context without pastiche",
        body: [
          "Responding to context does not mean copying the neighbours. We take cues from scale, material, and rhythm, then answer them in a contemporary language - a building that belongs without pretending to be older than it is.",
        ],
      },
      {
        id: "first-move",
        heading: "From reading to first move",
        body: [
          "Only once the site is understood do we make the first move - usually a single, clear idea that organises everything after it. A design grounded in its site needs fewer gestures to feel inevitable.",
        ],
      },
    ],
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
