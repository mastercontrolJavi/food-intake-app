import { DashboardView } from "@/components/dashboard/dashboard-view";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { getDayPageData } from "@/lib/data/day";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const supabase = await createClient(); const userId = await requireUserId();
  return <DashboardView day={await getDayPageData(supabase, userId)} />;
}
