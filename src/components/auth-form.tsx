"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UtensilsCrossed } from "lucide-react";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/actions/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-base outline-none transition-colors placeholder:text-muted-foreground hover:border-white/20 focus-visible:border-primary focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm";

const labelClassName = "text-xs font-medium uppercase tracking-[0.1em] text-gray-300";

const hoverUnderlineClassName =
  "relative pb-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-bottom-right after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100 focus-visible:after:origin-bottom-left focus-visible:after:scale-x-100";

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return null;
}

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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const isSignin = mode === "signin";
  const submitLabel = isSignin ? "Sign in" : "Sign up";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextEmailError = validateEmail(String(formData.get("email") ?? ""));
    const nextPasswordError = validatePassword(String(formData.get("password") ?? ""));
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) event.preventDefault();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-5 flex items-center gap-2.5 sm:mb-8 lg:hidden">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">Intake</span>
      </div>

      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        Personal tracking, clearly explained
      </div>

      <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:mt-6 sm:text-6xl">
        {isSignin ? "Login" : "Create account"}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-gray-400">
        {isSignin ? "Sign in to continue your daily log." : "Start with your own goals. No automatic prescriptions."}
      </p>

      <form action={action} onSubmit={handleSubmit} noValidate className="mt-8 w-full max-w-xl sm:mt-10">
        <div className="grid gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="email" className={labelClassName}>
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={fieldClassName}
              aria-invalid={Boolean(emailError)}
              aria-describedby="email-error"
              onBlur={(event) => setEmailError(validateEmail(event.currentTarget.value))}
              onChange={(event) => {
                if (emailError) setEmailError(validateEmail(event.currentTarget.value));
              }}
            />
            <p id="email-error" role="alert" className="min-h-[1.1rem] text-sm font-medium text-red-400">
              {emailError}
            </p>
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
                className={cn(fieldClassName, "pr-10")}
                aria-invalid={Boolean(passwordError)}
                aria-describedby="password-error"
                onBlur={(event) => setPasswordError(validatePassword(event.currentTarget.value))}
                onChange={(event) => {
                  if (passwordError) setPasswordError(validatePassword(event.currentTarget.value));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p id="password-error" role="alert" className="min-h-[1.1rem] text-sm font-medium text-red-400">
              {passwordError}
            </p>
          </div>
        </div>

        <div className={state.message ? "mt-2" : undefined}>
          <FormMessage state={state} />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="mt-6 h-12 w-full text-xs uppercase tracking-[0.14em]"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {submitLabel}
            </span>
          ) : (
            submitLabel
          )}
        </Button>

        <p className="mt-4 text-center text-sm text-gray-400">
          {isSignin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignin ? "signup" : "signin")}
            className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {isSignin ? "Sign up" : "Sign in"}
          </button>
        </p>

        <div className="mt-5 space-y-2 text-center text-sm">
          <Link
            href="/demo"
            className={cn(
              "inline-block font-medium text-foreground focus-visible:outline-none",
              hoverUnderlineClassName,
            )}
          >
            Explore the public demo
          </Link>
          <p className="text-xs text-gray-400">No account required · Fictional data · Read-only</p>
        </div>
      </form>
    </div>
  );
}
