import type { FormEvent } from "react";
import Script from "next/script";

type InputBoxProps = {
  value: string;
  maxLength: number;
  isSubmitting: boolean;
  turnstileSiteKey?: string;
  hasTurnstileToken?: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function InputBox({
  value,
  maxLength,
  isSubmitting,
  turnstileSiteKey,
  hasTurnstileToken = false,
  onChange,
  onSubmit,
}: InputBoxProps) {
  const requiresTurnstile = Boolean(turnstileSiteKey);
  const isInvalid =
    value.trim().length === 0 ||
    value.length > maxLength ||
    (requiresTurnstile && !hasTurnstileToken);

  return (
    <form
      onSubmit={onSubmit}
      className="w-full space-y-4 rounded-2xl border bg-[color:var(--theme-surface)] p-5 backdrop-blur-md transition-all duration-400 sm:p-6"
      style={{
        borderColor: "var(--theme-border)",
        boxShadow: "var(--theme-shadow-strong), var(--theme-glow)",
      }}
    >
      <label htmlFor="entry-text" className="sr-only">
        Life lesson text
      </label>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <textarea
        id="entry-text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder="What is something you wish you knew earlier?"
        className="min-h-32 w-full resize-none rounded-xl border px-4 py-3 text-base text-[color:var(--theme-text)] outline-none transition duration-300 placeholder:text-[color:var(--theme-muted)] focus:ring-4"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "color-mix(in srgb, var(--theme-surface) 90%, white 10%)",
          boxShadow: "var(--theme-glow)",
        }}
      />
      {turnstileSiteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-action="submit"
            data-callback="onTurnstileSuccess"
          />
        </>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-[color:var(--theme-muted)] transition-colors duration-[400ms]">
          {value.length} / {maxLength}
        </span>
        <button
          type="submit"
          disabled={isInvalid || isSubmitting}
          className="rounded-full px-5 py-2 text-sm font-medium transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            backgroundColor: "var(--theme-accent)",
            color: "var(--theme-accent-contrast)",
            boxShadow:
              "0 0 0 1px var(--theme-accent-soft) inset, 0 8px 20px color-mix(in srgb, var(--theme-accent) 24%, transparent)",
          }}
        >
          {isSubmitting ? "Saving..." : "Leave a trace"}
        </button>
      </div>
    </form>
  );
}
