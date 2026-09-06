import { DashboardView } from "@/components/dashboard/dashboard-view";
import { GradientBackground } from "@/components/ui/almoayyed";
import { createPublicDemoSnapshot, getPublicDemoDayData } from "@/lib/demo/public-demo-data";

export default function DemoPage() {
  const snapshot = createPublicDemoSnapshot();
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <GradientBackground className="h-full w-full" />
      </div>
      <DashboardView day={getPublicDemoDayData(snapshot)} demoMode dateBounds={{ start: snapshot.startDate, end: snapshot.endDate }} />
    </div>
  );
}
