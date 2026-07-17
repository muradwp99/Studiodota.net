"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { specFor, type FieldSpec } from "@/lib/pageRegistry";
import { BLOCK_DEFAULTS, type BlockKey } from "@/content/defaults";

const MAX_TEXT = 600;
const MAX_TEXTAREA = 8000;
const MAX_LIST = 48;

class ValidationError extends Error {}

/** Coerce + validate incoming JSON against a field spec. Unknown keys are
 *  dropped; missing values fall back to the field's default. */
function validateFields(fields: FieldSpec[], input: unknown, defaults: unknown): Record<string, unknown> {
  const src = (input && typeof input === "object" && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const dft = (defaults && typeof defaults === "object" && !Array.isArray(defaults) ? defaults : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const f of fields) {
    const raw = src[f.key];
    const dRaw = dft[f.key];
    switch (f.kind) {
      case "text":
      case "image": {
        const v = typeof raw === "string" ? raw.trim() : String(dRaw ?? "");
        if (v.length > MAX_TEXT) throw new ValidationError(`"${f.label}" is too long (max ${MAX_TEXT} characters).`);
        if (f.kind === "image" && v && !v.startsWith("/") && !v.startsWith("http")) {
          throw new ValidationError(`"${f.label}" must be a path like /media/… or a full URL.`);
        }
        out[f.key] = v;
        break;
      }
      case "textarea": {
        const v = typeof raw === "string" ? raw.trim() : String(dRaw ?? "");
        if (v.length > MAX_TEXTAREA) throw new ValidationError(`"${f.label}" is too long (max ${MAX_TEXTAREA} characters).`);
        out[f.key] = v;
        break;
      }
      case "number": {
        const n = typeof raw === "number" ? raw : Number(raw);
        out[f.key] = Number.isFinite(n) ? n : Number(dRaw ?? 0);
        break;
      }
      case "toggle":
        out[f.key] = typeof raw === "boolean" ? raw : Boolean(dRaw);
        break;
      case "stringList": {
        const arr = Array.isArray(raw) ? raw : Array.isArray(dRaw) ? dRaw : [];
        out[f.key] = arr
          .slice(0, MAX_LIST)
          .map((x) => String(x).trim())
          .filter((x) => x.length > 0 && x.length <= MAX_TEXT);
        break;
      }
      case "group": {
        out[f.key] = validateFields(f.fields, raw, dRaw);
        break;
      }
      case "list": {
        const arr = Array.isArray(raw) ? raw : Array.isArray(dRaw) ? dRaw : [];
        if (arr.length > MAX_LIST) throw new ValidationError(`"${f.label}" has too many items (max ${MAX_LIST}).`);
        const dItem = Array.isArray(dRaw) && dRaw.length > 0 ? dRaw[0] : {};
        out[f.key] = arr.map((item) => validateFields(f.item, item, dItem));
        break;
      }
    }
  }
  return out;
}

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
