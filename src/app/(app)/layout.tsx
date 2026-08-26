import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient, getClaims } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/data/day";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const claims = await getClaims();
  if (!claims?.sub) redirect("/login");
  const supabase = await createClient();
  const profile = await ensureProfile(supabase, claims.sub);
  return <AppShell displayName={profile.display_name} email={String(claims.email ?? "")}>{children}</AppShell>;
}
