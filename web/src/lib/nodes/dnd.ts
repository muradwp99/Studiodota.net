/** Drag-and-drop index math for the page-builder canvas (pure, framework-free). */

export type DropPos = "before" | "after";

/** Index to splice a NEW item in at, given the hovered index and half. */
export function insertIndexFor(over: number, pos: DropPos): number {
  return pos === "before" ? over : over + 1;
}

/**
 * Final index for a REORDER: the source at `from` is removed first, so any
 * target index greater than `from` shifts left by one.
 */
export function reorderIndexFor(from: number, over: number, pos: DropPos): number {
  const to = insertIndexFor(over, pos);
  return from < to ? to - 1 : to;
}
