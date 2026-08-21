"use server";

import { unlink } from "fs/promises";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { resolveStoredUpload } from "@/lib/uploads";

export type TrashState = { ok?: boolean; error?: string };

/** Content types that support Trash (soft-delete + restore + permanent delete). */
export type TrashModel = "page" | "post" | "project" | "galleryItem" | "media" | "contactMessage";

const LABEL: Record<TrashModel, string> = {
  page: "Page",
  post: "Post",
  project: "Project",
  galleryItem: "Gallery item",
  media: "File",
  contactMessage: "Message",
};

/** All six trashable delegates share this shape for the fields we touch. */
type SoftDeleteDelegate = {
  update: (args: { where: { id: string }; data: { deletedAt: Date | null } }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

function delegate(model: TrashModel): SoftDeleteDelegate {
  const map = {
    page: db.page,
    post: db.post,
    project: db.project,
    galleryItem: db.galleryItem,
    media: db.media,
    contactMessage: db.contactMessage,
  } as const;
  return map[model] as unknown as SoftDeleteDelegate;
}

/** Move an item to Trash (reversible). Never touches files on disk. */
export async function trashItem(model: TrashModel, id: string): Promise<TrashState> {
  await requireAdmin();
  try {
    await delegate(model).update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("trashItem", model, e);
    return { error: `Could not move the ${LABEL[model].toLowerCase()} to Trash.` };
  }
}

/** Restore an item from Trash. */
export async function restoreItem(model: TrashModel, id: string): Promise<TrashState> {
  await requireAdmin();
  try {
    await delegate(model).update({ where: { id }, data: { deletedAt: null } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("restoreItem", model, e);
    return { error: `Could not restore the ${LABEL[model].toLowerCase()}.` };
  }
}

/** Permanently delete an item from Trash. Only here does a Media file leave disk. */
export async function purgeItem(model: TrashModel, id: string): Promise<TrashState> {
  await requireAdmin();
  try {
    if (model === "media") {
      const row = await db.media.findUnique({ where: { id } });
      await db.media.delete({ where: { id } });
      const abs = row && resolveStoredUpload(row.path);
      if (abs) await unlink(abs).catch(() => {});
    } else {
      await delegate(model).delete({ where: { id } });
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("purgeItem", model, e);
    return { error: `Could not permanently delete the ${LABEL[model].toLowerCase()}.` };
  }
}
