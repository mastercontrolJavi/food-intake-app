import Link from "next/link";
import { Check, LockKeyhole, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_GOAL_VALUES } from "@/lib/demo/build-demo-data";

export const metadata = { title: "Demo settings" };

const targets = [
  ["Calories", `${DEMO_GOAL_VALUES.calorie_target.toLocaleString()} kcal`],
  ["Protein", `${DEMO_GOAL_VALUES.protein_target_g} g`],
  ["Water", `${DEMO_GOAL_VALUES.water_target_ml.toLocaleString()} ml`],
  ["Steps", DEMO_GOAL_VALUES.step_target.toLocaleString()],
  ["Weekly workouts", String(DEMO_GOAL_VALUES.weekly_workout_target)],
  ["Fiber", `${DEMO_GOAL_VALUES.fiber_target_g} g`],
] as const;

export default function DemoSettingsPage() {
  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">Demo profile</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Goals and preferences</h1><p className="mt-2 max-w-2xl text-muted-foreground">This read-only profile shows how personal targets shape every score and insight.</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary" /> Active targets</CardTitle><CardDescription>Fictional targets used throughout the public demo.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{targets.map(([label, value]) => <div key={label} className="rounded-xl border bg-background/70 p-4"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="number-tabular mt-2 text-xl font-semibold">{value}</p></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Why settings matter</CardTitle><CardDescription>Intake measures alignment rather than prescribing a universal plan.</CardDescription></CardHeader><CardContent className="space-y-4"><ul className="space-y-3 text-sm text-muted-foreground"><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Effective-dated goals preserve historical context.</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Missing values remain unknown instead of becoming zero.</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Every insight has an explicit evidence threshold.</li></ul><Button asChild className="w-full"><Link href="/login"><LockKeyhole /> Create an account to personalize</Link></Button></CardContent></Card>
    </div>
  </div>;
}
