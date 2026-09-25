import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { STREAMING_ENABLED } from "./src/lib/streaming/flag";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss: ws: http://localhost:* http://127.0.0.1:*",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Accept-CH", value: "Sec-CH-Prefers-Color-Scheme" },
  { key: "Vary", value: "Sec-CH-Prefers-Color-Scheme" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "prisma", "src/generated/prisma"],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    const toLive = [
      { source: "/:locale(ar|en)/tv-guide", destination: "/:locale/live", permanent: false },
      { source: "/:locale(ar|en)/tv-guide/:path*", destination: "/:locale/live", permanent: false },
      { source: "/:locale(ar|en)/video", destination: "/:locale/videos", permanent: false },
      { source: "/:locale(ar|en)/video/:path*", destination: "/:locale/videos", permanent: false },
    ];
    if (STREAMING_ENABLED) return toLive;
    return [
      ...toLive,
      { source: "/:locale(ar|en)/watch", destination: "/:locale/live", permanent: false },
      { source: "/:locale(ar|en)/watch/:path*", destination: "/:locale/live", permanent: false },
      { source: "/:locale(ar|en)/vod", destination: "/:locale/live", permanent: false },
      { source: "/:locale(ar|en)/vod/:path*", destination: "/:locale/live", permanent: false },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
