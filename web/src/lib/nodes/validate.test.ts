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

  it("passes when nested exactly at the depth limit (6)", () => {
    let node: RawNode = heading();
    for (let i = 0; i < 5; i += 1) node = heading({ children: [node] }); // depth 6
    let result: RawNode[] = [];
    expect(() => {
      result = validateTree([node]);
    }).not.toThrow();
    expect(result).toHaveLength(1);
  });

  it("throws when there are too many nodes (> 300)", () => {
    const many = Array.from({ length: 301 }, (_, i) => heading({ id: `h${i}` }));
    expect(() => validateTree(many)).toThrow(/Too many blocks/);
  });

  it("passes when there are exactly 300 nodes (at the limit)", () => {
    const many = Array.from({ length: 300 }, (_, i) => heading({ id: `h${i}` }));
    let result: RawNode[] = [];
    expect(() => {
      result = validateTree(many);
    }).not.toThrow();
    expect(result).toHaveLength(300);
  });

  it("throws when style/advanced is too large", () => {
    const big = { blob: "x".repeat(20_001) };
    expect(() => validateTree([heading({ style: big })])).toThrow(/too large/);
  });

  it("passes when style/advanced is just under the size cap", () => {
    const blob = "x".repeat(19_000);
    let result: RawNode[] = [];
    expect(() => {
      result = validateTree([heading({ style: { blob } })]);
    }).not.toThrow();
    expect(result[0].style?.blob).toBe(blob);
  });
});
