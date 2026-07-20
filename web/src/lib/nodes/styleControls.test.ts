import { describe, it, expect } from "vitest";
import { STYLE_CONTROLS, ADVANCED_CONTROLS, type StyleControl } from "./styleControls";

// Keys the A1 CSS engine (css.ts) actually renders. Keep in sync with styleToCss/wrapperAttrs.
const STYLE_KEYS = new Set(["backgroundColor", "color", "textAlign", "minHeight", "maxWidth", "borderRadius"]);
const ADV_KEYS = new Set(["padding", "margin", "zIndex", "cssClasses", "cssId"]);

const flatKeys = (cs: StyleControl[]): string[] =>
  cs.flatMap((c) => (c.kind === "group" ? flatKeys(c.controls) : [c.key]));

describe("style control definitions", () => {
  it("every Style control key is handled by the CSS engine", () => {
    for (const k of flatKeys(STYLE_CONTROLS)) expect(STYLE_KEYS.has(k)).toBe(true);
  });
  it("every Advanced control key is handled by the engine or wrapperAttrs", () => {
    for (const k of flatKeys(ADVANCED_CONTROLS)) expect(ADV_KEYS.has(k)).toBe(true);
  });
  it("no duplicate keys within a tab", () => {
    const s = flatKeys(STYLE_CONTROLS); expect(new Set(s).size).toBe(s.length);
    const a = flatKeys(ADVANCED_CONTROLS); expect(new Set(a).size).toBe(a.length);
  });
});
