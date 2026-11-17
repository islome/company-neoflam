import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    globalNotFound: true,
  },
  images: {
    // Brand imagery is served from the Neoflam global site for now.
    // Swap to local files in /public (or Supabase Storage) before launch.
    remotePatterns: [
      new URL("https://neoflam.com/en/img/**"),
      new URL("https://neoflam.com/upload/**"),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
