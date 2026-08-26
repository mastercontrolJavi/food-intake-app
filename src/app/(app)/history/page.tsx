import { DashboardView } from "@/components/dashboard/dashboard-view";
import { createClient, requireUserId } from "@/lib/supabase/server";
import { ensureProfile, getDayPageData } from "@/lib/data/day";
import { localDateInTimezone } from "@/lib/dates/timezone";
import { isValid, parseISO } from "date-fns";

export const metadata = { title: "History" };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createClient(); const userId = await requireUserId(); const profile = await ensureProfile(supabase, userId);
  const params = await searchParams; const requested = params.date ?? ""; const date = /^\d{4}-\d{2}-\d{2}$/.test(requested) && isValid(parseISO(requested)) ? requested : localDateInTimezone(new Date(), profile.timezone);
  return <DashboardView day={await getDayPageData(supabase, userId, date)} historyMode />;
}
