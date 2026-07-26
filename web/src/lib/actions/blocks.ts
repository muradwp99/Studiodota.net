"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { specFor } from "@/lib/pageRegistry";
import { validateFields, ValidationError } from "@/lib/validateFields";
import { BLOCK_DEFAULTS, type BlockKey } from "@/content/defaults";

export type SaveState = {
  ok?: boolean;
  error?: string;
  savedAt?: number;
  /** Echoed back on success so the editor can update its local state without a refetch. */
  data?: unknown;
  draft?: unknown;
  snapshotAt?: string | null;
};

// "home.*" / "page.*" blocks are page content, edited under Pages — shared, both
// admin and editor roles use it. Every other block key is a Settings/Appearance
// surface (owner-only).
const isPageContentBlock = (key: string) => key.startsWith("home.") || key.startsWith("page.");
const requireBlockAccess = (key: string) => (isPageContentBlock(key) ? requireAdmin() : requireOwner());

function validateBlock(key: string, input: unknown): Prisma.InputJsonValue {
  const spec = specFor(key);
  if (!spec) throw new ValidationError(`Unknown block "${key}".`);
  return validateFields(spec.fields, input, BLOCK_DEFAULTS[key as BlockKey]) as Prisma.InputJsonValue;
}

/** Save to `draft` only — the live `data` (and the public site) is untouched. */
export async function saveBlockDraft(key: string, data: unknown): Promise<SaveState> {
  await requireBlockAccess(key);
  try {
    const draft = validateBlock(key, data);
    await db.block.upsert({
      where: { key },
      update: { draft },
      create: { key, data: structuredClone(BLOCK_DEFAULTS[key as BlockKey]) as Prisma.InputJsonValue, draft },
    });
    return { ok: true, savedAt: Date.now(), draft };
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    console.error("saveBlockDraft failed", key, e);
    return { error: "Could not save the draft — check the database is running and try again." };
  }
}

/**
 * Publish `data` (or, if omitted, the current draft) as the new live value.
 * Stashes the current live value into `snapshot` first (single-level undo,
 * not a list) and clears `draft` either way.
 */
export async function publishBlock(key: string, data?: unknown): Promise<SaveState> {
  await requireBlockAccess(key);
  try {
    const row = await db.block.findUnique({ where: { key } });
    const source = data !== undefined ? data : row?.draft;
    if (source == null) return { error: "No draft to publish." };

    const live = validateBlock(key, source);
    const snapshot = (row?.data ?? structuredClone(BLOCK_DEFAULTS[key as BlockKey])) as Prisma.InputJsonValue;
    const snapshotAt = new Date();

    await db.block.upsert({
      where: { key },
      update: { data: live, draft: Prisma.DbNull, snapshot, snapshotAt },
      create: { key, data: live },
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now(), data: live, draft: null, snapshotAt: snapshotAt.toISOString() };
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    console.error("publishBlock failed", key, e);
    return { error: "Could not publish — check the database is running and try again." };
  }
}

/** Single-level undo: copies `snapshot` back into `data` and clears it. */
export async function revertBlock(key: string): Promise<SaveState> {
  await requireBlockAccess(key);
  try {
    const row = await db.block.findUnique({ where: { key } });
    const snapshot = row?.snapshot;
    if (snapshot == null) return { error: "No previous version to revert to." };

    await db.block.update({
      where: { key },
      data: { data: snapshot as Prisma.InputJsonValue, snapshot: Prisma.DbNull, snapshotAt: null },
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now(), data: snapshot, snapshotAt: null };
  } catch (e) {
    console.error("revertBlock failed", key, e);
    return { error: "Could not revert — check the database is running and try again." };
  }
}

/** Clears `draft` without touching the live `data`. */
export async function discardDraft(key: string): Promise<SaveState> {
  await requireBlockAccess(key);
  try {
    await db.block.update({ where: { key }, data: { draft: Prisma.DbNull } });
    return { ok: true, savedAt: Date.now(), draft: null };
  } catch (e) {
    console.error("discardDraft failed", key, e);
    return { error: "Could not discard the draft." };
  }
}
