import { blockTypeFor } from "@/lib/pageBlocks";
import { validateFields, ValidationError } from "@/lib/validateFields";

export type RawNode = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  children?: RawNode[];
};

const MAX_DEPTH = 6;
const MAX_NODES = 300;
const MAX_BAG_BYTES = 20_000;

function sanitizeBag(bag: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!bag) return undefined;
  const json = JSON.stringify(bag);
  if (json.length > MAX_BAG_BYTES) {
    throw new ValidationError("A block's style/advanced settings are too large.");
  }
  return JSON.parse(json) as Record<string, unknown>;
}

/** Validate + sanitize a node tree for persistence. Throws ValidationError on any problem. */
export function validateTree(nodes: RawNode[]): RawNode[] {
  let count = 0;
  const visit = (list: RawNode[], depth: number): RawNode[] => {
    if (depth > MAX_DEPTH) {
      throw new ValidationError(`Blocks are nested too deep (max ${MAX_DEPTH} levels).`);
    }
    return list.map((b) => {
      count += 1;
      if (count > MAX_NODES) {
        throw new ValidationError(`Too many blocks on the page (max ${MAX_NODES}).`);
      }
      const type = blockTypeFor(b.type);
      if (!type) throw new ValidationError(`Unknown block type "${b.type}".`);

      const out: RawNode = {
        id: b.id,
        type: b.type,
        props: validateFields(type.fields, b.props, type.defaults),
      };
      const style = sanitizeBag(b.style);
      if (style) out.style = style;
      const advanced = sanitizeBag(b.advanced);
      if (advanced) out.advanced = advanced;
      if (b.children) out.children = visit(b.children, depth + 1);
      return out;
    });
  };
  return visit(nodes, 1);
}
