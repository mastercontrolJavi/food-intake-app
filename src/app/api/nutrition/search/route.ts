import { NextResponse } from "next/server";
import { getClaims } from "@/lib/supabase/server";
import { getNutritionProvider } from "@/lib/nutrition/usda";

export async function GET(request: Request) {
  const claims = await getClaims();
  if (!claims?.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) return NextResponse.json({ error: "Enter at least two characters." }, { status: 400 });
  const provider = getNutritionProvider();
  if (!provider) return NextResponse.json({ configured: false, results: [] }, { status: 503 });
  try {
    return NextResponse.json({ configured: true, results: await provider.search(query) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nutrition search failed." }, { status: 502 });
  }
}
