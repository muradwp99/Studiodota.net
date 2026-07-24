import type { Metadata } from "next";
import { getBlock } from "@/lib/content";
import type { SeoBlob } from "@/lib/seoScore";

export type { SeoBlob };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const bool = (v: unknown) => v === true;

/**
 * Builds a page's full metadata (title/canonical/OG/Twitter/robots) from its
 * SEO blob merged over global defaults (site + seo blocks). Every route funnels
 * through here so tags stay consistent. Per-field: blob → fallback → global.
 */
export async function pageMetadata(o: {
  seo?: SeoBlob | null;
  title?: string;
  description?: string;
  image?: string;
  path: string;
  type?: "website" | "article";
}): Promise<Metadata> {
  const [site, defaults] = await Promise.all([getBlock("site"), getBlock("seo")]);
  const s = (o.seo ?? {}) as SeoBlob;

  const title = str(s.title) || (o.title ?? "");
  const description = str(s.description) || o.description || defaults.defaultDescription || site.metaDescription;
  const image = str(s.ogImage) || o.image || defaults.defaultOgImage || site.ogImage;
  const ogTitle = str(s.ogTitle) || title || site.metaTitle;
  const ogDesc = str(s.ogDescription) || description;
  const twImage = str(s.twitterImage) || image;
  const twTitle = str(s.twitterTitle) || ogTitle;
  const twDesc = str(s.twitterDescription) || ogDesc;
  const canonical = str(s.canonical) || o.path;

  const noindex = bool(s.noindex) || defaults.noindexSite;
  const nofollow = bool(s.nofollow);
  const noarchive = bool(s.noarchive);
  const robots =
    noindex || nofollow || noarchive
      ? { index: !noindex, follow: !nofollow, ...(noarchive ? { noarchive: true } : {}) }
      : undefined;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      type: o.type || "website",
      url: o.path,
      siteName: site.name,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: (defaults.twitterCard as "summary_large_image") || "summary_large_image",
      title: twTitle,
      description: twDesc,
      ...(defaults.twitterSite ? { site: defaults.twitterSite } : {}),
      ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
      ...(twImage ? { images: [twImage] } : {}),
    },
    ...(robots ? { robots } : {}),
  };
}
