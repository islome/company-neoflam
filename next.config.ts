import type { NextConfig } from "next";

// Product photos uploaded in the 3D Studio live in Supabase Storage.
const supabaseImages = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`)]
  : [];

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
      ...supabaseImages,
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
