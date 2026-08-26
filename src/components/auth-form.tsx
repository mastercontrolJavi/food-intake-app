"use client";

import { useActionState, useState } from "react";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/actions/state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(mode === "signin" ? signInAction : signUpAction, initialActionState);
  return <Card className="w-full max-w-md border-black/5 shadow-xl shadow-primary/5"><CardHeader className="space-y-3"><div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Personal tracking, clearly explained</div><CardTitle className="text-3xl tracking-tight">{mode === "signin" ? "Welcome back" : "Create your Intake"}</CardTitle><CardDescription>{mode === "signin" ? "Sign in to continue your daily log." : "Start with your own goals. No automatic prescriptions."}</CardDescription></CardHeader><CardContent><form action={action} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required /></div><FormMessage state={state} /><Button size="lg" className="h-11 w-full" disabled={pending}>{pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button></form><div className="mt-6 text-center text-sm text-muted-foreground">{mode === "signin" ? "New to Intake?" : "Already have an account?"} <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button></div></CardContent></Card>;
}
