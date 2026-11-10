import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nomad Expenses",
    short_name: "Expenses",
    description: "Track travel spending across countries and currencies.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f2",
    theme_color: "#2a78d6",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
