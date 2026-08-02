import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        // CMS uploads: the same path can be replaced with new content, so these
        // get a day of freshness plus a week of serve-stale, not `immutable`.
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Build artifacts of scripts/build-hero-frames.mjs, and the bulk of the
      // homepage's weight. Regenerating rewrites every frame under the same
      // names, so rename the directory if that ever happens - `immutable`
      // means clients will not re-check.
      {
        source: "/media/hero-seq/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/media/hero-seq-mobile/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
