import { redirect } from "next/navigation";
import { Fraunces } from "next/font/google";
import { UtensilsCrossed } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { getClaims } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export default async function LoginPage() {
  const claims = await getClaims();
  if (claims?.sub) redirect("/today");

  return (
    <main
      className={`${fraunces.variable} dark min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[1fr_1.15fr]`}
    >
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
      <DiagonalLines className="absolute inset-0 h-full w-full text-foreground/[0.06]" />
      <div className="relative z-10 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">Intake</span>
      </div>
      <CompassMark className="relative z-10 mx-auto size-40 text-foreground/70" />
      <p className="relative z-10 text-[0.7rem] tracking-[0.08em] text-muted-foreground">
        © Intake {new Date().getFullYear()} · Track with intention
      </p>
    </div>
  );
}

function DiagonalLines({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CompassMark({ className }: { className?: string }) {
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const length = i % 2 === 0 ? 42 : 28;
    return { x2: 50 + length * Math.sin(angle), y2: 50 - length * Math.cos(angle) };
  });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {spokes.map((spoke, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={spoke.x2}
          y2={spoke.y2}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
