import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { db } from "@/lib/db";
import { shareLinks } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Trip spending",
  // Keep the secret link out of the address sent to other sites.
  referrer: "no-referrer",
};

export default async function SharePage({ params, searchParams }: PageProps<"/share/[token]">) {
  const { token } = await params;
  const [link] = /^[A-Za-z0-9_-]{20,64}$/.test(token)
    ? await db.select({ id: shareLinks.id }).from(shareLinks).where(eq(shareLinks.token, token))
    : [];
  if (!link) notFound();

  const query = await searchParams;
  const country = typeof query.country === "string" ? query.country : "";

  return (
    <DashboardView
      country={country}
      basePath={`/share/${token}`}
      heading="Trip spending"
      intro="A read-only view of the trip totals in euro."
    />
  );
}
