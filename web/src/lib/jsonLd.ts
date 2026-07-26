/**
 * Safely serializes an object for a `<script type="application/ld+json">` tag.
 * These fields are admin-edited CMS strings (site name, description, etc.) —
 * escaping "<" prevents a value containing "</script>" from breaking out of
 * the tag when the HTML is parsed.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
