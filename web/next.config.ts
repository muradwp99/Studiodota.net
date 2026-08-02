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
};

export default nextConfig;
