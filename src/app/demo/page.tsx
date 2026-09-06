import { DashboardView } from "@/components/dashboard/dashboard-view";
import { createPublicDemoSnapshot, getPublicDemoDayData } from "@/lib/demo/public-demo-data";

export default function DemoPage() {
  const snapshot = createPublicDemoSnapshot();
  return <DashboardView day={getPublicDemoDayData(snapshot)} demoMode dateBounds={{ start: snapshot.startDate, end: snapshot.endDate }} />;
}
