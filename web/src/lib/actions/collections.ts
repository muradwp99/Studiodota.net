"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sanitizeSeo } from "@/lib/seoScore";

export type ActionState = { ok?: boolean; error?: string; savedAt?: number; data?: Record<string, unknown> };

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, and hyphens only").max(80);
const imagePath = z.string().trim().max(500).refine((v) => v === "" || v.startsWith("/") || v.startsWith("http"), "Image must be a /path or URL");

/** Single-level undo: snapshot the whole row (minus id/snapshot fields) before an
 *  update overwrites it. Revert copies it straight back and clears it again. */
const SNAPSHOT_OMIT = new Set(["id", "snapshot", "snapshotAt"]);
const snapshotOf = (row: object): Prisma.InputJsonValue =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !SNAPSHOT_OMIT.has(k))) as Prisma.InputJsonValue;

/* ------------------------------ Projects ------------------------------ */

const projectSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(1200),
  // Free text so categories added later in Settings validate too — the seeded
  // values (single-family, multifamily, … plus legacy residential/institutional/
  // masterplan) all still pass unchanged.
  category: z.string().trim().min(1).max(60),
  sector: z.string().trim().min(1).max(80),
  location: z.string().trim().max(120).default(""),
  year: z.string().trim().max(12).default(""),
  services: z.array(z.string().trim().min(1).max(60)).max(8),
  heroImage: imagePath.refine((v) => v !== "", "Hero image is required"),
  interiorImage: imagePath.default(""),
  gallery: z.array(imagePath).max(24).default([]),
  published: z.boolean().default(true),
  sort: z.number().int().min(-1000).max(1000).default(0),
  seo: z.unknown().transform((v) => sanitizeSeo(v)),
});

function fieldErrors(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ");
}

export async function saveProject(id: string | null, data: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) return { error: fieldErrors(parsed.error) };
  try {
    const clash = await db.project.findUnique({ where: { slug: parsed.data.slug } });
    if (clash && clash.id !== id) return { error: `Slug "${parsed.data.slug}" is already used by "${clash.title}".` };
    if (id) {
      const current = await db.project.findUnique({ where: { id } });
      if (!current) return { error: "Project not found." };
      await db.project.update({
        where: { id },
        data: {
          ...parsed.data,
          seo: parsed.data.seo as Prisma.InputJsonValue,
          snapshot: snapshotOf(current),
          snapshotAt: new Date(),
        },
      });
    } else {
      await db.project.create({ data: { ...parsed.data, seo: parsed.data.seo as Prisma.InputJsonValue } });
    }
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    console.error("saveProject", e);
    return { error: "Could not save the project." };
  }
}

export async function deleteProject(id: string): Promise<void> {
  await requireAdmin();
  await db.project.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/", "layout");
  redirect("/admin/projects");
}

/** Rewrites `sort` to 0..n in the given order — powers the admin drag-reorder list. */
export async function reorderProjects(orderedIds: string[]): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.$transaction(orderedIds.map((id, i) => db.project.update({ where: { id }, data: { sort: i } })));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("reorderProjects", e);
    return { error: "Could not reorder the projects." };
  }
}

/** Single-level undo — copies the stashed snapshot back over the live row. */
export async function revertProject(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    const current = await db.project.findUnique({ where: { id } });
    if (!current || !current.snapshot || typeof current.snapshot !== "object") return { error: "No saved version to revert to." };
    const reverted = current.snapshot as Record<string, unknown>;
    await db.project.update({
      where: { id },
      data: { ...reverted, snapshot: Prisma.JsonNull, snapshotAt: null } as unknown as Prisma.ProjectUpdateInput,
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now(), data: reverted };
  } catch (e) {
    console.error("revertProject", e);
    return { error: "Could not revert the project." };
  }
}

/* -------------------------------- Posts ------------------------------- */

const postSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().min(1).max(600),
  category: z.string().trim().min(1).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  readingTime: z.number().int().min(1).max(90),
  image: imagePath.refine((v) => v !== "", "Cover image is required"),
  inlineImage: imagePath.default(""),
  authorName: z.string().trim().min(1).max(120),
  authorRole: z.string().trim().min(1).max(120),
  intro: z.string().trim().min(1).max(3000),
  sections: z
    .array(
      z.object({
        id: slug,
        heading: z.string().trim().min(1).max(240),
        body: z.array(z.string().trim().min(1).max(6000)).min(1).max(10),
      }),
    )
    .min(1)
    .max(14),
  published: z.boolean().default(true),
  seo: z.unknown().transform((v) => sanitizeSeo(v)),
});

export async function savePost(id: string | null, data: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) return { error: fieldErrors(parsed.error) };
  try {
    const clash = await db.post.findUnique({ where: { slug: parsed.data.slug } });
    if (clash && clash.id !== id) return { error: `Slug "${parsed.data.slug}" is already used by "${clash.title}".` };
    if (id) {
      const current = await db.post.findUnique({ where: { id } });
      if (!current) return { error: "Article not found." };
      await db.post.update({
        where: { id },
        data: {
          ...parsed.data,
          seo: parsed.data.seo as Prisma.InputJsonValue,
          snapshot: snapshotOf(current),
          snapshotAt: new Date(),
        },
      });
    } else {
      await db.post.create({ data: { ...parsed.data, seo: parsed.data.seo as Prisma.InputJsonValue } });
    }
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    console.error("savePost", e);
    return { error: "Could not save the article." };
  }
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await db.post.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/", "layout");
  redirect("/admin/posts");
}

/** Single-level undo — copies the stashed snapshot back over the live row. */
export async function revertPost(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    const current = await db.post.findUnique({ where: { id } });
    if (!current || !current.snapshot || typeof current.snapshot !== "object") return { error: "No saved version to revert to." };
    const reverted = current.snapshot as Record<string, unknown>;
    await db.post.update({
      where: { id },
      data: { ...reverted, snapshot: Prisma.JsonNull, snapshotAt: null } as unknown as Prisma.PostUpdateInput,
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now(), data: reverted };
  } catch (e) {
    console.error("revertPost", e);
    return { error: "Could not revert the article." };
  }
}

/* ------------------------------- Gallery ------------------------------ */

const gallerySchema = z.object({
  title: z.string().trim().min(1).max(160),
  sector: z.string().trim().min(1).max(120),
  image: imagePath.refine((v) => v !== "", "Image is required"),
  // Free text so categories added later in Settings validate too — the seeded
  // values (architecture, residential, commercial) still pass unchanged.
  category: z.string().trim().min(1).max(60),
  type: z.enum(["photo", "video"]),
  youtubeId: z.string().trim().regex(/^[\w-]{0,20}$/, "YouTube ID looks wrong").default(""),
  tall: z.boolean().default(false),
  published: z.boolean().default(true),
  sort: z.number().int().min(-1000).max(1000).default(0),
});

export async function saveGalleryItem(id: string | null, data: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = gallerySchema.safeParse(data);
  if (!parsed.success) return { error: fieldErrors(parsed.error) };
  try {
    if (id) {
      const current = await db.galleryItem.findUnique({ where: { id } });
      if (!current) return { error: "Gallery item not found." };
      await db.galleryItem.update({
        where: { id },
        data: { ...parsed.data, snapshot: snapshotOf(current), snapshotAt: new Date() },
      });
    } else {
      await db.galleryItem.create({ data: parsed.data });
    }
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    console.error("saveGalleryItem", e);
    return { error: "Could not save the gallery item." };
  }
}

export async function deleteGalleryItem(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.galleryItem.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { error: "Could not move the item to Trash." };
  }
}

/** Rewrites `sort` to 0..n in the given order — powers the admin drag-reorder list. */
export async function reorderGalleryItems(orderedIds: string[]): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.$transaction(orderedIds.map((id, i) => db.galleryItem.update({ where: { id }, data: { sort: i } })));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("reorderGalleryItems", e);
    return { error: "Could not reorder the gallery." };
  }
}

/** Single-level undo — copies the stashed snapshot back over the live row. */
export async function revertGalleryItem(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    const current = await db.galleryItem.findUnique({ where: { id } });
    if (!current || !current.snapshot || typeof current.snapshot !== "object") return { error: "No saved version to revert to." };
    const reverted = current.snapshot as Record<string, unknown>;
    await db.galleryItem.update({
      where: { id },
      data: { ...reverted, snapshot: Prisma.JsonNull, snapshotAt: null } as unknown as Prisma.GalleryItemUpdateInput,
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now(), data: reverted };
  } catch (e) {
    console.error("revertGalleryItem", e);
    return { error: "Could not revert the gallery item." };
  }
}

/* ------------------------------ Messages ------------------------------ */

export async function setMessageRead(id: string, read: boolean): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.contactMessage.update({ where: { id }, data: { read } });
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch {
    return { error: "Could not update the message." };
  }
}

export async function deleteMessage(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await db.contactMessage.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch {
    return { error: "Could not move the message to Trash." };
  }
}
