import type { FieldSpec } from "@/lib/pageRegistry";

/**
 * Block-editor element library. Each type defines its settings fields (same
 * FieldSpec engine as page sections — drives the editor sidebar AND server
 * validation) plus sensible defaults so a freshly-inserted block looks real.
 */

export type { Node as PageBlock, PageTree } from "@/lib/nodes/types";

export type BlockType = {
  type: string;
  label: string;
  description: string;
  icon: string;
  fields: FieldSpec[];
  defaults: Record<string, unknown>;
};

const t = (key: string, label: string): FieldSpec => ({ kind: "text", key, label });
const ta = (key: string, label: string, rows = 3): FieldSpec => ({ kind: "textarea", key, label, rows });
const img = (key: string, label: string): FieldSpec => ({ kind: "image", key, label });
const num = (key: string, label: string): FieldSpec => ({ kind: "number", key, label });
const tog = (key: string, label: string): FieldSpec => ({ kind: "toggle", key, label });
const sel = (key: string, label: string, options: { value: string; label: string }[]): FieldSpec => ({ kind: "select", key, label, options });

export const RESERVED_SLUGS = [
  "", "about", "services", "projects", "journal", "gallery", "contact", "privacy",
  "admin", "api", "uploads", "media", "_next", "login", "favicon.ico",
];

export const BLOCK_TYPES: BlockType[] = [
  {
    type: "container",
    label: "Container",
    description: "A flexible box that holds other blocks (row = columns, column = stack).",
    icon: "▢",
    fields: [
      sel("direction", "Direction", [{ value: "column", label: "Stack (column)" }, { value: "row", label: "Row (columns)" }]),
      num("gap", "Gap (px)"),
      sel("align", "Align items", [{ value: "stretch", label: "Stretch" }, { value: "start", label: "Start" }, { value: "center", label: "Center" }, { value: "end", label: "End" }]),
      sel("justify", "Justify", [{ value: "start", label: "Start" }, { value: "center", label: "Center" }, { value: "end", label: "End" }, { value: "between", label: "Space between" }]),
      tog("wrap", "Wrap"),
      tog("stackOnMobile", "Stack on mobile"),
    ],
    defaults: { direction: "column", gap: 24, align: "stretch", justify: "start", wrap: false, stackOnMobile: true },
  },
  {
    type: "hero",
    label: "Hero",
    description: "Full-bleed opening image with title and lede.",
    icon: "◨",
    fields: [t("eyebrow", "Eyebrow"), ta("title", "Title", 2), ta("lede", "Lede", 2), img("image", "Background image"), t("buttonLabel", "Button label"), t("buttonHref", "Button link"), t("height", "Height (full or tall)")],
    defaults: { eyebrow: "New page", title: "A headline for this page.", lede: "", image: "/media/renders/hero.jpg", buttonLabel: "", buttonHref: "/contact", height: "tall" },
  },
  {
    type: "heading",
    label: "Heading",
    description: "A section heading.",
    icon: "H",
    fields: [ta("text", "Heading", 2), num("level", "Level (2 or 3)"), t("align", "Align (left or center)")],
    defaults: { text: "Section heading", level: 2, align: "left" },
  },
  {
    type: "text",
    label: "Text",
    description: "Paragraphs — blank line starts a new one.",
    icon: "¶",
    fields: [ta("body", "Text", 6)],
    defaults: { body: "Write something considered here." },
  },
  {
    type: "image",
    label: "Image",
    description: "A single wide image with optional caption.",
    icon: "▦",
    fields: [img("image", "Image"), t("caption", "Caption"), tog("rounded", "Rounded corners")],
    defaults: { image: "/media/renders/interior.jpg", caption: "", rounded: true },
  },
  {
    type: "imageText",
    label: "Image & text",
    description: "Two columns — image beside copy.",
    icon: "◧",
    fields: [img("image", "Image"), t("title", "Title"), ta("body", "Body", 4), tog("imageLeft", "Image on the left"), t("buttonLabel", "Button label"), t("buttonHref", "Button link")],
    defaults: { image: "/media/renders/atelier-house.jpg", title: "A considered pairing", body: "Image beside text — the workhorse of any page.", imageLeft: true, buttonLabel: "", buttonHref: "" },
  },
  {
    type: "gallery",
    label: "Gallery",
    description: "A grid of images.",
    icon: "▤",
    fields: [{ kind: "list", key: "images", label: "Images", addable: true, item: [img("image", "Image"), t("caption", "Caption")] }],
    defaults: { images: [{ image: "/media/renders/urban-oasis.jpg", caption: "" }, { image: "/media/renders/leafy-precinct.jpg", caption: "" }, { image: "/media/renders/interior.jpg", caption: "" }] },
  },
  {
    type: "video",
    label: "Video",
    description: "A YouTube film (muted autoplay in view).",
    icon: "▶",
    fields: [t("youtubeId", "YouTube video ID"), img("poster", "Poster image")],
    defaults: { youtubeId: "", poster: "/media/renders/meridian-sports.jpg" },
  },
  {
    type: "buttons",
    label: "Buttons",
    description: "One or more call-to-action buttons.",
    icon: "▭",
    fields: [{ kind: "list", key: "items", label: "Buttons", addable: true, item: [t("label", "Label"), t("href", "Link"), t("style", "Style (primary or ghost)")] }],
    defaults: { items: [{ label: "Get in touch", href: "/contact", style: "primary" }] },
  },
  {
    type: "quote",
    label: "Quote",
    description: "A pull quote with attribution.",
    icon: "❝",
    fields: [ta("quote", "Quote", 3), t("name", "Name"), t("role", "Role / company")],
    defaults: { quote: "Good architecture is quiet.", name: "", role: "" },
  },
  {
    type: "stats",
    label: "Stats",
    description: "A row of numbers that matter.",
    icon: "№",
    fields: [{ kind: "list", key: "items", label: "Stats", addable: true, item: [t("value", "Value"), t("suffix", "Suffix"), t("label", "Label")] }],
    defaults: { items: [{ value: "20", suffix: "+", label: "Years of practice" }, { value: "400", suffix: "+", label: "Projects completed" }, { value: "18", suffix: "", label: "Design awards" }] },
  },
  {
    type: "features",
    label: "Feature cards",
    description: "A grid of cards with image, title, and text.",
    icon: "⊞",
    fields: [t("title", "Section title"), { kind: "list", key: "items", label: "Cards", addable: true, item: [img("image", "Image"), t("title", "Title"), ta("body", "Body", 2)] }],
    defaults: { title: "", items: [{ image: "/media/renders/atelier-house.jpg", title: "First", body: "What makes it notable." }, { image: "/media/renders/interior.jpg", title: "Second", body: "What makes it notable." }, { image: "/media/renders/urban-oasis.jpg", title: "Third", body: "What makes it notable." }] },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Questions that open and close.",
    icon: "?",
    fields: [{ kind: "list", key: "items", label: "Questions", addable: true, item: [t("q", "Question"), ta("a", "Answer", 3)] }],
    defaults: { items: [{ q: "A common question?", a: "A clear answer." }] },
  },
  {
    type: "cta",
    label: "Call to action",
    description: "A dark band with a headline and button.",
    icon: "➔",
    fields: [ta("title", "Title", 2), ta("body", "Body", 2), t("buttonLabel", "Button label"), t("buttonHref", "Button link"), img("image", "Background image")],
    defaults: { title: "Let's talk about your project.", body: "", buttonLabel: "Get in touch", buttonHref: "/contact", image: "/media/renders/harbour-masterplan.jpg" },
  },
  {
    type: "columns",
    label: "Columns",
    description: "Two to four text columns side by side.",
    icon: "▥",
    fields: [{ kind: "list", key: "items", label: "Columns", addable: true, item: [t("heading", "Heading"), ta("body", "Text", 4)] }],
    defaults: { items: [{ heading: "First", body: "Describe the first thing." }, { heading: "Second", body: "Describe the second thing." }, { heading: "Third", body: "Describe the third thing." }] },
  },
  {
    type: "embed",
    label: "Embed / HTML",
    description: "Paste a map, form, or any embed / custom HTML.",
    icon: "◇",
    fields: [ta("html", "Embed code / HTML", 5), t("caption", "Caption")],
    defaults: { html: "", caption: "" },
  },
  {
    type: "divider",
    label: "Divider",
    description: "A thin horizontal rule.",
    icon: "—",
    fields: [],
    defaults: {},
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Empty vertical space.",
    icon: "␣",
    fields: [num("size", "Height (rem)")],
    defaults: { size: 4 },
  },
  {
    type: "contactForm",
    label: "Contact form",
    description: "The studio enquiry form.",
    icon: "✉",
    fields: [t("title", "Title"), ta("body", "Intro", 2)],
    defaults: { title: "Send us the brief.", body: "" },
  },
  {
    type: "clients",
    label: "Clients",
    description: "A row of client names.",
    icon: "★",
    fields: [t("label", "Label"), { kind: "stringList", key: "names", label: "Names" }],
    defaults: { label: "Selected clients", names: ["Northline", "Fieldway", "Vanta"] },
  },
];

export const blockTypeFor = (type: string) => BLOCK_TYPES.find((b) => b.type === type);
