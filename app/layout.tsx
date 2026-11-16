import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { FULL_NAME } from "@/lib/brand";
import { DEMO_MODE } from "@/lib/demo";
import "./globals.css";
import "./landing.css";

export const metadata: Metadata = {
  title: DEMO_MODE ? `${FULL_NAME}: live demo` : FULL_NAME,
  description: DEMO_MODE
    ? "Tap through a sample trip. Nomad Expenses tracks travel spending across countries and currencies on your own Vercel and Neon."
    : "Track travel spending across countries and currencies.",
  appleWebApp: { capable: true, title: "Expenses", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
