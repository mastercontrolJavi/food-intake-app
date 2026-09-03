import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { IntakeDial } from "@/components/intake-dial";
import { getClaims } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const claims = await getClaims();
  if (claims?.sub) redirect("/today");

  return (
    <main className="dark min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[1fr_1.15fr]">
      <VisualPanel />
      <div className="flex min-h-screen flex-col bg-card px-6 py-6 sm:px-12 sm:py-8 lg:px-16 lg:py-12">
        <AuthForm />
      </div>
    </main>
  );
}

function VisualPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div className="relative z-10 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">Intake</span>
      </div>
      <IntakeDial className="relative z-10 mx-auto size-56" />
      <p className="relative z-10 text-[0.7rem] tracking-[0.08em] text-muted-foreground">
        © Intake {new Date().getFullYear()} · Track with intention
      </p>
    </div>
  );
}
