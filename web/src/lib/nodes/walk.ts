import type { Node } from "./types";

export function walkNodes(
  tree: Node[],
  visit: (node: Node, depth: number) => void,
  depth = 1,
): void {
  for (const node of tree) {
    visit(node, depth);
    if (node.children?.length) walkNodes(node.children, visit, depth + 1);
  }
}

export function countNodes(tree: Node[]): number {
  let count = 0;
  walkNodes(tree, () => {
    count += 1;
  });
  return count;
}

export function treeDepth(tree: Node[]): number {
  const depthOf = (nodes: Node[]): number =>
    nodes.reduce(
      (max, n) => Math.max(max, 1 + (n.children?.length ? depthOf(n.children) : 0)),
      0,
    );
  return depthOf(tree);
}
