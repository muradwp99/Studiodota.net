import { cache } from "react";
import { db } from "@/lib/db";
import { BLOCK_DEFAULTS, SEED_PROJECTS, SEED_GALLERY, type BlockKey, type BlockData } from "@/content/defaults";

/**
 * Read a content block, merged over its defaults so newly-added fields always
 * have a value even for rows saved before the field existed. Falls back to the
 * defaults entirely if the DB is unreachable — the public site must render.
 */
export const getBlock = cache(async <K extends BlockKey>(key: K): Promise<BlockData[K]> => {
  // BlockData is the deep-mutable twin of the readonly defaults — same shape.
  const fallback = structuredClone(BLOCK_DEFAULTS[key]) as unknown as BlockData[K];
  try {
    const row = await db.block.findUnique({ where: { key } });
    if (row && row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
      return { ...fallback, ...(row.data as object) } as BlockData[K];
    }
  } catch {
    // DB down — serve defaults.
  }
  return fallback;
});

export const getProjects = cache(async () => {
  try {
    return await db.project.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    return SEED_PROJECTS.map((p, i) => ({
      id: `seed-${i}`,
      interiorImage: "",
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...p,
    }));
  }
});

export const getProject = cache(async (slug: string) => {
  try {
    return await db.project.findFirst({ where: { slug, published: true, deletedAt: null } });
  } catch {
    const p = SEED_PROJECTS.find((x) => x.slug === slug);
    return p ? { id: slug, interiorImage: "", published: true, createdAt: new Date(), updatedAt: new Date(), ...p } : null;
  }
});

export const getPosts = cache(async () => {
  try {
    return await db.post.findMany({ where: { published: true, deletedAt: null }, orderBy: { date: "desc" } });
  } catch {
    return [];
  }
});

export const getPost = cache(async (slug: string) => {
  try {
    return await db.post.findFirst({ where: { slug, published: true, deletedAt: null } });
  } catch {
    return null;
  }
});

export const getGalleryItems = cache(async () => {
  try {
    return await db.galleryItem.findMany({ where: { published: true, deletedAt: null }, orderBy: { sort: "asc" } });
  } catch {
    return SEED_GALLERY.map((g, i) => ({ id: `seed-${i}`, youtubeId: "", tall: false, published: true, ...g }));
  }
});
