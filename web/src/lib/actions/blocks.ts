"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { specFor } from "@/lib/pageRegistry";
import { validateFields, ValidationError } from "@/lib/validateFields";
import { BLOCK_DEFAULTS, type BlockKey } from "@/content/defaults";

export type SaveState = { ok?: boolean; error?: string; savedAt?: number };

export async function saveBlock(key: string, data: unknown): Promise<SaveState> {
  await requireAdmin();
  const spec = specFor(key);
  if (!spec) return { error: `Unknown block "${key}".` };

  try {
    const clean = validateFields(spec.fields, data, BLOCK_DEFAULTS[key as BlockKey]) as Prisma.InputJsonValue;
    await db.block.upsert({
      where: { key },
      update: { data: clean },
      create: { key, data: clean },
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    console.error("saveBlock failed", key, e);
    return { error: "Could not save — check the database is running and try again." };
  }
}
