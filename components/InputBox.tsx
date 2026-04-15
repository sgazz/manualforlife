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
      className="w-full space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-colors sm:p-6"
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
        className="min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-base text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
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
        <span className="text-sm text-slate-500">
          {value.length} / {maxLength}
        </span>
        <button
          type="submit"
          disabled={isInvalid || isSubmitting}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition duration-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Saving..." : "Leave a trace"}
        </button>
      </div>
    </form>
  );
}
