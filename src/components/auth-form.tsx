"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UtensilsCrossed } from "lucide-react";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/actions/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { FormMessage } from "@/components/form-message";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-auto rounded-none border-0 border-b border-border/70 bg-transparent px-0 pb-2 pt-1 text-base focus-visible:border-b-primary focus-visible:ring-0 md:text-base dark:bg-transparent";

const labelClassName = "text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return <AuthModeForm key={mode} mode={mode} setMode={setMode} />;
}

function AuthModeForm({
  mode,
  setMode,
}: {
  mode: "signin" | "signup";
  setMode: (mode: "signin" | "signup") => void;
}) {
  const [state, action, pending] = useActionState(mode === "signin" ? signInAction : signUpAction, initialActionState);
  const [showPassword, setShowPassword] = useState(false);
  const isSignin = mode === "signin";
  const submitLabel = isSignin ? "Sign in" : "Sign up";

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5 flex items-center gap-2.5 sm:mb-8 lg:hidden">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">Intake</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Personal tracking, clearly explained
        </div>
        <button
          type="button"
          onClick={() => setMode(isSignin ? "signup" : "signin")}
          className="shrink-0 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {isSignin ? "Create an account" : "Sign in"}
        </button>
      </div>

      <h1 className="mt-4 text-5xl font-medium tracking-tight sm:mt-6 sm:text-6xl [font-family:var(--font-display)]">
        {isSignin ? "Login" : "Create account"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        {isSignin ? "Sign in to continue your daily log." : "Start with your own goals. No automatic prescriptions."}
      </p>

      <form action={action} className="mt-8 flex flex-1 flex-col sm:mt-10">
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className={labelClassName}>
              Email
            </Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className={fieldClassName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className={labelClassName}>
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignin ? "current-password" : "new-password"}
                minLength={8}
                required
                className={cn(fieldClassName, "pr-7")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-0 bottom-2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <FormMessage state={state} />
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-8 sm:gap-8 sm:pt-12">
          <div className="max-w-[16rem] space-y-2 text-sm">
            <Link
              href="/demo"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Explore the public demo
            </Link>
            <p className="text-xs text-muted-foreground">No account required · Fictional data · Read-only</p>
          </div>
          <InteractiveHoverButton
            type="submit"
            disabled={pending}
            className="h-12 w-full shrink-0 border-primary/40 bg-primary/10 px-7 text-[0.7rem] uppercase tracking-[0.14em] text-foreground shadow-lg shadow-primary/20 active:translate-y-px sm:w-auto sm:min-w-44"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {submitLabel}
              </span>
            ) : (
              submitLabel
            )}
          </InteractiveHoverButton>
        </div>
      </form>
    </div>
  );
}
