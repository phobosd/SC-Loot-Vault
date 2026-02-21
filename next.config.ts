import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.web.app https://*.firebaseapp.com; img-src 'self' data: *;",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Access-Control-Allow-Private-Network",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
