import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lab parts compare a folder with no agent memory against one with CLAUDE.md, so Next must not write AGENTS.md.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
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
