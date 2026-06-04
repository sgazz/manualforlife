import {
  ENTRY_PUBLIC_COLUMNS,
  ENTRY_PUBLIC_COLUMNS_LEGACY,
  isMissingToneColumnError,
} from "@/lib/entryColumns";
import { isValidEntryId } from "@/lib/normalizeEntry";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizeTone, type ToneValue } from "@/lib/tones";

export type PublicEntry = {
  id: string;
  text: string;
  created_at: string;
  signature: string | null;
  tone: ToneValue | null;
};

export { isValidEntryId } from "@/lib/normalizeEntry";

export async function fetchPublicEntryById(id: string): Promise<PublicEntry | null> {
  if (!isValidEntryId(id)) {
    return null;
  }

  let { data, error } = await supabaseServer
    .from("entries")
    .select(ENTRY_PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error && isMissingToneColumnError(error)) {
    ({ data, error } = await supabaseServer
      .from("entries")
      .select(ENTRY_PUBLIC_COLUMNS_LEGACY)
      .eq("id", id)
      .maybeSingle());
  }

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    text: typeof data.text === "string" ? data.text : "",
    created_at: typeof data.created_at === "string" ? data.created_at : "",
    signature: typeof data.signature === "string" ? data.signature : null,
    tone: normalizeTone(data.tone),
  };
}

export function buildTraceMetaDescription(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "A quiet trace left on manualfor.life.";
  }
  if (trimmed.length <= 160) {
    return trimmed;
  }
  return `${trimmed.slice(0, 157)}…`;
}
