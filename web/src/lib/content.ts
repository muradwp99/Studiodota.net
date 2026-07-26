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

/**
 * Admin-only: the merged live value plus the raw draft/snapshot metadata, for
 * the Save Draft / Publish / Revert UI in BlockEditor. Bypasses the public
 * cache since admin pages always want the freshest state.
 */
export async function getBlockAdmin<K extends BlockKey>(key: K) {
  const data = await getBlock(key);
  try {
    const row = await db.block.findUnique({ where: { key }, select: { draft: true, snapshotAt: true, updatedAt: true } });
    const fallback = structuredClone(BLOCK_DEFAULTS[key]) as unknown as BlockData[K];
    const draft =
      row?.draft && typeof row.draft === "object" && !Array.isArray(row.draft)
        ? ({ ...fallback, ...(row.draft as object) } as BlockData[K])
        : null;
    return {
      data,
      draft,
      snapshotAt: row?.snapshotAt ? row.snapshotAt.toISOString() : null,
      updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    };
  } catch {
    return { data, draft: null, snapshotAt: null, updatedAt: null };
  }
}

export const getProjects = cache(async () => {
  try {
    return await db.project.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    return SEED_PROJECTS.filter((p) => p.published).map((p, i) => ({
      id: `seed-${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      seo: {},
      ...p,
    }));
  }
});

export const getProject = cache(async (slug: string) => {
  try {
    return await db.project.findFirst({ where: { slug, published: true, deletedAt: null } });
  } catch {
    const p = SEED_PROJECTS.find((x) => x.slug === slug && x.published);
    return p ? { id: slug, createdAt: new Date(), updatedAt: new Date(), seo: {}, ...p } : null;
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
