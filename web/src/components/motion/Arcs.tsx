/**
 * Oversized concentric-arc ornament — the largo.studio "logo geometry in the
 * background" gesture, in Studiodota's line + gold vocabulary. Server-safe
 * (pure SVG). Position/size it from the caller; it never captures pointers.
 */
export default function Arcs({
  className = "",
  rings = 3,
  stroke = "var(--line-strong)",
}: {
  className?: string;
  rings?: 2 | 3;
  stroke?: string;
}) {
  const radii = rings === 2 ? [340, 240] : [340, 250, 160];
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 720 720"
      fill="none"
    >
      {radii.map((r, i) => (
        <circle key={r} cx="360" cy="360" r={r} stroke={stroke} strokeWidth={i === 0 ? 1 : 1.25} opacity={1 - i * 0.25} />
      ))}
    </svg>
  );
}
