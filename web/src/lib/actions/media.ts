"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";

export type MediaState = { ok?: boolean; error?: string; path?: string };

const MAX_BYTES = 10 * 1024 * 1024;

/** Sniff the real image type from magic bytes — extensions lie. */
function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (buf.length > 12 && buf.subarray(4, 12).toString("ascii").startsWith("ftypavif")) return { mime: "image/avif", ext: "avif" };
  if (buf.length > 6 && ["GIF87a", "GIF89a"].includes(buf.subarray(0, 6).toString("ascii"))) return { mime: "image/gif", ext: "gif" };
  return null;
}

export async function uploadMedia(formData: FormData): Promise<MediaState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > MAX_BYTES) return { error: "File is over the 10 MB limit." };

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return { error: "Only JPEG, PNG, WebP, AVIF, or GIF images are allowed." };

  const base = (file.name || "upload")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "upload";
  const month = new Date().toISOString().slice(0, 7);
  const name = `${base}-${randomBytes(4).toString("hex")}.${kind.ext}`;
  const rel = `/uploads/${month}/${name}`;
  // UPLOAD_DIR, not public/uploads: on a host that deploys each build to a new
  // directory, writing inside the build tree loses the file on next deploy.
  const abs = path.join(UPLOAD_DIR, month, name);

  try {
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, buf);
    await db.media.create({
      data: { path: rel, alt: base.replace(/-/g, " "), mime: kind.mime, size: buf.length },
    });
    revalidatePath("/admin/media");
    return { ok: true, path: rel };
  } catch (e) {
    console.error("uploadMedia", e);
    return { error: "Upload failed — could not write the file." };
  }
}

export async function listMedia() {
  await requireAdmin();
  return db.media.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 300 });
}

export async function updateMediaAlt(id: string, alt: string): Promise<MediaState> {
  await requireAdmin();
  try {
    await db.media.update({ where: { id }, data: { alt: alt.trim().slice(0, 300) } });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { error: "Could not update the description." };
  }
}

export async function deleteMedia(id: string): Promise<MediaState> {
  await requireAdmin();
  try {
    const row = await db.media.findUnique({ where: { id } });
    if (!row) return { error: "Already gone." };
    // Move to Trash only — the file stays on disk until it's permanently
    // deleted from Trash, so a page still using it never breaks on a trash.
    await db.media.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { error: "Could not move the file to Trash." };
  }
}
