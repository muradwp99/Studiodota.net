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
  css += decl("min-height", lenOf(r(style.minHeight)));
  css += decl("max-width", lenOf(r(style.maxWidth)));
  css += decl("border-radius", lenOf(r(style.borderRadius)));
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
  if (custom) parts.push(custom.replace(/selector/g, sel));

  return parts.join("");
}

export function wrapperAttrs(node: Node): { className: string; id?: string } {
  const classes = [`n-${node.id}`];
  const adv = (node.advanced ?? {}) as Record<string, unknown>;
  if (typeof adv.cssClasses === "string" && adv.cssClasses.trim()) classes.push(adv.cssClasses.trim());
  const id = typeof adv.cssId === "string" && adv.cssId.trim() ? adv.cssId.trim() : undefined;
  return { className: classes.join(" "), id };
}
