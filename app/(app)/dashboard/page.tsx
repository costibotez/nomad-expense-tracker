import { DashboardView } from "@/components/dashboard-view";
import { getSettings } from "@/lib/queries";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const country = typeof params.country === "string" ? params.country : "";
  const name = (await getSettings())?.name;
  return <DashboardView country={country} basePath="/dashboard" heading={name ? `Hi, ${name}` : "Overview"} />;
}
