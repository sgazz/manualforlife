"use client";

import { TONES, type ToneValue } from "@/lib/tones";

type ToneSelectorProps = {
  value: ToneValue | null;
  onChange: (value: ToneValue | null) => void;
  subdued?: boolean;
};

export function ToneSelector({ value, onChange, subdued = false }: ToneSelectorProps) {
  return (
    <fieldset
      className={`space-y-2 transition-opacity duration-300 motion-reduce:transition-none ${
        subdued ? "opacity-80" : "opacity-100"
      }`}
    >
      <legend className="typography-hint text-(--theme-muted)/62">Tone</legend>
      <div className="ios-scroll-touch -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
        {TONES.map((tone) => {
          const isSelected = value === tone.value;
          return (
            <button
              key={tone.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : tone.value)}
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs tracking-wide transition-[color,background-color,border-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-1 motion-reduce:transition-none ${
                isSelected
                  ? "border-(--theme-accent-soft)/70 bg-(--theme-accent)/8 text-(--theme-text)/88"
                  : "border-(--theme-border)/35 bg-transparent text-(--theme-muted)/68 hover:border-(--theme-border)/55 hover:text-(--theme-muted)/82"
              }`}
            >
              {tone.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
