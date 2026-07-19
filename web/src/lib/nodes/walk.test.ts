import { describe, it, expect } from "vitest";
import { walkNodes, countNodes, treeDepth } from "./walk";
import type { Node } from "./types";

const tree: Node[] = [
  {
    id: "1",
    type: "container",
    props: {},
    children: [
      { id: "1a", type: "text", props: {} },
      { id: "1b", type: "container", props: {}, children: [{ id: "1b1", type: "text", props: {} }] },
    ],
  },
  { id: "2", type: "text", props: {} },
];

describe("tree walkers", () => {
  it("visits every node depth-first with its depth", () => {
    const seen: Array<[string, number]> = [];
    walkNodes(tree, (n, d) => seen.push([n.id, d]));
    expect(seen).toEqual([
      ["1", 1], ["1a", 2], ["1b", 2], ["1b1", 3], ["2", 1],
    ]);
  });

  it("countNodes counts all nested nodes", () => {
    expect(countNodes(tree)).toBe(5);
  });

  it("treeDepth returns the deepest nesting level", () => {
    expect(treeDepth(tree)).toBe(3);
    expect(treeDepth([])).toBe(0);
  });
});
