"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type ActionState = { ok?: boolean; error?: string; savedAt?: number };

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, and hyphens only").max(80);
const imagePath = z.string().trim().max(500).refine((v) => v === "" || v.startsWith("/") || v.startsWith("http"), "Image must be a /path or URL");

/* ------------------------------ Projects ------------------------------ */

const projectSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(1200),
  category: z.enum(["residential", "commercial", "institutional", "masterplan"]),
  sector: z.string().trim().min(1).max(80),
  location: z.string().trim().max(120).default(""),
  year: z.string().trim().min(2).max(12),
  services: z.array(z.string().trim().min(1).max(60)).max(8),
  heroImage: imagePath.refine((v) => v !== "", "Hero image is required"),
  interiorImage: imagePath.default(""),
  published: z.boolean().default(true),
  sort: z.number().int().min(-1000).max(1000).default(0),
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
      await db.project.update({ where: { id }, data: parsed.data });
    } else {
      await db.project.create({ data: parsed.data });
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
});

export async function savePost(id: string | null, data: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) return { error: fieldErrors(parsed.error) };
  try {
    const clash = await db.post.findUnique({ where: { slug: parsed.data.slug } });
    if (clash && clash.id !== id) return { error: `Slug "${parsed.data.slug}" is already used by "${clash.title}".` };
    if (id) {
      await db.post.update({ where: { id }, data: parsed.data });
    } else {
      await db.post.create({ data: parsed.data });
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

/* ------------------------------- Gallery ------------------------------ */

const gallerySchema = z.object({
  title: z.string().trim().min(1).max(160),
  sector: z.string().trim().min(1).max(120),
  image: imagePath.refine((v) => v !== "", "Image is required"),
  category: z.enum(["architecture", "residential", "commercial"]),
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
      await db.galleryItem.update({ where: { id }, data: parsed.data });
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
