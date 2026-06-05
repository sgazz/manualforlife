import type { Entry } from "@/types/ui";

export type MostSavedPeriod = "today" | "week" | "month" | "year";

export const MOST_SAVED_DEFAULT_PERIOD: MostSavedPeriod = "week";
export const MOST_SAVED_LIMIT = 6;

export const MOST_SAVED_PERIOD_OPTIONS: ReadonlyArray<{
  value: MostSavedPeriod;
  label: string;
}> = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

type SelectMostSavedOptions = {
  excludeEntryIds?: string[];
  limit?: number;
  now?: Date;
};

function startOfLocalDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getMostSavedPeriodStart(
  period: MostSavedPeriod,
  now: Date = new Date(),
): Date {
  const start = startOfLocalDay(now);

  if (period === "today") {
    return start;
  }

  if (period === "week") {
    start.setDate(start.getDate() - 6);
    return start;
  }

  if (period === "month") {
    start.setDate(start.getDate() - 29);
    return start;
  }

  start.setDate(start.getDate() - 364);
  return start;
}

export function entryMatchesMostSavedPeriod(
  entry: Entry,
  period: MostSavedPeriod,
  now: Date = new Date(),
): boolean {
  const created = new Date(entry.created_at);
  if (Number.isNaN(created.getTime())) {
    return false;
  }

  return created.getTime() >= getMostSavedPeriodStart(period, now).getTime();
}

export function compareMostSavedEntries(left: Entry, right: Entry): number {
  if (right.stars !== left.stars) {
    return right.stars - left.stars;
  }

  const leftTime = new Date(left.created_at).getTime();
  const rightTime = new Date(right.created_at).getTime();
  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return right.id.localeCompare(left.id);
}

export function selectMostSaved(
  entries: Entry[],
  period: MostSavedPeriod = MOST_SAVED_DEFAULT_PERIOD,
  {
    excludeEntryIds = [],
    limit = MOST_SAVED_LIMIT,
    now = new Date(),
  }: SelectMostSavedOptions = {},
): Entry[] {
  const excludedIds = new Set(excludeEntryIds);

  const candidates = entries.filter((entry) => {
    if (excludedIds.has(entry.id)) {
      return false;
    }
    if (entry.stars <= 0) {
      return false;
    }
    return entryMatchesMostSavedPeriod(entry, period, now);
  });

  return [...candidates].sort(compareMostSavedEntries).slice(0, limit);
}

export function mergeEntriesById(...groups: Entry[][]): Entry[] {
  const merged = new Map<string, Entry>();
  for (const group of groups) {
    for (const entry of group) {
      merged.set(entry.id, entry);
    }
  }
  return [...merged.values()];
}
