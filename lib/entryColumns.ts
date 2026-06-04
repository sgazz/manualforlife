/** PostgREST select fragments for `entries`. */

export const ENTRY_LIST_COLUMNS = "id, text, created_at, stars, signature, tone";
export const ENTRY_LIST_COLUMNS_LEGACY = "id, text, created_at, stars, signature";

export const ENTRY_PUBLIC_COLUMNS = "id, text, created_at, signature, tone";
export const ENTRY_PUBLIC_COLUMNS_LEGACY = "id, text, created_at, signature";

export const STARRED_ENTRY_EMBED_WITH_TONE =
  "starred_at, entries!inner(id, text, created_at, stars, signature, tone)";
export const STARRED_ENTRY_EMBED_LEGACY =
  "starred_at, entries!inner(id, text, created_at, stars, signature)";

export function isMissingToneColumnError(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  if (!error) {
    return false;
  }
  const message = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  if (code === "42703") {
    return true;
  }
  return (
    message.includes("tone") &&
    (message.includes("does not exist") ||
      message.includes("could not find") ||
      message.includes("schema cache"))
  );
}
