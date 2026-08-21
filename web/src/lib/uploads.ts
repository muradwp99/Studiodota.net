import path from "path";

/**
 * Where CMS media uploads live on disk.
 *
 * Defaults to `public/uploads`, so local dev keeps serving them as ordinary
 * static files with no extra wiring and nothing about existing behaviour
 * changes.
 *
 * In production set UPLOAD_DIR to a path OUTSIDE the build output. Hostinger
 * (like most managed Node hosts) deploys every build into a fresh directory -
 * hbuilds/versions/<uuid>/nodejs - and serves the app from there, so anything
 * written inside the build tree is gone on the next deploy. That silently ate
 * every image an admin uploaded: the write succeeded, the DB row persisted,
 * and the file vanished, leaving a broken image with no error anywhere.
 *
 * Stored DB paths stay `/uploads/<month>/<file>` either way - the rewrite in
 * next.config.ts sends them to the /api/uploads route handler when the file
 * isn't present as a static asset, which is exactly the production case.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR?.trim()
  ? path.resolve(process.env.UPLOAD_DIR.trim())
  : path.join(process.cwd(), "public", "uploads");

/**
 * Resolve `relative` under UPLOAD_DIR, returning null if it escapes it.
 * Every path that reaches the filesystem goes through here: the serving route
 * takes its segments straight from the URL, so `../../` traversal has to be
 * refused rather than trusted.
 */
export function resolveUpload(relative: string): string | null {
  if (relative.includes("\0")) return null;
  const abs = path.resolve(UPLOAD_DIR, relative);
  const root = UPLOAD_DIR.endsWith(path.sep) ? UPLOAD_DIR : UPLOAD_DIR + path.sep;
  return abs.startsWith(root) ? abs : null;
}

/** Absolute path for a stored media path like "/uploads/2026-08/foo.jpg". */
export function resolveStoredUpload(storedPath: string): string | null {
  if (!storedPath.startsWith("/uploads/")) return null;
  return resolveUpload(storedPath.slice("/uploads/".length));
}
