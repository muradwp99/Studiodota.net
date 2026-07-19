import type { Node } from "./types";

let seq = 0;
function genId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `n_${(seq++).toString(36)}_${Date.now().toString(36)}`
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Coerce one raw JSON value into a Node, or null if it isn't a usable block. */
export function normalizeNode(raw: unknown): Node | null {
  if (!isPlainObject(raw)) return null;
  const type = typeof raw.type === "string" ? raw.type : "";
  if (!type) return null;

  const id = typeof raw.id === "string" && raw.id ? raw.id : genId();
  const props = isPlainObject(raw.props) ? raw.props : {};
  const node: Node = { id, type, props };

  if (isPlainObject(raw.style)) node.style = raw.style;
  if (isPlainObject(raw.advanced)) node.advanced = raw.advanced;
  if (Array.isArray(raw.children)) {
    const kids = raw.children
      .map(normalizeNode)
      .filter((n): n is Node => n !== null);
    if (kids.length) node.children = kids;
  }
  return node;
}

/** Read-path migration: old flat blocks are already valid childless Nodes. */
export function normalizeTree(raw: unknown): Node[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeNode).filter((n): n is Node => n !== null);
}
