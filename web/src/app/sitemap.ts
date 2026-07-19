import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getProjects, getPosts } from "@/lib/content";

const BASE = "https://studiodota.net";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/services",
    "/projects",
    "/journal",
    "/gallery",
    "/contact",
    "/privacy",
  ].map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [projects, posts, pages] = await Promise.all([
      getProjects(),
      getPosts(),
      db.page.findMany({ where: { status: "published", deletedAt: null }, select: { slug: true, updatedAt: true } }),
    ]);
    dynamicRoutes = [
      ...projects.map((p) => ({ url: `${BASE}/projects/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
      ...posts.map((p) => ({ url: `${BASE}/journal/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
      ...pages.map((p) => ({ url: `${BASE}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    // DB down — the static routes still ship.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
