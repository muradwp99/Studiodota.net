import type { Node, Responsive, Breakpoint } from "./types";

/** Pick the value for a breakpoint. A scalar applies only at base (the base rule cascades down). */
export function resolveResponsive<T>(
  v: Responsive<T> | undefined,
  bp: Breakpoint,
): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object" && ("base" in v || "tablet" in v || "mobile" in v)) {
    return (v as { base?: T; tablet?: T; mobile?: T })[bp];
  }
  return bp === "base" ? (v as T) : undefined;
}

function decl(prop: string, val: string | number | undefined): string {
  return val === undefined || val === "" ? "" : `${prop}:${val};`;
}

function lenOf(v: unknown): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  return typeof v === "number" ? `${v}px` : String(v);
}

/** A 4-side box: { top, right, bottom, left, unit? }. */
function boxCss(prop: "padding" | "margin", box: unknown): string {
  if (!box || typeof box !== "object") return "";
  const b = box as Record<string, unknown>;
  if (b.top === undefined && b.right === undefined && b.bottom === undefined && b.left === undefined) {
    return "";
  }
  const u = typeof b.unit === "string" ? b.unit : "px";
  const side = (v: unknown) => (v === undefined || v === null || v === "" ? "0" : `${Number(v)}${u}`);
  return `${prop}:${side(b.top)} ${side(b.right)} ${side(b.bottom)} ${side(b.left)};`;
}

const SHADOW_PRESETS: Record<string, string> = {
  soft: "0 1px 3px rgba(17,19,21,0.08), 0 1px 2px rgba(17,19,21,0.06)",
  medium: "0 4px 12px rgba(17,19,21,0.10), 0 2px 4px rgba(17,19,21,0.06)",
  strong: "0 10px 30px rgba(17,19,21,0.16), 0 4px 8px rgba(17,19,21,0.08)",
};

function shadowOf(v: unknown): string | undefined {
  return typeof v === "string" && SHADOW_PRESETS[v] ? SHADOW_PRESETS[v] : undefined;
}

/** True when boxShadow resolves to a real preset (scalar or any breakpoint); "none"/unset do not force a box. */
function hasShadow(v: unknown): boolean {
  if (v && typeof v === "object") {
    return Object.values(v as Record<string, unknown>).some((x) => Boolean(shadowOf(x)));
  }
  return Boolean(shadowOf(v));
}

export function styleToCss(
  style: Record<string, unknown>,
  advanced: Record<string, unknown>,
  bp: Breakpoint,
): string {
  const r = <T,>(v: unknown) => resolveResponsive<T>(v as Responsive<T>, bp);
  let css = "";
  css += boxCss("padding", r(advanced.padding));
  css += boxCss("margin", r(advanced.margin));
  css += decl("background-color", r<string>(style.backgroundColor));
  css += decl("color", r<string>(style.color));
  css += decl("text-align", r<string>(style.textAlign));
  // Typography (inherited — passes through a display:contents wrapper)
  css += decl("font-size", lenOf(r(style.fontSize)));
  css += decl("font-weight", r<string | number>(style.fontWeight));
  css += decl("line-height", r<string | number>(style.lineHeight));
  css += decl("letter-spacing", lenOf(r(style.letterSpacing)));
  css += decl("text-transform", r<string>(style.textTransform));
  // Sizing
  css += decl("width", lenOf(r(style.width)));
  css += decl("min-height", lenOf(r(style.minHeight)));
  css += decl("max-width", lenOf(r(style.maxWidth)));
  css += decl("border-radius", lenOf(r(style.borderRadius)));
  // Border (default style to solid when a width/color is set but style isn't)
  const bw = lenOf(r(style.borderWidth));
  const bc = r<string>(style.borderColor);
  const bs = r<string>(style.borderStyle);
  if (bw || (typeof bc === "string" && bc) || (typeof bs === "string" && bs)) {
    css += decl("border-width", bw);
    css += decl("border-style", typeof bs === "string" && bs ? bs : "solid");
    css += decl("border-color", typeof bc === "string" ? bc : undefined);
  }
  // Shadow
  css += decl("box-shadow", shadowOf(r(style.boxShadow)));
  // Position + z-index
  css += decl("position", r<string>(advanced.position));
  const z = r<number>(advanced.zIndex);
  css += decl("z-index", typeof z === "number" ? z : undefined);
  return css;
}

function transitionOf(style: Record<string, unknown>): string {
  return typeof style.transition === "string" && style.transition ? String(style.transition) : "0.3s ease";
}

function hoverToCss(style: Record<string, unknown>): string {
  const h = style.hover;
  if (!h || typeof h !== "object") return "";
  const hb = h as Record<string, unknown>;
  let css = "";
  css += decl("background-color", typeof hb.backgroundColor === "string" ? hb.backgroundColor : undefined);
  css += decl("color", typeof hb.color === "string" ? hb.color : undefined);
  return css;
}

function hideCss(sel: string, advanced: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (advanced.hideDesktop) out.push(`@media (min-width:1025px){${sel}{display:none!important;}}`);
  if (advanced.hideTablet) out.push(`@media (min-width:768px) and (max-width:1024px){${sel}{display:none!important;}}`);
  if (advanced.hideMobile) out.push(`@media (max-width:767px){${sel}{display:none!important;}}`);
  return out;
}

/**
 * Admin-authored custom CSS: replace the whole-word `selector` token with the
 * node's scoped class. (`</style` neutralization happens once for the whole
 * assembled sheet in nodeCss, covering custom CSS and free-text style values alike.)
 */
function sanitizeCustomCss(css: string, sel: string): string {
  return css.replace(/\bselector\b/g, sel);
}

/** Full stylesheet fragment for one node, scoped to `.n-{id}`. Empty if nothing to style. */
export function nodeCss(node: Node): string {
  const sel = `.n-${node.id}`;
  const style = (node.style ?? {}) as Record<string, unknown>;
  const advanced = (node.advanced ?? {}) as Record<string, unknown>;
  const parts: string[] = [];

  const base = styleToCss(style, advanced, "base");
  const hover = hoverToCss(style);
  const baseRule = hover ? `transition:all ${transitionOf(style)};${base}` : base;
  if (baseRule) parts.push(`${sel}{${baseRule}}`);
  if (hover) parts.push(`${sel}:hover{${hover}}`);

  const tablet = styleToCss(style, advanced, "tablet");
  if (tablet) parts.push(`@media (max-width:1024px){${sel}{${tablet}}}`);
  const mobile = styleToCss(style, advanced, "mobile");
  if (mobile) parts.push(`@media (max-width:767px){${sel}{${mobile}}}`);

  parts.push(...hideCss(sel, advanced));

  const custom = typeof advanced.customCss === "string" ? advanced.customCss.trim() : "";
  if (custom) parts.push(sanitizeCustomCss(custom, sel));

  // Neutralize any `</style` in the assembled sheet (custom CSS or free-text style
  // values) so it can't break out of the injected <style> tag.
  return parts.join("").replace(/<\/style/gi, "<\\/style");
}

export function wrapperAttrs(node: Node): { className: string; id?: string } {
  const classes = [`n-${node.id}`];
  const adv = (node.advanced ?? {}) as Record<string, unknown>;
  if (typeof adv.cssClasses === "string" && adv.cssClasses.trim()) classes.push(adv.cssClasses.trim());
  const id = typeof adv.cssId === "string" && adv.cssId.trim() ? adv.cssId.trim() : undefined;
  return { className: classes.join(" "), id };
}

const STYLE_BOX_KEYS = ["backgroundColor", "background", "backgroundImage", "minHeight", "maxWidth", "width", "borderRadius", "borderWidth", "borderStyle", "borderColor"];
const ADV_BOX_KEYS = ["padding", "margin", "position", "zIndex"];

/** A value counts as "set" if it (or any of its non-`unit` sub-values) is non-empty. */
function hasVal(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>).some(
      ([k, x]) => k !== "unit" && x !== undefined && x !== null && x !== "",
    );
  }
  return true;
}

/**
 * Does this node need a real box, or can its wrapper be `display:contents`
 * (layout-transparent)? True when it has children or any box-generating style/
 * advanced property; false when only inheritable text styling (color/align) or
 * bare attributes (cssClasses/cssId) are set.
 */
export function needsBox(node: Node): boolean {
  if (node.children?.length) return true;
  const s = (node.style ?? {}) as Record<string, unknown>;
  const a = (node.advanced ?? {}) as Record<string, unknown>;
  if (STYLE_BOX_KEYS.some((k) => hasVal(s[k]))) return true;
  if (hasShadow(s.boxShadow)) return true;
  if (ADV_BOX_KEYS.some((k) => hasVal(a[k]))) return true;
  if (s.hover && typeof s.hover === "object") return true;
  if (typeof a.customCss === "string" && a.customCss.trim()) return true;
  return false;
}
