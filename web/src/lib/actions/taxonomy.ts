"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getBlock } from "@/lib/content";

export type TaxonomyState = { ok?: boolean; error?: string };

async function writeCategories(postCategories: string[]): Promise<void> {
  // Merge over the current row — this block also holds projectCategories/
  // galleryCategories, and a bare { postCategories } write would silently
  // wipe them back to the hardcoded defaults on every post-category edit.
  const existing = await getBlock("taxonomies");
  const data = { ...existing, postCategories } as unknown as Prisma.InputJsonValue;
  await db.block.upsert({ where: { key: "taxonomies" }, update: { data }, create: { key: "taxonomies", data } });
  revalidatePath("/", "layout");
}

const clean = (name: unknown) => String(name ?? "").trim();

export async function addCategory(name: unknown): Promise<TaxonomyState> {
  await requireAdmin();
  const n = clean(name);
  if (!n || n.length > 60) return { error: "Category names are 1–60 characters." };
  try {
    const { postCategories } = await getBlock("taxonomies");
    if (postCategories.some((c) => c.toLowerCase() === n.toLowerCase())) {
      return { error: `"${n}" already exists.` };
    }
    await writeCategories([...postCategories, n]);
    return { ok: true };
  } catch (e) {
    console.error("addCategory", e);
    return { error: "Could not add the category." };
  }
}

export async function renameCategory(oldName: unknown, newName: unknown): Promise<TaxonomyState> {
  await requireAdmin();
  const from = clean(oldName);
  const to = clean(newName);
  if (!to || to.length > 60) return { error: "Category names are 1–60 characters." };
  try {
    const { postCategories } = await getBlock("taxonomies");
    if (!postCategories.includes(from)) return { error: `"${from}" no longer exists.` };
    if (postCategories.some((c) => c !== from && c.toLowerCase() === to.toLowerCase())) {
      return { error: `"${to}" already exists.` };
    }
    await db.post.updateMany({ where: { category: from }, data: { category: to } });
    await writeCategories(postCategories.map((c) => (c === from ? to : c)));
    return { ok: true };
  } catch (e) {
    console.error("renameCategory", e);
    return { error: "Could not rename the category." };
  }
}

export async function deleteCategory(name: unknown): Promise<TaxonomyState> {
  await requireAdmin();
  const n = clean(name);
  try {
    const { postCategories } = await getBlock("taxonomies");
    await writeCategories(postCategories.filter((c) => c !== n));
    return { ok: true };
  } catch (e) {
    console.error("deleteCategory", e);
    return { error: "Could not delete the category." };
  }
}
