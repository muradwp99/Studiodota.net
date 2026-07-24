import type { Metadata } from "next";
import { getBlock } from "@/lib/content";

/**
 * One place that builds a page's title/description/canonical/OG/Twitter/robots,
 * merged over the global defaults in the `site` + `seo` blocks. Every route's
 * generateMetadata funnels through here so social + canonical tags stay
 * consistent. Empty per-page values fall back to the global defaults.
 */
export async function pageMetadata(o: {
  title?: string;
  description?: string;
  image?: string;
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
}): Promise<Metadata> {
  const [site, seo] = await Promise.all([getBlock("site"), getBlock("seo")]);
  const description = o.description || seo.defaultDescription || site.metaDescription;
  const image = o.image || seo.defaultOgImage || site.ogImage;
  const ogTitle = o.title || site.metaTitle;
  const noindex = o.noindex || seo.noindexSite;

  return {
    // string → wrapped by the root layout's title template; omitted → inherits default
    ...(o.title ? { title: o.title } : {}),
    description,
    alternates: { canonical: o.path },
    openGraph: {
      title: ogTitle,
      description,
      type: o.type || "website",
      url: o.path,
      siteName: site.name,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: (seo.twitterCard as "summary_large_image") || "summary_large_image",
      title: ogTitle,
      description,
      ...(seo.twitterSite ? { site: seo.twitterSite } : {}),
      ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
      ...(image ? { images: [image] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
