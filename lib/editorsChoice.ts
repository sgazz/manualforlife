export const EDITORS_CHOICE_TRACES = [
  "Most people aren't thinking about you nearly as much as you think.",
  "Call your parents more often.",
  "The fear lasts longer than the pain.",
] as const;

export type EditorsChoiceItem = {
  text: string;
  entryId: string | null;
  signature: string | null;
  tone: string | null;
  stars: number;
};

type ResolveEditorsChoiceOptions = {
  excludeTexts?: readonly string[];
};

export function resolveEditorsChoiceItems(
  entries: Array<{
    id: string;
    text: string;
    signature: string | null;
    tone: string | null;
    stars: number;
  }>,
  { excludeTexts = [] }: ResolveEditorsChoiceOptions = {},
): EditorsChoiceItem[] {
  const excluded = new Set(excludeTexts.map((text) => text.trim()));

  return EDITORS_CHOICE_TRACES.filter((text) => !excluded.has(text.trim())).map(
    (text) => {
      const match = entries.find((entry) => entry.text.trim() === text.trim());
      if (!match) {
        return {
          text,
          entryId: null,
          signature: null,
          tone: null,
          stars: 0,
        };
      }

      return {
        text: match.text,
        entryId: match.id,
        signature: match.signature,
        tone: match.tone,
        stars: match.stars,
      };
    },
  );
}
