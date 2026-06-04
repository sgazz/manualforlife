export const TONE_FILTER_ALL = "all" as const;

export const TONE_VALUES = [
  "love",
  "courage",
  "regret",
  "work",
  "loss",
  "gratitude",
  "other",
] as const;

export type ToneValue = (typeof TONE_VALUES)[number];
export type ToneFilterValue = typeof TONE_FILTER_ALL | ToneValue;

export const TONES: ReadonlyArray<{ value: ToneValue; label: string }> = [
  { value: "love", label: "Love" },
  { value: "courage", label: "Courage" },
  { value: "regret", label: "Regret" },
  { value: "work", label: "Work" },
  { value: "loss", label: "Loss" },
  { value: "gratitude", label: "Gratitude" },
  { value: "other", label: "Other" },
];

export const TONE_FILTER_OPTIONS: ReadonlyArray<{ value: ToneFilterValue; label: string }> = [
  { value: TONE_FILTER_ALL, label: "All" },
  ...TONES,
];

export function isToneValue(value: unknown): value is ToneValue {
  return typeof value === "string" && (TONE_VALUES as readonly string[]).includes(value);
}

export function normalizeTone(value: unknown): ToneValue | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return isToneValue(normalized) ? normalized : null;
}

export function getToneLabel(value: string | null | undefined): string | null {
  if (!value || !isToneValue(value)) {
    return null;
  }
  return TONES.find((tone) => tone.value === value)?.label ?? null;
}

export function entryMatchesToneFilter(
  entry: { tone: ToneValue | null },
  filter: ToneFilterValue,
): boolean {
  if (filter === TONE_FILTER_ALL) {
    return true;
  }
  return entry.tone === filter;
}
