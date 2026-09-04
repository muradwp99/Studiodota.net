import type { BlockKey } from "@/content/defaults";

/**
 * Declarative field specs for every editable block. Drives BOTH the admin form
 * renderer and the server-side validator, so the two can't drift apart.
 */
export type FieldSpec =
  | { kind: "text"; key: string; label: string; help?: string }
  | { kind: "textarea"; key: string; label: string; rows?: number; help?: string }
  | { kind: "number"; key: string; label: string; help?: string }
  | { kind: "toggle"; key: string; label: string; help?: string }
  | { kind: "image"; key: string; label: string; help?: string }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[]; help?: string }
  | { kind: "stringList"; key: string; label: string; help?: string }
  | { kind: "seo"; key: string; label: string; help?: string }
  | { kind: "group"; key: string; label: string; fields: FieldSpec[] }
  | { kind: "list"; key: string; label: string; item: FieldSpec[]; addable?: boolean; help?: string };

export type BlockSpec = { key: BlockKey; title: string; description?: string; fields: FieldSpec[] };

const t = (key: string, label: string): FieldSpec => ({ kind: "text", key, label });
const ta = (key: string, label: string, rows = 3): FieldSpec => ({ kind: "textarea", key, label, rows });
const num = (key: string, label: string): FieldSpec => ({ kind: "number", key, label });
const img = (key: string, label: string): FieldSpec => ({ kind: "image", key, label });
const tog = (key: string, label: string): FieldSpec => ({ kind: "toggle", key, label });

const statItem = [num("end", "Number"), t("suffix", "Suffix"), t("label", "Label"), ta("desc", "Description", 2)];
const quoteItem = [ta("quote", "Quote", 3), t("name", "Name"), t("role", "Role / company"), img("image", "Portrait")];

export const BLOCK_SPECS: BlockSpec[] = [
  {
    key: "site",
    title: "Site settings",
    description: "Brand, contact details, SEO metadata, and the footer.",
    fields: [
      t("name", "Site name"),
      t("tagline", "Tagline"),
      t("email", "Contact email"),
      t("phone", "Phone"),
      t("address1", "Address line 1"),
      t("address2", "Address line 2"),
      t("metaTitle", "SEO — default title"),
      ta("metaDescription", "SEO — meta description"),
      img("ogImage", "Default social share image (Open Graph)"),
      t("twitterHandle", "Twitter/X handle (e.g. @studiodota)"),
      t("footerHeadline", "Footer headline"),
      { kind: "stringList", key: "footerServices", label: "Footer service links" },
      { kind: "list", key: "socials", label: "Social links", addable: true, item: [t("label", "Label"), t("href", "URL")] },
    ],
  },
  {
    key: "nav",
    title: "Navigation",
    description: "Menu items are managed under Appearance → Menus.",
    fields: [t("getStartedLabel", "Get Started — label"), t("getStartedHref", "Get Started — link")],
  },
  {
    key: "integrations",
    title: "Integrations & tracking",
    description: "Paste an ID and the tracking script is added automatically. Custom code is injected site-wide — only paste code you trust.",
    fields: [
      t("gaId", "Google Analytics 4 — Measurement ID (G-XXXXXXX)"),
      t("gtmId", "Google Tag Manager — Container ID (GTM-XXXXXX)"),
      t("metaPixelId", "Meta (Facebook) Pixel ID"),
      t("tiktokPixelId", "TikTok Pixel ID"),
      ta("headCode", "Custom code — <head> (verification meta, fonts, analytics)", 5),
      ta("footerCode", "Custom code — before </body> (chat widgets, extra scripts)", 5),
      t("notifyEmail", "Email new enquiries to (blank = your contact email)"),
    ],
  },
  {
    key: "home.hero",
    title: "Hero",
    description: "Full-screen slider at the top of the homepage.",
    fields: [
      { kind: "list", key: "slides", label: "Background slides", addable: true, item: [img("image", "Image")] },
      t("titleAccent", "Headline — accent word"),
      t("titleRestLine1", "Headline — line 1"),
      t("titleRestLine2", "Headline — line 2"),
      ta("lede", "Lede paragraph"),
      t("ctaLabel", "Button label"),
      t("ctaHref", "Button link"),
    ],
  },
  {
    key: "home.about",
    title: "About",
    fields: [
      t("kicker", "Kicker"),
      ta("title", "Heading", 2),
      ta("paragraph1", "Paragraph 1", 4),
      ta("paragraph2", "Paragraph 2", 4),
      t("ctaLabel", "Link label"),
      { kind: "list", key: "stats", label: "Stats", addable: true, item: statItem },
    ],
  },
  {
    key: "home.services",
    title: "What we do (slider)",
    fields: [
      t("kicker", "Kicker"),
      t("title", "Heading"),
      {
        kind: "list", key: "items", label: "Services", addable: true,
        item: [t("title", "Title"), ta("sub", "Description", 3), { kind: "stringList", key: "tags", label: "Tags" }, img("image", "Image")],
      },
    ],
  },
  {
    key: "home.whyChoose",
    title: "Why choose us",
    fields: [
      t("label", "Label"),
      ta("title", "Heading", 2),
      ta("body", "Body", 3),
      t("ctaLabel", "Button label"),
      { kind: "group", key: "cardLeft", label: "Left image card", fields: [img("image", "Image"), t("prefix", "Value prefix"), num("end", "Number"), t("suffix", "Suffix"), ta("label", "Caption", 2)] },
      { kind: "group", key: "cardMidTop", label: "Middle card (top)", fields: [num("end", "Number"), t("suffix", "Suffix"), ta("label", "Caption", 2)] },
      { kind: "group", key: "cardMidBottom", label: "Middle card (bottom)", fields: [num("end", "Number"), t("suffix", "Suffix"), ta("label", "Caption", 2)] },
      { kind: "group", key: "cardRight", label: "Right image card", fields: [img("image", "Image"), num("end", "Number"), t("suffix", "Suffix"), ta("label", "Caption", 2)] },
    ],
  },
  {
    key: "home.featured",
    title: "Featured projects (Inside, Outside)",
    fields: [
      t("kicker", "Kicker"),
      t("title", "Heading"),
      t("titleMuted", "Heading — muted word"),
      t("linkLabel", "Link label"),
      {
        kind: "list", key: "items", label: "Project cards", addable: true,
        item: [t("slug", "Project slug (links to /projects/…)"), t("title", "Title"), t("location", "Location"), t("year", "Year"), img("image", "Image")],
      },
    ],
  },
  {
    key: "home.showreel",
    title: "Showreel",
    description: "The scroll-driven film strip. YouTube ID is the 11-character code from the video URL.",
    fields: [
      t("label", "Label"),
      t("linkLabel", "Corner link label"),
      {
        kind: "list", key: "items", label: "Slides", addable: true,
        item: [img("image", "Poster image"), t("title", "Title"), t("kicker", "Kicker"), t("youtubeId", "YouTube video ID"), t("mp4", "Self-hosted MP4 URL (e.g. /media/clip.mp4) — takes priority over YouTube ID")],
      },
    ],
  },
  {
    key: "home.process",
    title: "Our process",
    fields: [
      t("label", "Label"),
      ta("intro", "Intro", 3),
      t("ctaLabel", "Button label"),
      { kind: "list", key: "steps", label: "Steps", addable: true, item: [t("n", "Number"), t("title", "Title"), ta("body", "Body", 2), img("image", "Image")] },
    ],
  },
  {
    key: "home.timeline",
    title: "Projects timeline",
    fields: [
      t("title", "Heading"),
      { kind: "list", key: "items", label: "Milestones", addable: true, item: [t("year", "Year"), t("n", "Number"), t("pre", "Title — before accent"), t("accent", "Title — accent"), t("post", "Title — after accent"), img("image", "Image")] },
    ],
  },
  {
    key: "home.testimonials",
    title: "Testimonials",
    fields: [
      t("label", "Label"),
      ta("title", "Heading", 2),
      { kind: "group", key: "featured", label: "Featured quote", fields: quoteItem },
      { kind: "list", key: "quotes", label: "Side quotes", addable: true, item: quoteItem },
      t("ctaLabel", "Link label"),
    ],
  },
  {
    key: "home.clients",
    title: "Clients marquee",
    fields: [t("label", "Label"), { kind: "stringList", key: "rowA", label: "Row A names" }, { kind: "stringList", key: "rowB", label: "Row B names" }],
  },
  {
    key: "home.statement",
    title: "Statement band",
    fields: [t("label", "Label"), t("word", "Giant word"), img("image", "Image inside the letters"), ta("body", "Body", 3)],
  },
  {
    key: "home.faq",
    title: "FAQ",
    fields: [
      t("label", "Label"),
      t("title", "Heading"),
      ta("description", "Intro description", 2),
      t("cardInitials", "Card — initials"),
      t("cardTitle", "Card — title"),
      ta("cardBody", "Card — body", 2),
      t("cardCta", "Card — button label"),
      t("supportLabel", "Support row — headline"),
      ta("supportBody", "Support row — body", 2),
      t("supportCta", "Support row — button label"),
      { kind: "list", key: "items", label: "Questions", addable: true, item: [t("q", "Question"), ta("a", "Answer", 3)] },
    ],
  },
  {
    key: "home.journals",
    title: "Journal strip",
    description: "The articles shown come from Journal posts (newest first).",
    fields: [ta("title", "Heading", 2), t("viewAllLabel", "Button label")],
  },
  {
    key: "home.cta",
    title: "Contact CTA",
    fields: [
      t("label", "Label"),
      ta("title", "Heading", 2),
      ta("body", "Body", 3),
      t("submitLabel", "Submit button label"),
      img("image", "Background image"),
    ],
  },
  {
    key: "page.services",
    title: "Services page",
    fields: [
      t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results only - the giant on-page heading is fixed per page)"), ta("lede", "Hero lede"), img("image", "Hero image"),
      ta("statement", "Scroll statement", 3),
      {
        kind: "list", key: "items", label: "Service phases", addable: true,
        item: [t("id", "Anchor id"), t("num", "Phase number"), t("title", "Title"), ta("blurb", "Blurb", 2), img("image", "Image"), { kind: "stringList", key: "tags", label: "Line items" }],
      },
      t("ctaTitle", "Bottom CTA title"), t("ctaLabel", "Bottom CTA button"),
    ],
  },
  {
    key: "page.about",
    title: "Who we are page",
    fields: [
      t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results only - the giant on-page heading is fixed per page)"), ta("lede", "Hero lede"),
      t("whyLabel", "Story label"), ta("why1", "Story paragraph 1", 4), ta("why2", "Story paragraph 2", 4),
      img("storyImage", "Story image"),
      t("quoteLabel", "Quote label"), ta("quote", "Founder quote", 4), t("quoteName", "Quote name"), t("quoteRole", "Quote role"),
      { kind: "list", key: "stats", label: "Stats", item: [t("value", "Value"), t("suffix", "Suffix"), t("label", "Label")] },
      t("processTitle", "Process heading"),
      { kind: "list", key: "process", label: "Process steps", addable: true, item: [t("step", "Number"), t("title", "Title"), ta("body", "Body", 2)] },
      t("ctaTitle", "Bottom CTA title"), t("ctaLabel", "Bottom CTA button"),
    ],
  },
  {
    key: "page.projects",
    title: "Projects page",
    description: "Hero copy. This page's header is deliberately typographic-only (no hero image). The project list itself is managed under Projects.",
    fields: [t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results only - the giant on-page heading is fixed per page)"), ta("lede", "Hero lede")],
  },
  {
    key: "page.gallery",
    title: "Gallery page",
    description: "Hero copy. The gallery grid is managed under Gallery.",
    fields: [tog("published", "Published (unpublished shows a 404)"), t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results only - the giant on-page heading is fixed per page)"), ta("lede", "Hero lede"), img("image", "Hero image")],
  },
  {
    key: "page.journal",
    title: "Journal page",
    description: "Hero + banner. Articles are managed under Posts.",
    fields: [t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results only - the giant on-page heading is fixed per page)"), ta("lede", "Hero lede"), img("image", "Hero image"), img("bannerImage", "Bottom banner image"), t("bannerAlt", "Banner alt text")],
  },
  {
    key: "page.contact",
    title: "Contact page",
    fields: [
      t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results only - the giant on-page heading is fixed per page)"), ta("lede", "Hero lede"), img("image", "Hero image"),
      t("formLabel", "Form label"), t("formTitle", "Form heading"),
      ta("whatToSend", "Aside — what to send", 3), ta("turnaround", "Aside — turnaround", 3), img("asideImage", "Aside image"),
      { kind: "stringList", key: "serviceOptions", label: "Service dropdown options" },
    ],
  },
  {
    key: "page.clientVoices",
    title: "Client Voices page",
    description: "The testimonials page. Long-form letters render as full quotes; short notes fill the wall below. Leave a portrait blank and the card falls back to the client's initial.",
    fields: [
      t("eyebrow", "Hero eyebrow"), t("title", "Page title (browser tab & search results)"), ta("lede", "Hero lede", 5), img("heroImage", "Hero image"),
      t("videoLabel", "Video section label"),
      {
        kind: "group", key: "video", label: "Video testimonial",
        fields: [t("mp4", "Video file (mp4)"), img("poster", "Poster image"), t("name", "Client name"), t("role", "Client role"), ta("caption", "Caption", 2)],
      },
      {
        kind: "list", key: "featured", label: "Long-form letters", addable: true,
        item: [t("name", "Name"), t("role", "Role"), img("image", "Portrait (optional)"), { kind: "stringList", key: "paragraphs", label: "Paragraphs" }],
      },
      {
        kind: "list", key: "items", label: "Short quotes", addable: true,
        item: [ta("quote", "Quote", 4), t("name", "Name"), t("role", "Role")],
      },
      t("ctaTitle", "Closing headline"), t("ctaLabel", "Closing button label"),
    ],
  },
  {
    key: "page.privacy",
    title: "Privacy page",
    fields: [
      t("eyebrow", "Hero eyebrow"), t("title", "Hero title"), ta("lede", "Hero lede"),
      { kind: "list", key: "sections", label: "Sections", addable: true, item: [t("heading", "Heading"), ta("body", "Body", 4)] },
    ],
  },
  {
    key: "page.terms",
    title: "Terms page",
    fields: [
      t("eyebrow", "Hero eyebrow"), t("title", "Hero title"), ta("lede", "Hero lede"),
      { kind: "list", key: "sections", label: "Sections", addable: true, item: [t("heading", "Heading"), ta("body", "Body", 4)] },
    ],
  },
  {
    key: "menus",
    title: "Menus",
    description: "The header navigation and the footer Pages column. Services/Gallery/Projects keep their dropdown panels automatically.",
    fields: [
      {
        kind: "list", key: "primary", label: "Primary menu (header)", addable: true,
        item: [
          t("label", "Label"),
          t("href", "Link"),
          { kind: "list", key: "children", label: "Sub-menu items", item: [t("label", "Label"), t("href", "Link")], addable: true },
        ],
      },
      { kind: "list", key: "footerPages", label: "Footer — Pages column", addable: true, item: [t("label", "Label"), t("href", "Link")] },
    ],
  },
  {
    key: "taxonomies",
    title: "Categories",
    description: "Categories available when writing posts, projects, and gallery items.",
    fields: [
      { kind: "stringList", key: "postCategories", label: "Post categories" },
      { kind: "stringList", key: "projectCategories", label: "Project categories" },
      { kind: "stringList", key: "galleryCategories", label: "Gallery categories" },
    ],
  },
  {
    key: "appearance",
    title: "Appearance",
    description: "Edited under Appearance → Themes.",
    fields: [t("accent", "Brand accent (hex)")],
  },
  {
    key: "seo",
    title: "SEO defaults",
    description: "Site-wide search & social defaults. Each page can override them.",
    fields: [
      ta("defaultDescription", "Default meta description", 2),
      img("defaultOgImage", "Default social share image"),
      { kind: "select", key: "twitterCard", label: "Twitter card", options: [
        { value: "summary_large_image", label: "Large image" },
        { value: "summary", label: "Summary" },
      ] },
      t("twitterSite", "Twitter @site handle"),
      tog("organizationSchema", "Emit Organization structured data (JSON-LD)"),
      tog("noindexSite", "Hide the WHOLE site from search engines (staging)"),
      ta("robotsTxt", "Custom robots.txt — leave blank to use the default", 6),
    ],
  },
];

// Give every built-in page the full RankMath-style SEO panel.
for (const s of BLOCK_SPECS) {
  if (s.key.startsWith("page.")) s.fields.push({ kind: "seo", key: "seo", label: "SEO" });
}

export const specFor = (key: string) => BLOCK_SPECS.find((s) => s.key === key);

/** Admin "Pages" tree: which blocks make up each editable page. */
export const PAGES: { slug: string; title: string; blurb: string; blocks: BlockKey[] }[] = [
  {
    slug: "home",
    title: "Homepage",
    blurb: "Hero, every section, and the contact CTA.",
    blocks: ["home.hero", "home.about", "home.services", "home.whyChoose", "home.featured", "home.showreel", "home.process", "home.timeline", "home.testimonials", "home.clients", "home.statement", "home.faq", "home.journals", "home.cta"],
  },
  { slug: "services", title: "Services", blurb: "Hero, statement, and the five service phases.", blocks: ["page.services"] },
  { slug: "about", title: "Who we are", blurb: "Story, founder quote, stats, and process.", blocks: ["page.about"] },
  { slug: "projects", title: "Projects", blurb: "Hero copy for the work index.", blocks: ["page.projects"] },
  { slug: "client-voices", title: "Client Voices", blurb: "Testimonials, the video, and the closing CTA.", blocks: ["page.clientVoices"] },
  { slug: "gallery", title: "Gallery", blurb: "Hero copy for the gallery.", blocks: ["page.gallery"] },
  { slug: "journal", title: "Journal", blurb: "Hero copy and the bottom banner.", blocks: ["page.journal"] },
  { slug: "contact", title: "Contact", blurb: "Hero, form copy, and the aside.", blocks: ["page.contact"] },
  { slug: "privacy", title: "Privacy", blurb: "Policy sections.", blocks: ["page.privacy"] },
  { slug: "terms", title: "Terms", blurb: "Policy sections.", blocks: ["page.terms"] },
];
