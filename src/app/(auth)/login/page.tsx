import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getClaims } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const claims = await getClaims();
  if (claims?.sub) redirect("/today");
  return <main className="grid min-h-screen place-items-center px-4 py-12"><div className="absolute left-8 top-8 flex items-center gap-2 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">I</span>Intake</div><AuthForm /></main>;
}
