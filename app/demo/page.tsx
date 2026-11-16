import type { Metadata } from "next";
import { Demo } from "@/components/demo";

export const metadata: Metadata = { title: "Try the demo · Nomad Expenses", robots: { index: false, follow: true } };

export default function DemoPage() {
  return <Demo />;
}
