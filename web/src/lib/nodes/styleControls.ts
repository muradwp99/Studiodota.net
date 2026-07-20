export type BoxValue = { top?: number; right?: number; bottom?: number; left?: number; unit?: string };

export type StyleControl =
  | { kind: "color"; key: string; label: string }
  | { kind: "dimension"; key: string; label: string }
  | { kind: "slider"; key: string; label: string; min: number; max: number; step?: number; unit?: string }
  | { kind: "buttongroup"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "group"; label: string; controls: StyleControl[] };

/** Style tab — writes to node.style. Every key here is mapped by lib/nodes/css.ts. */
export const STYLE_CONTROLS: StyleControl[] = [
  {
    kind: "group",
    label: "Background & text",
    controls: [
      { kind: "color", key: "backgroundColor", label: "Background" },
      { kind: "color", key: "color", label: "Text color" },
      {
        kind: "buttongroup",
        key: "textAlign",
        label: "Text align",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Sizing",
    controls: [
      { kind: "slider", key: "maxWidth", label: "Max width", min: 0, max: 1600, step: 10, unit: "px" },
      { kind: "slider", key: "minHeight", label: "Min height", min: 0, max: 1000, step: 10, unit: "px" },
      { kind: "slider", key: "borderRadius", label: "Corner radius", min: 0, max: 80, step: 1, unit: "px" },
    ],
  },
];

/** Advanced tab — writes to node.advanced. Every key here is mapped by lib/nodes/css.ts or wrapperAttrs. */
export const ADVANCED_CONTROLS: StyleControl[] = [
  {
    kind: "group",
    label: "Spacing",
    controls: [
      { kind: "dimension", key: "padding", label: "Padding" },
      { kind: "dimension", key: "margin", label: "Margin" },
    ],
  },
  {
    kind: "group",
    label: "Layout & attributes",
    controls: [
      { kind: "slider", key: "zIndex", label: "Z-index", min: 0, max: 100, step: 1 },
      { kind: "text", key: "cssClasses", label: "CSS classes", placeholder: "my-class another" },
      { kind: "text", key: "cssId", label: "CSS ID", placeholder: "unique-id" },
    ],
  },
];
