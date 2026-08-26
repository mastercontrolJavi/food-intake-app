import { DashboardView } from "@/components/dashboard/dashboard-view";
import { clampPublicDemoDate, createPublicDemoSnapshot, getPublicDemoDayData } from "@/lib/demo/public-demo-data";

export const metadata = { title: "Demo history" };

export default async function DemoHistoryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const snapshot = createPublicDemoSnapshot();
  const date = clampPublicDemoDate(snapshot, (await searchParams).date);
  return <DashboardView day={getPublicDemoDayData(snapshot, date)} historyMode demoMode dateBounds={{ start: snapshot.startDate, end: snapshot.endDate }} />;
}
