import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media uploads go through a server action; raw multipart body cap.
      bodySizeLimit: "12mb",
    },
    // Next defaults this to os.cpus().length - 1. On Hostinger's build
    // container that reads as ~48 (the host's full core count, not what this
    // app is actually allocated), so `next build` spawned 48 concurrent
    // static-page workers on a box that can't support it — some chunk files
    // silently failed to write, causing intermittent 404s on deployed pages.
    cpus: 2,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
