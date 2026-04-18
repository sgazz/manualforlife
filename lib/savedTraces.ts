import type { Entry } from "@/types/ui";

export const SAVED_TRACES_STORAGE_KEY = "manualforlife:saved-traces";

export type SavedTrace = {
  id: string;
  text: string;
  signature: string | null;
  created_at: string;
  stars: number;
  saved_at: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidSavedTrace(value: unknown): value is SavedTrace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.text === "string" &&
    (row.signature === null || typeof row.signature === "string") &&
    typeof row.created_at === "string" &&
    typeof row.stars === "number" &&
    Number.isFinite(row.stars) &&
    typeof row.saved_at === "string"
  );
}

function parseStored(raw: string | null): SavedTrace[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidSavedTrace);
  } catch {
    return [];
  }
}

export function sortSavedTracesBySavedAt(traces: SavedTrace[]): SavedTrace[] {
  return [...traces].sort(
    (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
  );
}

/** Writes the full list (sorted by saved_at desc). Browser-only. */
export function writeStoredSavedTraces(traces: SavedTrace[]): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(
      SAVED_TRACES_STORAGE_KEY,
      JSON.stringify(sortSavedTracesBySavedAt(traces)),
    );
  } catch {
    /* quota / private mode */
  }
}

export function getSavedTraces(): SavedTrace[] {
  if (!canUseStorage()) {
    return [];
  }
  try {
    return sortSavedTracesBySavedAt(
      parseStored(window.localStorage.getItem(SAVED_TRACES_STORAGE_KEY)),
    );
  } catch {
    return [];
  }
}

export function saveTrace(trace: SavedTrace): void {
  if (!canUseStorage()) {
    return;
  }
  const current = parseStored(window.localStorage.getItem(SAVED_TRACES_STORAGE_KEY));
  const next = current.filter((t) => t.id !== trace.id).concat(trace);
  writeStoredSavedTraces(next);
}

export function removeSavedTrace(id: string): void {
  if (!canUseStorage()) {
    return;
  }
  const current = parseStored(window.localStorage.getItem(SAVED_TRACES_STORAGE_KEY));
  writeStoredSavedTraces(current.filter((t) => t.id !== id));
}

export function isTraceSaved(id: string): boolean {
  return getSavedTraces().some((t) => t.id === id);
}

/** Returns true if the trace is saved after the operation. */
export function toggleSavedTrace(trace: SavedTrace): boolean {
  if (!canUseStorage()) {
    return true;
  }
  try {
    const current = parseStored(window.localStorage.getItem(SAVED_TRACES_STORAGE_KEY));
    if (current.some((t) => t.id === trace.id)) {
      writeStoredSavedTraces(current.filter((t) => t.id !== trace.id));
      return false;
    }
    writeStoredSavedTraces([...current.filter((t) => t.id !== trace.id), trace]);
    return true;
  } catch {
    return true;
  }
}

export function buildSavedTraceFromEntry(entry: Entry, stars: number): SavedTrace {
  return {
    id: entry.id,
    text: entry.text,
    signature: entry.signature,
    created_at: entry.created_at,
    stars,
    saved_at: new Date().toISOString(),
  };
}

export function savedTraceToEntry(saved: SavedTrace): Entry {
  return {
    id: saved.id,
    text: saved.text,
    signature: saved.signature,
    created_at: saved.created_at,
    stars: saved.stars,
  };
}
