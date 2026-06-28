import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  sassOptions: {
    // Современный Sass API (Next 16) использует loadPaths.
    // Позволяет писать `@use "breakpoints" as *;` без относительных путей.
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
  images: {
    // Планировки квартир приходят из CRM (внешний S3).
    remotePatterns: [
      { protocol: "https", hostname: "s3.mastertel.ru" },
      { protocol: "https", hostname: "www.klimashkina711.ru" },
    ],
  },
};

export default nextConfig;
