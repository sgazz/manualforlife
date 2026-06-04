import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { count, error } = await supabaseServer
    .from("entries")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load trace count." },
      { status: 500 },
    );
  }

  return NextResponse.json({ count: count ?? 0 }, { status: 200 });
}
