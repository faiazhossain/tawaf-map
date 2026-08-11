import type { NextConfig } from "next";

// Upstream host for large binary assets (e.g. the Masjid Al-Haram GLB) that
// live on a LAN asset server without CORS headers. Server-side only — must NOT
// be prefixed with NEXT_PUBLIC_. The browser fetches the same-origin proxy path
// (/models/<file>) and Next streams the response through, avoiding CORS.
const MODEL_UPSTREAM_URL = process.env.MODEL_UPSTREAM_URL ?? "http://192.168.1.200:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",

  // Proxy large model assets through the Next origin so the client can fetch
  // them same-origin (the LAN asset server sends no CORS headers). `rewrites`
  // streams the response without buffering, so a 231MB GLB is not held in
  // memory. For production, point MODEL_UPSTREAM_URL at a CORS-enabled CDN.
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
