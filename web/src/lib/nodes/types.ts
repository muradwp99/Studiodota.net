/** Per-breakpoint value. A bare scalar applies at every width (via the base rule). */
export type Responsive<T> = T | { base?: T; tablet?: T; mobile?: T };

export type Breakpoint = "base" | "tablet" | "mobile";

/** A page is a recursive tree of these. `children` is present only on containers. */
export type Node = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
  advanced?: Record<string, unknown>;
  children?: Node[];
};

export type PageTree = Node[];
