/**
 * RankMath-style content analysis — a pure scorer shared by the admin SeoPanel
 * (live) and anywhere else. No dependencies, no network. Given the entity's
 * SEO fields + its content, it returns a 0–100 score and a checklist.
 */
export type SeoInput = {
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  slug?: string;
  /** Plain-text body used for keyword-in-content checks (optional). */
  content?: string;
};

export type SeoCheck = { id: string; label: string; status: "good" | "ok" | "bad" };
export type SeoResult = { score: number; label: string; checks: SeoCheck[] };

/** RankMath-style per-entity SEO blob. All fields optional; empty = fall back. */
export type SeoBlob = Partial<{
  title: string; description: string; focusKeyword: string; canonical: string;
  ogTitle: string; ogDescription: string; ogImage: string;
  twitterTitle: string; twitterDescription: string; twitterImage: string;
  noindex: boolean; nofollow: boolean; noarchive: boolean;
}>;

const SEO_STR_KEYS = ["title", "description", "focusKeyword", "canonical", "ogTitle", "ogDescription", "ogImage", "twitterTitle", "twitterDescription", "twitterImage"] as const;
const SEO_BOOL_KEYS = ["noindex", "nofollow", "noarchive"] as const;

/** Coerce arbitrary input into a clean SeoBlob (trusted-length trims, bools). */
export function sanitizeSeo(input: unknown): SeoBlob {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of SEO_STR_KEYS) out[k] = typeof src[k] === "string" ? (src[k] as string).trim().slice(0, 600) : "";
  for (const k of SEO_BOOL_KEYS) out[k] = src[k] === true;
  return out as SeoBlob;
}

const has = (haystack: string, needle: string) =>
  needle.length > 0 && haystack.toLowerCase().includes(needle.toLowerCase());

const words = (s: string) => (s.trim().match(/\S+/g) ?? []).length;

export function analyzeSeo(input: SeoInput): SeoResult {
  const title = (input.seoTitle ?? "").trim();
  const desc = (input.seoDescription ?? "").trim();
  const kw = (input.focusKeyword ?? "").split(",")[0]?.trim() ?? "";
  const slug = (input.slug ?? "").trim();
  const content = (input.content ?? "").trim();
  const titleLen = title.length;
  const descLen = desc.length;

  const checks: SeoCheck[] = [];
  const add = (id: string, label: string, status: SeoCheck["status"]) => checks.push({ id, label, status });

  // Title
  add("title-set", "SEO title is set", titleLen > 0 ? "good" : "bad");
  add(
    "title-len",
    `Title length is good (${titleLen}/60)`,
    titleLen === 0 ? "bad" : titleLen >= 15 && titleLen <= 60 ? "good" : "ok",
  );

  // Description
  add("desc-set", "Meta description is set", descLen > 0 ? "good" : "bad");
  add(
    "desc-len",
    `Description length is good (${descLen}/160)`,
    descLen === 0 ? "bad" : descLen >= 120 && descLen <= 160 ? "good" : "ok",
  );

  // Focus keyword
  if (kw) {
    add("kw-title", "Focus keyword in the SEO title", has(title, kw) ? "good" : "bad");
    add("kw-desc", "Focus keyword in the meta description", has(desc, kw) ? "good" : "bad");
    add("kw-slug", "Focus keyword in the URL", has(slug.replace(/-/g, " "), kw) ? "good" : "ok");
    if (content) {
      add("kw-content", "Focus keyword appears in the content", has(content, kw) ? "good" : "bad");
      const density = content.toLowerCase().split(kw.toLowerCase()).length - 1;
      add(
        "kw-density",
        `Keyword used ${density} time${density === 1 ? "" : "s"} in the content`,
        density >= 1 ? "good" : "ok",
      );
    }
  } else {
    add("kw-set", "Set a focus keyword to grade against", "bad");
  }

  // Content length (when available)
  if (content) {
    const wc = words(content);
    add("content-len", `Content length (${wc} words)`, wc >= 300 ? "good" : wc >= 120 ? "ok" : "bad");
  }

  const good = checks.filter((c) => c.status === "good").length;
  const ok = checks.filter((c) => c.status === "ok").length;
  const score = Math.round(((good + ok * 0.5) / checks.length) * 100);
  const label = score >= 80 ? "Good" : score >= 50 ? "OK" : "Poor";
  return { score, label, checks };
}
