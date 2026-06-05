import type { Entry } from "@/types/ui";

export function getUtcDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86400000);
}

export function getDailyTraceIndex(date: Date, count: number): number {
  if (count <= 0) {
    return -1;
  }

  const dayOfYear = getUtcDayOfYear(date);
  const year = date.getUTCFullYear();
  return (dayOfYear + year) % count;
}

export function sortEntriesForDailyTrace(entries: Entry[]): Entry[] {
  return [...entries].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return left.id.localeCompare(right.id);
  });
}

export function selectDailyTrace(
  entries: Entry[],
  date: Date = new Date(),
): Entry | null {
  const pool = sortEntriesForDailyTrace(entries);
  if (pool.length === 0) {
    return null;
  }

  const index = getDailyTraceIndex(date, pool.length);
  if (index < 0) {
    return null;
  }

  return pool[index] ?? null;
}

export function formatDailyTraceSelectionDate(
  date: Date = new Date(),
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
