import { readFile, stat } from "fs/promises";
import path from "path";
import { resolveUpload } from "@/lib/uploads";

/**
 * GET /api/uploads/<...> — serves CMS media from UPLOAD_DIR.
 *
 * Only reached via the `/uploads/:path*` rewrite in next.config.ts, and only
 * when the file isn't already a static asset under public/ (that rewrite runs
 * after the filesystem check). So locally this is dead code and uploads are
 * served straight from public/uploads as before; in production, where
 * UPLOAD_DIR points outside the per-deploy build directory, this is what makes
 * uploaded images reachable at all.
 */
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  // resolveUpload refuses anything escaping UPLOAD_DIR - these segments come
  // straight from the URL, so `../` has to be rejected, not trusted.
  const abs = resolveUpload(segments.join("/"));
  if (!abs) return new Response("Not found", { status: 404 });

  const ext = path.extname(abs).toLowerCase();
  const type = MIME[ext];
  // Whitelist the types the uploader itself accepts; never hand back arbitrary
  // files that happen to be sitting in the directory.
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(abs);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const body = await readFile(abs);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        // Upload filenames carry 4 random bytes and are never rewritten in
        // place, so the bytes at a given URL are stable.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
