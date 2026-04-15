import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request: Request) {
  const visitorId = request.headers.get("x-visitor-id")?.trim() ?? "";
  if (!isValidUuid(visitorId)) {
    return NextResponse.json({ error: "Missing visitor id." }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("entry_stars")
    .select(
      "starred_at, entries!inner(id, text, created_at, stars, signature)",
    )
    .eq("visitor_id", visitorId)
    .order("starred_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to load starred entries." }, { status: 500 });
  }

  const entries = (data ?? [])
    .flatMap((row) => (Array.isArray(row.entries) ? row.entries : [row.entries]))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      ...entry,
      stars: typeof entry.stars === "number" ? entry.stars : 0,
      signature: typeof entry.signature === "string" ? entry.signature : null,
    }));

  return NextResponse.json({ entries }, { status: 200 });
}
