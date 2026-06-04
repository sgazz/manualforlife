import { normalizeTone } from "@/lib/tones";
import type { Entry } from "@/types/ui";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeEntryRow(entry: {
  id: string;
  text?: unknown;
  created_at?: unknown;
  stars?: unknown;
  signature?: unknown;
  tone?: unknown;
}): Entry {
  return {
    id: entry.id,
    text: typeof entry.text === "string" ? entry.text : "",
    created_at:
      typeof entry.created_at === "string" ? entry.created_at : new Date().toISOString(),
    stars: typeof entry.stars === "number" ? entry.stars : 0,
    signature: typeof entry.signature === "string" ? entry.signature : null,
    tone: normalizeTone(entry.tone),
  };
}

export function isValidEntryId(value: string) {
  return UUID_PATTERN.test(value);
}
