import type { FieldSpec } from "@/lib/pageRegistry";
import { sanitizeSeo } from "@/lib/seoScore";

/** Shared server-side validator for spec-driven JSON (blocks, plugin settings,
 *  page-builder block props). Coerces types, drops unknown keys, falls back to
 *  the provided defaults for missing values. */

export const MAX_TEXT = 600;
export const MAX_TEXTAREA = 8000;
export const MAX_LIST = 48;

export class ValidationError extends Error {}

export function validateFields(fields: FieldSpec[], input: unknown, defaults: unknown): Record<string, unknown> {
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
      case "seo":
        out[f.key] = sanitizeSeo(raw);
        break;
      case "select": {
        const allowed = f.options.map((o) => o.value);
        const raw2 = typeof raw === "string" ? raw : undefined;
        const dft2 = typeof dRaw === "string" ? dRaw : undefined;
        out[f.key] = raw2 && allowed.includes(raw2) ? raw2
          : dft2 && allowed.includes(dft2) ? dft2
          : allowed[0] ?? "";
        break;
      }
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
