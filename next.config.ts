import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the user profile makes Next mis-infer the workspace root.
  outputFileTracingRoot: __dirname,
  async redirects() {
    // The workspace moved under /app when the marketing site took the root.
    return [
      { source: "/orders/:path*", destination: "/app/orders/:path*", permanent: true },
      { source: "/demo", destination: "/app?tour=1", permanent: false },
    ];
  },
};

export default nextConfig;
