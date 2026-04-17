import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 20;

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidDateString(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const beforeCreatedAt = url.searchParams.get("beforeCreatedAt");
  const beforeId = url.searchParams.get("beforeId");
  const hasBeforeCreatedAt = typeof beforeCreatedAt === "string" && beforeCreatedAt.length > 0;
  const hasBeforeId = typeof beforeId === "string" && beforeId.length > 0;

  if (hasBeforeCreatedAt !== hasBeforeId) {
    return NextResponse.json(
      { error: "Both beforeCreatedAt and beforeId are required together." },
      { status: 400 },
    );
  }

  if (hasBeforeId && !isValidUuid(beforeId!)) {
    return NextResponse.json({ error: "Invalid beforeId." }, { status: 400 });
  }

  if (hasBeforeCreatedAt && !isValidDateString(beforeCreatedAt!)) {
    return NextResponse.json({ error: "Invalid beforeCreatedAt." }, { status: 400 });
  }

  let query = supabaseServer
    .from("entries")
    .select("id, text, created_at, stars, signature")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (hasBeforeCreatedAt && hasBeforeId) {
    query = query.or(
      `created_at.lt.${beforeCreatedAt!},and(created_at.eq.${beforeCreatedAt!},id.lt.${beforeId!})`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const normalizedEntries = pageRows.map((entry) => ({
    ...entry,
    stars: typeof entry.stars === "number" ? entry.stars : 0,
    signature: typeof entry.signature === "string" ? entry.signature : null,
  }));

  const nextCursor = hasMore && normalizedEntries.length > 0
    ? {
        beforeCreatedAt: normalizedEntries[normalizedEntries.length - 1].created_at,
        beforeId: normalizedEntries[normalizedEntries.length - 1].id,
      }
    : null;

  return NextResponse.json(
    {
      entries: normalizedEntries,
      nextCursor,
    },
    { status: 200 },
  );
}
