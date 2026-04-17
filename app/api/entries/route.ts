import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 20;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const before = url.searchParams.get("before");

  let query = supabaseServer
    .from("entries")
    .select("id, text, created_at, stars, signature")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 500 },
    );
  }

  const normalizedEntries = (data ?? []).map((entry) => ({
    ...entry,
    stars: typeof entry.stars === "number" ? entry.stars : 0,
    signature: typeof entry.signature === "string" ? entry.signature : null,
  }));

  const nextCursor =
    normalizedEntries.length > 0
      ? normalizedEntries[normalizedEntries.length - 1].created_at
      : null;

  return NextResponse.json(
    {
      entries: normalizedEntries,
      nextCursor,
      hasMore: normalizedEntries.length === limit,
    },
    { status: 200 },
  );
}
