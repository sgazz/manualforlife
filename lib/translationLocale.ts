export const SUPPORTED_TRANSLATION_LANGUAGES = ["en", "de", "fr", "es", "sr"] as const;

export type SupportedTranslationLang = (typeof SUPPORTED_TRANSLATION_LANGUAGES)[number];

const SUPPORTED_SET = new Set<string>(SUPPORTED_TRANSLATION_LANGUAGES);

export function coerceToSupportedTranslationLang(
  tag: string | null | undefined,
): SupportedTranslationLang {
  if (!tag || typeof tag !== "string") {
    return "en";
  }
  const primary = tag.trim().toLowerCase().split("-")[0];
  if (!primary) {
    return "en";
  }
  if (SUPPORTED_SET.has(primary)) {
    return primary as SupportedTranslationLang;
  }
  return "en";
}

/**
 * First browser preference whose primary language tag is in the MVP set.
 * Returns `null` when none match — callers should not offer on-demand translation.
 */
export function readNavigatorPreferredTranslationLang(): SupportedTranslationLang | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  const list =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  for (const raw of list) {
    const primary = raw.trim().toLowerCase().split("-")[0];
    if (primary && SUPPORTED_SET.has(primary)) {
      return primary as SupportedTranslationLang;
    }
  }
  return null;
}

/**
 * Very lightweight hint when the trace already “looks like” a supported language.
 * Conservative: unknown → `null` (still offer translation).
 */
export function getLikelyTraceLanguageHint(text: string): SupportedTranslationLang | null {
  const t = text.trim();
  if (!t) {
    return null;
  }

  if (/[\u0400-\u04FF]/.test(t)) {
    return "sr";
  }

  if (/[ñÑ]|\u00bf|\u00a1/.test(t)) {
    return "es";
  }

  if (/[äöüÄÖÜß]/.test(t)) {
    return "de";
  }

  if (/[àâèéêëîïôùûüÿçœæ]/i.test(t)) {
    return "fr";
  }

  // ASCII-only traces: treat as likely English (Latin script without other-language markers above).
  if (/^[\s\w.,'"!?;:()-]*$/i.test(t) && /[a-z]/i.test(t)) {
    return "en";
  }

  return null;
}

export function isSupportedTranslationLang(value: unknown): value is SupportedTranslationLang {
  return typeof value === "string" && SUPPORTED_SET.has(value);
}
