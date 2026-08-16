import type { NextConfig } from "next";

// Upstream host for large binary assets proxied through /models/<file>
// (currently only the clock tower GLB — the Masjid GLB is fetched directly
// from GitHub raw, which is CORS-enabled). Server-side only — must NOT be
// prefixed with NEXT_PUBLIC_. Next streams the response through without
// buffering it in memory.
const MODEL_UPSTREAM_URL =
  process.env.MODEL_UPSTREAM_URL ??
  "https://raw.githubusercontent.com/golamrabbii/3d-models/refs/heads/main";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",

  // Proxy large model assets through the Next origin so the client can fetch
  // them same-origin. `rewrites` streams the response without buffering, so
  // large GLBs are not held in memory. For production, point
  // MODEL_UPSTREAM_URL at a CORS-enabled CDN.
  async rewrites() {
    return [
      {
        source: "/models/:filename",
        destination: `${MODEL_UPSTREAM_URL}/:filename`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
