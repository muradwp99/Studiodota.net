import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media uploads go through a server action; raw multipart body cap.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
