import { describe, it, expect } from "vitest";
import { normalizeNode, normalizeTree } from "./normalize";

describe("normalizeTree", () => {
  it("returns [] for non-arrays", () => {
    expect(normalizeTree(null)).toEqual([]);
    expect(normalizeTree({})).toEqual([]);
    expect(normalizeTree(undefined)).toEqual([]);
  });

  it("preserves an old flat block unchanged", () => {
    const old = [{ id: "a", type: "heading", props: { text: "Hi" } }];
    expect(normalizeTree(old)).toEqual([
      { id: "a", type: "heading", props: { text: "Hi" } },
    ]);
  });

  it("fills a missing id and defaults missing props to {}", () => {
    const [node] = normalizeTree([{ type: "text" }]);
    expect(node.type).toBe("text");
    expect(typeof node.id).toBe("string");
    expect(node.id.length).toBeGreaterThan(0);
    expect(node.props).toEqual({});
  });

  it("drops entries without a type", () => {
    expect(normalizeTree([{ id: "x", props: {} }, { type: "text", props: {} }]))
      .toHaveLength(1);
  });

  it("keeps style/advanced when objects, drops them otherwise", () => {
    const [a] = normalizeTree([{ type: "text", props: {}, style: { color: "#000" }, advanced: "nope" }]);
    expect(a.style).toEqual({ color: "#000" });
    expect(a.advanced).toBeUndefined();
  });

  it("normalizes children recursively and omits empty children arrays", () => {
    const [parent] = normalizeTree([
      { type: "container", props: {}, children: [{ type: "text", props: {} }, "junk"] },
    ]);
    expect(parent.children).toHaveLength(1);
    expect(parent.children?.[0].type).toBe("text");

    const [leaf] = normalizeTree([{ type: "text", props: {}, children: [] }]);
    expect(leaf.children).toBeUndefined();
  });

  it("normalizeNode returns null for junk", () => {
    expect(normalizeNode(42)).toBeNull();
    expect(normalizeNode({ id: "x" })).toBeNull();
  });
});
