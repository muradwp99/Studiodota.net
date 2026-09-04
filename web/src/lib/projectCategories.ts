/**
 * Filter-bar order + labels for the work index, shared by the client-side
 * filter (ProjectsClient) and the server-rendered project page's back link.
 *
 * Lives here rather than in ProjectsClient because that file is "use client":
 * a server component importing a non-function export from a client module gets
 * a client *reference*, not the array — which type-checks and runs in dev, then
 * fails prerendering with "CATEGORY_LABELS.find is not a function".
 *
 * Keep in step with projectCategories in the taxonomies block and with
 * scripts/update-project-structure.mjs.
 */
export const CATEGORY_LABELS: [key: string, label: string][] = [
  ["affordable-housing", "Affordable housing"],
  ["single-family", "Single family"],
  ["multifamily", "Multifamily"],
  ["mixed-use", "Mixed use"],
  // Fire rebuilds used to sit inside single family with no way to filter for
  // them, which buried the Palisades work.
  ["fire-rebuild", "Fire rebuild"],
  ["commercial", "Commercial"],
  ["senior-living", "Senior house"],
  ["adu", "ADU"],
  ["interior", "Interior"],
  // legacy demo categories — shown only if such rows still exist
  ["residential", "Residential"],
  ["institutional", "Institutional"],
  ["masterplan", "Masterplan"],
];

/** Human label for a category key, or undefined for an unknown one. */
export const categoryLabel = (key: string): string | undefined =>
  CATEGORY_LABELS.find(([k]) => k === key)?.[1];
