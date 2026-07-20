import { describe, it, expect } from "vitest";
import { resolveResponsive, styleToCss, nodeCss, wrapperAttrs, needsBox } from "./css";
import type { Node } from "./types";

describe("resolveResponsive", () => {
  it("applies a scalar only at base", () => {
    expect(resolveResponsive(10, "base")).toBe(10);
    expect(resolveResponsive(10, "tablet")).toBeUndefined();
    expect(resolveResponsive(10, "mobile")).toBeUndefined();
  });
  it("reads per-breakpoint from an object (no cascade)", () => {
    const v = { base: 10, mobile: 4 };
    expect(resolveResponsive(v, "base")).toBe(10);
    expect(resolveResponsive(v, "tablet")).toBeUndefined();
    expect(resolveResponsive(v, "mobile")).toBe(4);
  });
  it("reads the tablet value from an object form", () => {
    expect(resolveResponsive({ base: 1, tablet: 2, mobile: 3 }, "tablet")).toBe(2);
  });
});

describe("styleToCss", () => {
  it("emits base declarations", () => {
    const css = styleToCss({ backgroundColor: "#a87f3f", color: "#fff" }, {}, "base");
    expect(css).toContain("background-color:#a87f3f;");
    expect(css).toContain("color:#fff;");
  });
  it("emits a 4-side padding box with units", () => {
    const css = styleToCss({}, { padding: { top: 10, right: 20, bottom: 10, left: 20, unit: "px" } }, "base");
    expect(css).toContain("padding:10px 20px 10px 20px;");
  });
  it("emits only mobile overrides at the mobile breakpoint", () => {
    const css = styleToCss({ maxWidth: { base: 1200, mobile: 320 } }, {}, "mobile");
    expect(css).toBe("max-width:320px;");
  });
});

describe("nodeCss", () => {
  const base = (over: Partial<Node>): Node => ({ id: "abc", type: "heading", props: {}, ...over });

  it("returns empty string for a bare node", () => {
    expect(nodeCss(base({}))).toBe("");
  });
  it("scopes rules to .n-{id} and wraps responsive values in media queries", () => {
    const css = nodeCss(base({ style: { maxWidth: { base: 1200, mobile: 320 } } }));
    expect(css).toContain(".n-abc{max-width:1200px;}");
    expect(css).toContain("@media (max-width:767px){.n-abc{max-width:320px;}}");
  });
  it("wraps tablet overrides in a max-width:1024px media query", () => {
    const css = nodeCss(base({ style: { maxWidth: { base: 1200, tablet: 900 } } }));
    expect(css).toContain(".n-abc{max-width:1200px;}");
    expect(css).toContain("@media (max-width:1024px){.n-abc{max-width:900px;}}");
  });
  it("emits a :hover rule and a transition on the base rule", () => {
    const css = nodeCss(base({ style: { color: "#111", hover: { color: "#a87f3f" } } }));
    expect(css).toContain(".n-abc:hover{color:#a87f3f;}");
    expect(css).toContain("transition:all 0.3s ease;");
  });
  it("emits responsive-hide rules", () => {
    const css = nodeCss(base({ advanced: { hideMobile: true } }));
    expect(css).toContain("@media (max-width:767px){.n-abc{display:none!important;}}");
  });
  it("emits a hide-desktop rule", () => {
    const css = nodeCss(base({ advanced: { hideDesktop: true } }));
    expect(css).toContain("@media (min-width:1025px){.n-abc{display:none!important;}}");
  });
  it("emits a hide-tablet rule", () => {
    const css = nodeCss(base({ advanced: { hideTablet: true } }));
    expect(css).toContain("@media (min-width:768px) and (max-width:1024px){.n-abc{display:none!important;}}");
  });
  it("substitutes `selector` in custom CSS", () => {
    const css = nodeCss(base({ advanced: { customCss: "selector { opacity: 0.5; }" } }));
    expect(css).toContain(".n-abc { opacity: 0.5; }");
  });
});

describe("wrapperAttrs", () => {
  it("always includes the scoped class", () => {
    expect(wrapperAttrs({ id: "abc", type: "x", props: {} })).toEqual({ className: "n-abc", id: undefined });
  });
  it("appends cssClasses and sets cssId", () => {
    const attrs = wrapperAttrs({ id: "abc", type: "x", props: {}, advanced: { cssClasses: "fancy big", cssId: "hero" } });
    expect(attrs.className).toBe("n-abc fancy big");
    expect(attrs.id).toBe("hero");
  });
});

describe("needsBox", () => {
  const n = (over: Partial<Node>): Node => ({ id: "x", type: "text", props: {}, ...over });
  it("false for a bare node", () => { expect(needsBox(n({}))).toBe(false); });
  it("false for inheritable-only style (color / textAlign)", () => {
    expect(needsBox(n({ style: { color: "#111", textAlign: "center" } }))).toBe(false);
  });
  it("false for cssClasses/cssId only", () => {
    expect(needsBox(n({ advanced: { cssClasses: "fancy", cssId: "hero" } }))).toBe(false);
  });
  it("true when it has children", () => {
    expect(needsBox(n({ children: [{ id: "c", type: "text", props: {} }] }))).toBe(true);
  });
  it("true for box style props", () => {
    expect(needsBox(n({ style: { backgroundColor: "#000" } }))).toBe(true);
    expect(needsBox(n({ style: { maxWidth: 800 } }))).toBe(true);
    expect(needsBox(n({ style: { borderRadius: 12 } }))).toBe(true);
  });
  it("true for padding/margin/zIndex", () => {
    expect(needsBox(n({ advanced: { padding: { top: 10 } } }))).toBe(true);
    expect(needsBox(n({ advanced: { zIndex: 3 } }))).toBe(true);
  });
  it("true when a hover state is set", () => {
    expect(needsBox(n({ style: { hover: { backgroundColor: "#111" } } }))).toBe(true);
  });
  it("ignores empty responsive/box shells", () => {
    expect(needsBox(n({ advanced: { padding: { unit: "px" } } }))).toBe(false);
    expect(needsBox(n({ style: { maxWidth: {} } }))).toBe(false);
  });
});
