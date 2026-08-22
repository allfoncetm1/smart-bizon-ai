import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type-check locally / in CI; skipped here because the production
    // VPS (1 vCPU / 2GB, no swap) OOMs during the build's tsc pass.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
