import { DashboardView } from "@/components/dashboard-view";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const country = typeof params.country === "string" ? params.country : "";
  return <DashboardView country={country} basePath="/dashboard" heading="Overview" />;
}
