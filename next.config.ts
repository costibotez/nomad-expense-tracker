import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { routes } from "./lib/routes";

// Read here directly: next.config runs before the app's modules.
const DEMO_MODE = process.env.DEMO_MODE === "1";
const DEMO_AGENT = DEMO_MODE && process.env.NEXT_PUBLIC_DEMO_AGENT === "1";

// The app needs no camera, microphone or location.
const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=()";

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
  async headers() {
    // The demo guide's voice input needs the microphone, on the live demo's
    // /app screens only. Listed after the global rule so its value wins there
    // (Next applies the last matching header with the same key).
    const demoMic = DEMO_AGENT
      ? [routes.app, `${routes.app}/:path*`].map((source) => ({
          source,
          headers: [{ key: "Permissions-Policy", value: PERMISSIONS_POLICY.replace("microphone=()", "microphone=(self)") }],
        }))
      : [];
    return [{ source: "/(.*)", headers: [{ key: "Permissions-Policy", value: PERMISSIONS_POLICY }] }, ...demoMic];
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

// Vercel BotID (bot checks on the demo guide's endpoints) adds rewrites to
// Vercel's challenge service. Only the live demo uses it, so a personal
// install never carries routes to a third party.
export default DEMO_MODE ? withBotId(nextConfig) : nextConfig;
