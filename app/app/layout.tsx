import type { Metadata } from "next";
import { DEMO_MODE } from "@/lib/demo";

// A personal tracker stays out of search engines. Only the public live demo may be listed.
export const metadata: Metadata = { robots: { index: DEMO_MODE, follow: DEMO_MODE } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
