import type { NextConfig } from "next";

const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: SUPABASE_HOSTNAME
      ? [
          {
            protocol: "https",
            hostname: SUPABASE_HOSTNAME,
            pathname: "/storage/v1/object/public/site-media/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
