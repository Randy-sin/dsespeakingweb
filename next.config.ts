import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      {
        source: "/rooms/:path*",
        destination: "/practice/group-discussion",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
