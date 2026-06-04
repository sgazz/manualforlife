"use client";

import { TONE_FILTER_ALL, TONE_FILTER_OPTIONS, type ToneFilterValue } from "@/lib/tones";

type ToneFilterProps = {
  value: ToneFilterValue;
  onChange: (value: ToneFilterValue) => void;
};

export function ToneFilter({ value, onChange }: ToneFilterProps) {
  return (
    <div
      role="group"
      aria-label="Browse traces by tone"
      className="ios-scroll-touch -mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
    >
      {TONE_FILTER_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.6875rem] tracking-wide transition-[color,background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-1 motion-reduce:transition-none ${
              isSelected
                ? "border-(--theme-accent-soft)/65 bg-(--theme-accent)/8 text-(--theme-text)/85"
                : "border-transparent bg-transparent text-(--theme-muted)/62 hover:text-(--theme-muted)/78"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { TONE_FILTER_ALL };
