import { getBlock } from "@/lib/content";

// Admin-editable, so read fresh per request rather than baking it at build.
export const dynamic = "force-dynamic";

const DEFAULT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://studiodota.net/sitemap.xml`;

/** GET /robots.txt — admin-editable (Settings > SEO), falls back to the default. */
export async function GET() {
  const seo = await getBlock("seo");
  const body = (seo.robotsTxt || "").trim() || DEFAULT;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
