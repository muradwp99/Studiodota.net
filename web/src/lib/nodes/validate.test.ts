import { describe, it, expect } from "vitest";
import { validateTree, type RawNode } from "./validate";
import { ValidationError } from "@/lib/validateFields";

const heading = (over: Partial<RawNode> = {}): RawNode => ({
  id: "h1",
  type: "heading",
  props: { text: "Hello", level: 2, align: "left" },
  ...over,
});

describe("validateTree", () => {
  it("validates props and preserves style/advanced", () => {
    const [out] = validateTree([heading({ style: { color: "#111" }, advanced: { zIndex: 3 } })]);
    expect(out.type).toBe("heading");
    expect(out.props.text).toBe("Hello");
    expect(out.style).toEqual({ color: "#111" });
    expect(out.advanced).toEqual({ zIndex: 3 });
  });

  it("recurses children", () => {
    const [out] = validateTree([heading({ children: [heading({ id: "h2" })] })]);
    expect(out.children).toHaveLength(1);
    expect(out.children?.[0].id).toBe("h2");
  });

  it("throws on an unknown block type", () => {
    expect(() => validateTree([{ id: "x", type: "no-such", props: {} }])).toThrow(ValidationError);
  });

  it("throws when nested too deep (> 6)", () => {
    let node: RawNode = heading();
    for (let i = 0; i < 6; i += 1) node = heading({ children: [node] }); // depth 7
    expect(() => validateTree([node])).toThrow(/nested too deep/);
  });

  it("throws when there are too many nodes (> 300)", () => {
    const many = Array.from({ length: 301 }, (_, i) => heading({ id: `h${i}` }));
    expect(() => validateTree(many)).toThrow(/Too many blocks/);
  });

  it("throws when style/advanced is too large", () => {
    const big = { blob: "x".repeat(20_001) };
    expect(() => validateTree([heading({ style: big })])).toThrow(/too large/);
  });
});
