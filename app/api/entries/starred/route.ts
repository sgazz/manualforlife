import { NextResponse } from "next/server";
import {
  isMissingToneColumnError,
  STARRED_ENTRY_EMBED_LEGACY,
  STARRED_ENTRY_EMBED_WITH_TONE,
} from "@/lib/entryColumns";
import { normalizeEntryRow } from "@/lib/normalizeEntry";
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

  type StarredRow = { entries?: unknown };

  const withTone = await supabaseServer
    .from("entry_stars")
    .select(STARRED_ENTRY_EMBED_WITH_TONE)
    .eq("visitor_id", visitorId)
    .order("starred_at", { ascending: false })
    .limit(50);

  let error = withTone.error;
  let rowsSource: StarredRow[] | null = withTone.data as StarredRow[] | null;

  if (error && isMissingToneColumnError(error)) {
    const legacy = await supabaseServer
      .from("entry_stars")
      .select(STARRED_ENTRY_EMBED_LEGACY)
      .eq("visitor_id", visitorId)
      .order("starred_at", { ascending: false })
      .limit(50);
    error = legacy.error;
    rowsSource = legacy.data as StarredRow[] | null;
  }

  if (error) {
    return NextResponse.json({ error: "Failed to load starred entries." }, { status: 500 });
  }

  const rows = rowsSource ?? [];

  const entries = rows
    .flatMap((row) => {
      const nested = row.entries;
      if (!nested) {
        return [];
      }
      return Array.isArray(nested) ? nested : [nested];
    })
    .filter((entry): entry is Parameters<typeof normalizeEntryRow>[0] =>
      Boolean(entry && typeof entry === "object" && "id" in entry),
    )
    .map((entry) => normalizeEntryRow(entry));

  return NextResponse.json({ entries }, { status: 200 });
}
