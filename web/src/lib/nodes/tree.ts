import type { Node } from "./types";

const clamp = (i: number, len: number) => Math.max(0, Math.min(i, len));

export function findNode(tree: Node[], id: string): Node | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParent(tree: Node[], id: string): { parent: Node | null; index: number } | null {
  const search = (list: Node[], parent: Node | null): { parent: Node | null; index: number } | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { parent, index: i };
      const kids = list[i].children;
      if (kids) {
        const found = search(kids, list[i]);
        if (found) return found;
      }
    }
    return null;
  };
  return search(tree, null);
}

export function updateNode(tree: Node[], id: string, fn: (n: Node) => Node): Node[] {
  return tree.map((node) => {
    if (node.id === id) return fn(node);
    if (node.children?.length) return { ...node, children: updateNode(node.children, id, fn) };
    return node;
  });
}

export function updateSiblings(tree: Node[], parentId: string | null, fn: (sibs: Node[]) => Node[]): Node[] {
  if (parentId === null) return fn(tree);
  return updateNode(tree, parentId, (parent) => ({ ...parent, children: fn(parent.children ?? []) }));
}

export function removeNode(tree: Node[], id: string): Node[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) => (node.children?.length ? { ...node, children: removeNode(node.children, id) } : node));
}

export function insertNode(tree: Node[], target: { parentId: string | null; index: number }, node: Node): Node[] {
  return updateSiblings(tree, target.parentId, (sibs) => {
    const next = [...sibs];
    next.splice(clamp(target.index, next.length), 0, node);
    return next;
  });
}

export function isDescendant(tree: Node[], ancestorId: string, maybeId: string): boolean {
  const ancestor = findNode(tree, ancestorId);
  return Boolean(ancestor?.children && findNode(ancestor.children, maybeId));
}

export function moveNode(tree: Node[], id: string, target: { parentId: string | null; index: number }): Node[] {
  if (id === target.parentId) return tree;
  if (target.parentId !== null && isDescendant(tree, id, target.parentId)) return tree;
  const node = findNode(tree, id);
  const loc = findParent(tree, id);
  if (!node || !loc) return tree;
  const sameParent = (loc.parent?.id ?? null) === target.parentId;
  let index = target.index;
  if (sameParent && loc.index < target.index) index -= 1; // removal shifts later indices left
  return insertNode(removeNode(tree, id), { parentId: target.parentId, index }, node);
}

function cloneWithFreshIds(node: Node): Node {
  return {
    ...node,
    id: crypto.randomUUID(),
    props: structuredClone(node.props),
    ...(node.style ? { style: structuredClone(node.style) } : {}),
    ...(node.advanced ? { advanced: structuredClone(node.advanced) } : {}),
    ...(node.children ? { children: node.children.map(cloneWithFreshIds) } : {}),
  };
}

export function duplicateNode(tree: Node[], id: string): { tree: Node[]; newId: string } {
  const node = findNode(tree, id);
  const loc = findParent(tree, id);
  if (!node || !loc) return { tree, newId: id };
  const copy = cloneWithFreshIds(node);
  return { tree: insertNode(tree, { parentId: loc.parent?.id ?? null, index: loc.index + 1 }, copy), newId: copy.id };
}
