/**
 * Canonical list of homepage sections — the single source of truth for both
 * the public renderer (components/home/Sections.tsx) and the admin
 * "Homepage layout" manager. The `home.layout` block stores only {id, enabled}
 * in this order; labels + which component renders each id live in code.
 */
export const HOME_SECTION_META = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "whyChoose", label: "Why choose us" },
  { id: "featured", label: "Featured projects" },
  { id: "showreel", label: "Showreel" },
  { id: "process", label: "Process" },
  { id: "timeline", label: "Selected works" },
  { id: "testimonials", label: "Testimonials" },
  { id: "clients", label: "Clients" },
  { id: "statement", label: "The practice (statement)" },
  { id: "faq", label: "FAQ" },
  { id: "journals", label: "Journal strip" },
  { id: "cta", label: "Get in touch (contact CTA)" },
] as const;

export type HomeSectionId = (typeof HOME_SECTION_META)[number]["id"];
export const HOME_SECTION_IDS = HOME_SECTION_META.map((s) => s.id) as HomeSectionId[];
export const labelFor = (id: string) => HOME_SECTION_META.find((s) => s.id === id)?.label ?? id;
