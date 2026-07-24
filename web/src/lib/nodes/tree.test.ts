import { describe, it, expect } from "vitest";
import { findNode, findParent, updateNode, updateSiblings, removeNode, insertNode, moveNode, duplicateNode, isDescendant } from "./tree";
import type { Node } from "./types";

const n = (id: string, children?: Node[]): Node => ({ id, type: children ? "container" : "text", props: {}, ...(children ? { children } : {}) });
// Tree: A[ B, C[ D, E ] ], F
const tree = (): Node[] => [n("A", [n("B"), n("C", [n("D"), n("E")])]), n("F")];

describe("findNode / findParent", () => {
  it("finds nested nodes", () => {
    expect(findNode(tree(), "E")?.id).toBe("E");
    expect(findNode(tree(), "zzz")).toBeNull();
  });
  it("finds parent + index (null parent for top level)", () => {
    expect(findParent(tree(), "F")).toEqual({ parent: null, index: 1 });
    const p = findParent(tree(), "E");
    expect(p?.parent?.id).toBe("C");
    expect(p?.index).toBe(1);
  });
});

describe("updateNode", () => {
  it("updates a nested node immutably", () => {
    const out = updateNode(tree(), "D", (node) => ({ ...node, props: { x: 1 } }));
    expect(findNode(out, "D")?.props).toEqual({ x: 1 });
    expect(findNode(out, "E")?.props).toEqual({});
  });
});

describe("updateSiblings", () => {
  it("transforms top-level siblings when parentId is null", () => {
    const out = updateSiblings(tree(), null, (sibs) => sibs.slice().reverse());
    expect(out.map((x) => x.id)).toEqual(["F", "A"]);
  });
  it("transforms a container's children", () => {
    const out = updateSiblings(tree(), "C", (sibs) => sibs.slice().reverse());
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["E", "D"]);
  });
});

describe("removeNode", () => {
  it("removes a nested node", () => {
    const out = removeNode(tree(), "D");
    expect(findNode(out, "D")).toBeNull();
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["E"]);
  });
});

describe("insertNode", () => {
  it("inserts at top level", () => {
    const out = insertNode(tree(), { parentId: null, index: 1 }, n("X"));
    expect(out.map((x) => x.id)).toEqual(["A", "X", "F"]);
  });
  it("inserts into a container", () => {
    const out = insertNode(tree(), { parentId: "C", index: 1 }, n("X"));
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["D", "X", "E"]);
  });
  it("clamps an out-of-range index", () => {
    const out = insertNode(tree(), { parentId: "C", index: 99 }, n("X"));
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["D", "E", "X"]);
  });
});

describe("moveNode", () => {
  it("reorders down within the same parent", () => {
    // move B to after C (top-of-A children): as-if-not-removed index 2
    const out = moveNode(tree(), "B", { parentId: "A", index: 2 });
    expect(findNode(out, "A")?.children?.map((x) => x.id)).toEqual(["C", "B"]);
  });
  it("moves across parents", () => {
    const out = moveNode(tree(), "F", { parentId: "C", index: 0 });
    expect(out.map((x) => x.id)).toEqual(["A"]);
    expect(findNode(out, "C")?.children?.map((x) => x.id)).toEqual(["F", "D", "E"]);
  });
  it("no-ops moving into itself or a descendant", () => {
    expect(moveNode(tree(), "C", { parentId: "C", index: 0 })).toEqual(tree());
    expect(moveNode(tree(), "C", { parentId: "D", index: 0 })).toEqual(tree());
  });
});

describe("duplicateNode", () => {
  it("clones after the source with fresh, unique ids across the whole subtree", () => {
    const { tree: out, newId } = duplicateNode(tree(), "C");
    const kids = findNode(out, "A")?.children?.map((x) => x.id) ?? [];
    expect(kids[0]).toBe("B");
    expect(kids[1]).toBe("C");
    expect(kids[2]).toBe(newId);      // the clone, inserted after C
    // collect all ids; assert no duplicates
    const all: string[] = [];
    const walk = (list: Node[]) => list.forEach((x) => { all.push(x.id); if (x.children) walk(x.children); });
    walk(out);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("isDescendant", () => {
  it("detects descendants", () => {
    expect(isDescendant(tree(), "C", "E")).toBe(true);
    expect(isDescendant(tree(), "C", "B")).toBe(false);
  });
});
