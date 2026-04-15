import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("entries")
    .select("id, text, created_at, stars")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 500 },
    );
  }

  const normalizedEntries = (data ?? []).map((entry) => ({
    ...entry,
    stars: typeof entry.stars === "number" ? entry.stars : 0,
  }));

  return NextResponse.json({ entries: normalizedEntries }, { status: 200 });
}
