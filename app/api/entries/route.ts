import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("entries")
    .select("id, text, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 500 },
    );
  }

  return NextResponse.json({ entries: data }, { status: 200 });
}
