const MAX_LENGTH = 175;

const BLOCKED_KEYWORDS = [
  "spam",
  "scam",
  "viagra",
  "casino",
  "porn",
] as const;

type ValidationSuccess = {
  success: true;
  normalizedText: string;
};

type ValidationFailure = {
  success: false;
  error: string;
  reason: "missing_text" | "empty_text" | "too_long" | "profanity";
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function validateEntryText(input: unknown): ValidationResult {
  if (typeof input !== "string") {
    return { success: false, error: "Invalid input", reason: "missing_text" };
  }

  const normalizedText = input.trim().replace(/\s+/g, " ");
  if (!normalizedText) {
    return { success: false, error: "Invalid input", reason: "empty_text" };
  }

  if (normalizedText.length > MAX_LENGTH) {
    return { success: false, error: "Invalid input", reason: "too_long" };
  }

  const lower = normalizedText.toLowerCase();
  const hasBlockedKeyword = BLOCKED_KEYWORDS.some((keyword) =>
    lower.includes(keyword),
  );

  if (hasBlockedKeyword) {
    return { success: false, error: "Invalid input", reason: "profanity" };
  }

  return { success: true, normalizedText };
}

export const ENTRY_MAX_LENGTH = MAX_LENGTH;
