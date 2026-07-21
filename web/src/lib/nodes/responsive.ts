import type { Responsive, Breakpoint } from "./types";

/** Value-level helpers for per-breakpoint slots on style/advanced keys.
 *  Contrast resolveResponsive (css.ts), which reads ONE slot for media-query
 *  emission; resolveAt CASCADES (mobile ?? tablet ?? base) for display/edit. */

type Slots = { base?: unknown; tablet?: unknown; mobile?: unknown };

function isSlots(v: unknown): v is Slots {
  return (
    typeof v === "object" && v !== null && !Array.isArray(v) &&
    ("base" in v || "tablet" in v || "mobile" in v)
  );
}

export function resolveAt<T>(v: Responsive<T> | undefined, bp: Breakpoint): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (isSlots(v)) {
    const s = v as { base?: T; tablet?: T; mobile?: T };
    if (bp === "mobile") return s.mobile ?? s.tablet ?? s.base;
    if (bp === "tablet") return s.tablet ?? s.base;
    return s.base;
  }
  return v as T; // a scalar applies from base and cascades everywhere
}

export function writeSlot(cur: unknown, bp: Breakpoint, value: unknown): unknown {
  if (bp === "base") {
    if (isSlots(cur)) return { ...cur, base: value };
    return value;
  }
  if (isSlots(cur)) return { ...cur, [bp]: value };
  const empty = cur === undefined || cur === null || cur === "";
  return empty ? { [bp]: value } : { base: cur, [bp]: value };
}

export function clearSlot(cur: unknown, bp: Breakpoint): unknown {
  if (!isSlots(cur)) return bp === "base" ? undefined : cur;
  const next: Slots = { ...cur };
  delete next[bp];
  const set = (["base", "tablet", "mobile"] as const).filter((k) => next[k] !== undefined);
  if (set.length === 0) return undefined;
  if (set.length === 1 && set[0] === "base") return next.base;
  return next;
}

export function hasSlot(cur: unknown, bp: Breakpoint): boolean {
  if (isSlots(cur)) return (cur as Slots)[bp] !== undefined;
  return bp === "base" && cur !== undefined && cur !== null && cur !== "";
}
