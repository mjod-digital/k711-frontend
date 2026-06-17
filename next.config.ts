import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  sassOptions: {
    // Современный Sass API (Next 16) использует loadPaths.
    // Позволяет писать `@use "breakpoints" as *;` без относительных путей.
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
};

export default nextConfig;
