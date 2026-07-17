"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getPlugin } from "@/plugins/registry";
import { getBlock } from "@/lib/content";
import { validateFields, ValidationError } from "@/lib/validateFields";

export type PluginActionState = { ok?: boolean; error?: string };

type PluginState = { id: string; active: boolean; settings: Record<string, unknown> };

async function writeStates(states: PluginState[]) {
  const data = { states } as unknown as Prisma.InputJsonValue;
  await db.block.upsert({ where: { key: "plugins" }, update: { data }, create: { key: "plugins", data } });
  revalidatePath("/", "layout");
}

export async function setPluginActive(id: string, active: boolean): Promise<PluginActionState> {
  await requireAdmin();
  const plugin = getPlugin(id);
  if (!plugin) return { error: `Unknown plugin "${id}".` };
  try {
    const { states } = await getBlock("plugins");
    const rest = states.filter((s) => s.id !== id);
    const existing = states.find((s) => s.id === id);
    await writeStates([
      ...rest,
      { id, active, settings: existing?.settings ?? { ...plugin.defaultSettings } },
    ]);
    return { ok: true };
  } catch (e) {
    console.error("setPluginActive", e);
    return { error: "Could not update the plugin." };
  }
}

export async function savePluginSettings(id: string, input: unknown): Promise<PluginActionState> {
  await requireAdmin();
  const plugin = getPlugin(id);
  if (!plugin) return { error: `Unknown plugin "${id}".` };
  try {
    const settings = validateFields(plugin.settingsFields, input, plugin.defaultSettings);
    const { states } = await getBlock("plugins");
    const rest = states.filter((s) => s.id !== id);
    const existing = states.find((s) => s.id === id);
    await writeStates([...rest, { id, active: existing?.active ?? false, settings }]);
    return { ok: true };
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message };
    console.error("savePluginSettings", e);
    return { error: "Could not save the plugin settings." };
  }
}
