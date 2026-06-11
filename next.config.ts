import path from "node:path";

import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const nextConfig: NextConfig = {
  // Parent folder has another lockfile (Documents/package-lock.json).
  outputFileTracingRoot: path.join(__dirname),
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [],
  },
};

export default withMDX(nextConfig);
