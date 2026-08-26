import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";

export default async function HomePage() {
  const claims = await getClaims();
  redirect(claims?.sub ? "/today" : "/login");
}

