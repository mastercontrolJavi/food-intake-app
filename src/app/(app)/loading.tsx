import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return <div className="space-y-6" aria-label="Loading"><Skeleton className="h-10 w-56" /><Skeleton className="h-56 w-full" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div></div>;
}
