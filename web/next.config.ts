import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * `script-src` has to keep 'unsafe-inline': Next's hydration bootstrap is an
 * inline script, and the admin can paste arbitrary head/footer code via the
 * integrations block by design. Removing it needs per-request nonces from
 * proxy.ts, which is a bigger change than this pass. What the policy DOES buy
 * even so: `object-src 'none'` (no Flash/plugin vectors), `base-uri 'self'`
 * (blocks <base> tag hijacking of every relative URL), `form-action 'self'`
 * (a injected form cannot POST credentials off-site), and `frame-ancestors
 * 'none'` (clickjacking).
 *
 * Third-party origins are the analytics/pixel providers wired up in
 * SiteScripts.tsx plus YouTube for VideoPlayer; anything not listed is blocked.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://analytics.tiktok.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' https:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.googletagmanager.com",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // Two years + preload is the threshold hstspreload.org requires. Only
  // meaningful once the site is HTTPS-only, which it is.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Stops a browser second-guessing Content-Type - the classic vector for
  // getting an uploaded "image" executed as script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Redundant with frame-ancestors above, kept for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Pin Turbopack's module-resolution root to THIS directory (web/), not the
  // repo root. The repo-root package.json deploy shim brings its own
  // package-lock.json, and Turbopack auto-detects the root by looking for a
  // lockfile - so it picked the repo root and encoded the app as living at
  // `<root>/web`. Hostinger then runs the build from
  // hbuilds/versions/<uuid>/nodejs/ (i.e. web/ contents promoted to the top
  // level), where that `web/` segment doesn't exist, so externalized packages
  // resolved against the old layout blew up at runtime:
  //   Failed to load external module @prisma/client-<hash>:
  //   Cannot find module '@prisma/client-<hash>'
  // thrown from middleware.js on every request -> site-wide 500.
  // Rooting here keeps the app at `<root>/` in both the build and the deployed
  // tree, so resolution survives the relocation.
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      // Media uploads go through a server action; raw multipart body cap.
      bodySizeLimit: "12mb",
    },
    // Next defaults this to os.cpus().length - 1, which reads as ~48 inside
    // Hostinger's build container (the host's core count, not this app's
    // actual allocation). Capped purely to avoid oversubscribing a shared
    // box during builds. NOTE: this was NOT the cause of the deployed-chunk
    // 404s - see expireTime below for that.
    cpus: 2,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Next's default (31536000 = 1 year) is what it puts in `s-maxage` for
  // prerendered pages, and Hostinger's CDN honors it literally while NOT
  // purging on deploy. Result: edge nodes served the same HTML document for
  // days, and that HTML referenced hashed JS chunks which later builds had
  // already deleted -> 404 -> hydration never completed ("This page couldn't
  // load", dead scroll animations, stale content). Capping it means stale
  // HTML can only outlive a deploy by minutes, not months.
  expireTime: 300,
  // Files under /public ship with NO Cache-Control at all (measured against
  // production: /media/hero-seq/frame-000.webp returned none, while
  // /_next/static/* correctly got `immutable`). So every visit re-validated
  // all ~300 hero frames and hcdn mostly reported MISS on them - tens of MB
  // going back to origin on repeat visits. This is the single biggest cause
  // of the site feeling slow, and no amount of lazy-loading fixes it.
  // Order matters: where two rules match the same path and set the same key,
  // the LAST one wins, so the specific hero-sequence rules come after the
  // catch-all rather than before it.
  // Stored media paths are `/uploads/<month>/<file>`. Returning a plain array
  // makes these "afterFiles" rewrites, i.e. they only apply when nothing on the
  // filesystem matched - so locally, where uploads live in public/uploads, the
  // static file still wins and nothing changes. In production UPLOAD_DIR points
  // outside the per-deploy build directory (see src/lib/uploads.ts), there is
  // no static file to match, and this hands the request to the route handler
  // that reads from UPLOAD_DIR.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }];
  },
  async headers() {
    return [
      {
        // Security headers, site-wide. Applied first so the cache rules below
        // can add Cache-Control on top without clobbering these.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // CMS uploads: the same path can be replaced with new content, so these
        // get a day of freshness plus a week of serve-stale, not `immutable`.
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Build artifacts of scripts/build-hero-frames.mjs, and the bulk of the
      // homepage's weight. `immutable` means clients never re-check, so a
      // re-encode MUST land on a new `-vN` directory rather than overwriting
      // these - that is exactly what the unsuffixed v1 paths got wrong.
      {
        source: "/media/hero-seq-v5/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/media/hero-seq-mobile-v5/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
