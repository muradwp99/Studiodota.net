export type BoxValue = { top?: number; right?: number; bottom?: number; left?: number; unit?: string };

export type StyleControl =
  | { kind: "color"; key: string; label: string }
  | { kind: "dimension"; key: string; label: string }
  | { kind: "slider"; key: string; label: string; min: number; max: number; step?: number; unit?: string }
  | { kind: "buttongroup"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; placeholder?: string }
  | { kind: "toggle"; key: string; label: string }
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
    label: "Typography",
    controls: [
      { kind: "slider", key: "fontSize", label: "Font size", min: 10, max: 96, step: 1, unit: "px" },
      {
        kind: "buttongroup",
        key: "fontWeight",
        label: "Weight",
        options: [
          { value: "400", label: "Normal" },
          { value: "500", label: "Medium" },
          { value: "600", label: "Semibold" },
          { value: "700", label: "Bold" },
        ],
      },
      { kind: "slider", key: "lineHeight", label: "Line height", min: 0.8, max: 2.4, step: 0.05 },
      { kind: "slider", key: "letterSpacing", label: "Letter spacing", min: -2, max: 12, step: 0.5, unit: "px" },
      {
        kind: "buttongroup",
        key: "textTransform",
        label: "Transform",
        options: [
          { value: "none", label: "None" },
          { value: "uppercase", label: "Upper" },
          { value: "capitalize", label: "Caps" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Sizing",
    controls: [
      { kind: "slider", key: "width", label: "Width", min: 0, max: 1600, step: 10, unit: "px" },
      { kind: "slider", key: "maxWidth", label: "Max width", min: 0, max: 1600, step: 10, unit: "px" },
      { kind: "slider", key: "minHeight", label: "Min height", min: 0, max: 1000, step: 10, unit: "px" },
      { kind: "slider", key: "borderRadius", label: "Corner radius", min: 0, max: 80, step: 1, unit: "px" },
    ],
  },
  {
    kind: "group",
    label: "Border",
    controls: [
      { kind: "slider", key: "borderWidth", label: "Border width", min: 0, max: 20, step: 1, unit: "px" },
      {
        kind: "buttongroup",
        key: "borderStyle",
        label: "Border style",
        options: [
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
        ],
      },
      { kind: "color", key: "borderColor", label: "Border color" },
    ],
  },
  {
    kind: "group",
    label: "Shadow",
    controls: [
      {
        kind: "buttongroup",
        key: "boxShadow",
        label: "Box shadow",
        options: [
          { value: "none", label: "None" },
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Hover",
    controls: [
      { kind: "color", key: "hover.backgroundColor", label: "Hover background" },
      { kind: "color", key: "hover.color", label: "Hover text" },
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
    label: "Position",
    controls: [
      {
        kind: "buttongroup",
        key: "position",
        label: "Position",
        options: [
          { value: "static", label: "Static" },
          { value: "relative", label: "Relative" },
          { value: "absolute", label: "Absolute" },
          { value: "sticky", label: "Sticky" },
        ],
      },
      { kind: "slider", key: "zIndex", label: "Z-index", min: 0, max: 100, step: 1 },
    ],
  },
  {
    kind: "group",
    label: "Visibility",
    controls: [
      { kind: "toggle", key: "hideDesktop", label: "Hide on desktop" },
      { kind: "toggle", key: "hideTablet", label: "Hide on tablet" },
      { kind: "toggle", key: "hideMobile", label: "Hide on mobile" },
    ],
  },
  {
    kind: "group",
    label: "Attributes",
    controls: [
      { kind: "text", key: "cssClasses", label: "CSS classes", placeholder: "my-class another" },
      { kind: "text", key: "cssId", label: "CSS ID", placeholder: "unique-id" },
    ],
  },
  {
    kind: "group",
    label: "Custom CSS",
    controls: [
      { kind: "textarea", key: "customCss", label: "Custom CSS", placeholder: "selector { opacity: 0.9; }" },
    ],
  },
];
