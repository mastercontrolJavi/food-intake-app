"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/state";
import { authErrorMessage, hasLeakedPasswordWarning } from "@/lib/auth/messages";

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) return { ok: false, message: "Enter a valid email and a password of at least 8 characters." };
  let leakedPassword = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: authErrorMessage(error, "signin") };
    leakedPassword = hasLeakedPasswordWarning(data.weakPassword);
  } catch (error) {
    return { ok: false, message: authErrorMessage(error, "signin") };
  }
  redirect(leakedPassword ? "/settings?security=leaked-password" : "/today");
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) return { ok: false, message: "Enter a valid email and a password of at least 8 characters." };
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, message: authErrorMessage(error, "signup") };
    signedIn = Boolean(data.session);
  } catch (error) {
    return { ok: false, message: authErrorMessage(error, "signup") };
  }
  if (signedIn) redirect("/settings?welcome=1");
  return { ok: true, message: "Check your email to confirm your account, then sign in." };
}

export async function updatePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, message: "Enter a password of at least 8 characters." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: authErrorMessage(error, "update") };
    return { ok: true, message: "Password updated. Your account is protected with the new password." };
  } catch (error) {
    return { ok: false, message: authErrorMessage(error, "update") };
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
