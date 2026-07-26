"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { HOME_SECTION_IDS } from "@/lib/homeSections";

export type SaveState = { ok?: boolean; error?: string; savedAt?: number };

const layoutSchema = z.object({
  sections: z
    .array(z.object({ id: z.enum(HOME_SECTION_IDS as [string, ...string[]]), enabled: z.boolean() }))
    .min(1)
    .max(HOME_SECTION_IDS.length),
});

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const appearanceSchema = z.object({
  accent: z.string().trim().regex(HEX, "Enter a hex colour like #a87f3f"),
});

/** Save the brand accent colour (the `appearance` block). */
export async function saveAppearance(data: unknown): Promise<SaveState> {
  await requireOwner();
  const parsed = appearanceSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid colour." };
  try {
    const clean = { accent: parsed.data.accent } as unknown as Prisma.InputJsonValue;
    await db.block.upsert({
      where: { key: "appearance" },
      update: { data: clean },
      create: { key: "appearance", data: clean },
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    console.error("saveAppearance failed", e);
    return { error: "Could not save — check the database is running and try again." };
  }
}

/** Save the homepage section order + visibility (the `home.layout` block). */
export async function saveHomeLayout(data: unknown): Promise<SaveState> {
  await requireOwner();
  const parsed = layoutSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid layout data." };

  // De-dupe and drop unknown ids defensively; keep the admin-chosen order.
  const seen = new Set<string>();
  const sections = parsed.data.sections.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));

  try {
    const clean = { sections } as unknown as Prisma.InputJsonValue;
    await db.block.upsert({
      where: { key: "home.layout" },
      update: { data: clean },
      create: { key: "home.layout", data: clean },
    });
    revalidatePath("/", "layout");
    return { ok: true, savedAt: Date.now() };
  } catch (e) {
    console.error("saveHomeLayout failed", e);
    return { error: "Could not save — check the database is running and try again." };
  }
}
