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
  it("emits typography (inherited) declarations", () => {
    const css = styleToCss(
      { fontSize: 20, fontWeight: 600, lineHeight: 1.5, letterSpacing: 1, textTransform: "uppercase" },
      {},
      "base",
    );
    expect(css).toContain("font-size:20px;");
    expect(css).toContain("font-weight:600;");
    expect(css).toContain("line-height:1.5;");
    expect(css).toContain("letter-spacing:1px;");
    expect(css).toContain("text-transform:uppercase;");
  });
  it("resolves typography per breakpoint", () => {
    expect(styleToCss({ fontSize: { base: 20, mobile: 14 } }, {}, "mobile")).toBe("font-size:14px;");
  });
  it("emits width", () => {
    expect(styleToCss({ width: 300 }, {}, "base")).toContain("width:300px;");
  });
  it("emits a border, defaulting style to solid", () => {
    const css = styleToCss({ borderWidth: 2, borderColor: "#a87f3f" }, {}, "base");
    expect(css).toContain("border-width:2px;");
    expect(css).toContain("border-style:solid;");
    expect(css).toContain("border-color:#a87f3f;");
  });
  it("honors an explicit border style", () => {
    expect(styleToCss({ borderWidth: 1, borderStyle: "dashed" }, {}, "base")).toContain("border-style:dashed;");
  });
  it("maps a box-shadow preset to a shadow string", () => {
    expect(styleToCss({ boxShadow: "medium" }, {}, "base")).toContain("box-shadow:0 4px 12px");
  });
  it("emits no shadow for the 'none' preset", () => {
    expect(styleToCss({ boxShadow: "none" }, {}, "base")).not.toContain("box-shadow");
  });
  it("emits position from advanced", () => {
    expect(styleToCss({}, { position: "relative" }, "base")).toContain("position:relative;");
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
  it("only substitutes the whole-word `selector` token", () => {
    const css = nodeCss(base({ advanced: { customCss: ".selectorish { color: red; }" } }));
    expect(css).toContain(".selectorish { color: red; }");
    expect(css).not.toContain(".n-abcish");
  });
  it("neutralizes a `</style>` breakout in custom CSS", () => {
    const css = nodeCss(base({ advanced: { customCss: "selector { x: 1 } </style><script>alert(1)</script>" } }));
    expect(css).not.toContain("</style>");
    expect(css).toContain(".n-abc { x: 1 }");
  });
  it("neutralizes `</style>` in any emitted value, not just custom CSS", () => {
    const css = nodeCss(base({ style: { color: "red}</style><script>x</script>" } }));
    expect(css).not.toContain("</style>");
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
  it("false for inheritable typography (font-size)", () => {
    expect(needsBox(n({ style: { fontSize: 20 } }))).toBe(false);
  });
  it("true for border / width / shadow", () => {
    expect(needsBox(n({ style: { borderWidth: 2 } }))).toBe(true);
    expect(needsBox(n({ style: { width: 300 } }))).toBe(true);
    expect(needsBox(n({ style: { boxShadow: "soft" } }))).toBe(true);
  });
  it("false for boxShadow 'none' (emits no CSS, must not force an empty box)", () => {
    expect(needsBox(n({ style: { boxShadow: "none" } }))).toBe(false);
  });
  it("ignores empty responsive/box shells", () => {
    expect(needsBox(n({ advanced: { padding: { unit: "px" } } }))).toBe(false);
    expect(needsBox(n({ style: { maxWidth: {} } }))).toBe(false);
  });
  it("true when customCss is set", () => {
    expect(needsBox(n({ advanced: { customCss: "selector{width:300px}" } }))).toBe(true);
  });

  describe("needsBox covers every box-generating engine key", () => {
    // Keys styleToCss renders as box-generating. If you add a box render branch to
    // css.ts, add its key here AND to needsBox's STYLE_BOX_KEYS/ADV_BOX_KEYS.
    const styleBoxKeys = ["backgroundColor", "minHeight", "maxWidth", "borderRadius", "width", "borderWidth", "borderStyle", "borderColor"];
    const advBoxKeys = ["padding", "margin", "zIndex", "position"];
    for (const k of styleBoxKeys) {
      it(`style.${k} forces a box`, () => {
        expect(needsBox(n({ style: { [k]: k === "backgroundColor" ? "#000" : 10 } }))).toBe(true);
      });
    }
    for (const k of advBoxKeys) {
      it(`advanced.${k} forces a box`, () => {
        const val = k === "padding" || k === "margin" ? { top: 10 } : 5;
        expect(needsBox(n({ advanced: { [k]: val } }))).toBe(true);
      });
    }
  });
});
