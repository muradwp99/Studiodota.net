/**
 * Injects the client's brand accent (the `appearance` block) as CSS variables,
 * overriding the champagne-bronze token family in both light and dark themes.
 * Shades are derived from the single accent with color-mix, so one colour drives
 * the whole system. Server component — renders a plain <style> tag.
 */
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export default function AppearanceStyle({ accent }: { accent: string }) {
  // Guard against anything non-hex reaching the stylesheet.
  if (!HEX.test(accent) || accent.toLowerCase() === "#a87f3f") return null;
  const a = accent;
  const css = `
:root{
  --gold:${a};
  --gold-hi:color-mix(in srgb, ${a} 82%, #000);
  --gold-ink:color-mix(in srgb, ${a} 90%, #000);
  --gold-media:color-mix(in srgb, ${a} 60%, #fff);
}
:root[data-theme="dark"]{
  --gold:color-mix(in srgb, ${a} 76%, #fff);
  --gold-hi:color-mix(in srgb, ${a} 60%, #fff);
  --gold-ink:color-mix(in srgb, ${a} 58%, #fff);
  --gold-media:color-mix(in srgb, ${a} 52%, #fff);
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
