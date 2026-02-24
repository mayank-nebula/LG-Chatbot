import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "letstalksupplychain.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },

  output: "standalone",

  // --- ADDED SEO HEADERS HERE ---
  async headers() {
    return [
      {
        // 1. "noindex, nofollow" for the 9 legacy links + admin
        source: "/:path(landing-page-v1|test|slider-demo|work-with-us-3|work-with-us-2|practice-page|media-kit|media-kit-full|mediakit|admin)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        // 2. "noindex, follow" for legacy disallowed pages (Cart, Thank you, Checkout)
        source: "/:path(cart|checkout|thank-you)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, follow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
