import type { NextConfig } from "next";
import { routes } from "./lib/routes";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: routes.overview, permanent: true },
      { source: "/expenses/:path*", destination: `${routes.expenses}/:path*`, permanent: true },
      { source: "/trip", destination: routes.trip, permanent: true },
      { source: "/login", destination: routes.login, permanent: true },
      { source: "/setup", destination: routes.setup, permanent: true },
    ];
  },
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
