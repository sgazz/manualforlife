"use client";

import { RotatingPrompt } from "@/components/RotatingPrompt";

const INSPIRATION_EXAMPLES = [
  "Be kinder to yourself. You were learning.",
  "The version of you that got through it still knows the way.",
  "Not everything worth keeping has to be loud.",
  "You do not owe anyone your old pain.",
  "Rest is not giving up.",
];

type InspirationHintProps = {
  paused?: boolean;
};

export function InspirationHint({ paused = false }: InspirationHintProps) {
  return (
    <p className="typography-hint text-(--theme-muted)/58">
      Something like: &lsquo;
      <RotatingPrompt
        as="span"
        prompts={INSPIRATION_EXAMPLES}
        paused={paused}
        className="inline px-0 italic text-(--theme-muted)/68"
      />
      &rsquo;
    </p>
  );
}
