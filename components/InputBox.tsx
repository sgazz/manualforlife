import { useMemo, useState, type FormEvent } from "react";
import Script from "next/script";
import { useFocusState } from "@/hooks/useFocusState";
import { usePlaceholderRotation } from "@/hooks/usePlaceholderRotation";

type InputBoxProps = {
  value: string;
  signature: string;
  maxLength: number;
  isSubmitting: boolean;
  turnstileSiteKey?: string;
  hasTurnstileToken?: boolean;
  onChange: (value: string) => void;
  onSignatureChange: (value: string) => void;
  onSubmit: (form: HTMLFormElement) => Promise<boolean>;
  onFocusChange?: (isFocused: boolean) => void;
};

const SIGNATURE_REVEAL_MIN_LENGTH = 20;
const SIGNATURE_MAX_LENGTH = 30;
const SUBMIT_DELAY_MS = 240;
const WRITING_PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  reflection: [
    "What changed the way you see life?",
    "What thought stayed with you the longest?",
    "When did you feel most present lately?",
  ],
  advice: [
    "What would you tell your younger self?",
    "What advice should never be rushed?",
    "What is worth repeating to someone lost?",
  ],
  truth: [
    "One truth you learned the hard way.",
    "What became true only after time passed?",
    "What truth did you resist before accepting?",
  ],
  warning: [
    "What quiet mistake costs more than it seems?",
    "What should people stop ignoring?",
    "What warning would you leave for the next person?",
  ],
  simplicity: [
    "Something worth remembering.",
    "What became easier when you let go?",
    "What stayed with you?",
  ],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function InputBox({
  value,
  signature,
  maxLength,
  isSubmitting,
  turnstileSiteKey,
  hasTurnstileToken = false,
  onChange,
  onSignatureChange,
  onSubmit,
  onFocusChange,
}: InputBoxProps) {
  const { isFocused, onFocus, onBlur } = useFocusState();
  const [showSignatureInput, setShowSignatureInput] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const requiresTurnstile = Boolean(turnstileSiteKey);
  const normalizedValue = value.trim();
  const hasText = normalizedValue.length > 0;
  const isPromptFloating = isFocused || hasText;
  const { prompt, isVisible } = usePlaceholderRotation({
    promptsByCategory: WRITING_PROMPTS_BY_CATEGORY,
    minIntervalMs: 5600,
    maxIntervalMs: 6800,
    fadeOutDurationMs: 620,
    fadeInDurationMs: 620,
    paused: isFocused || hasText,
  });
  const canRevealSignature = normalizedValue.length > SIGNATURE_REVEAL_MIN_LENGTH;

  const isInvalid =
    normalizedValue.length === 0 ||
    value.length > maxLength ||
    (requiresTurnstile && !hasTurnstileToken);

  const lengthFeedback = useMemo(() => {
    if (value.length < 50) {
      return {
        color: "var(--theme-muted)",
        label: "Too short?",
      };
    }
    if (value.length <= 120) {
      return {
        color: "var(--theme-accent)",
        label: "Good length",
      };
    }
    return {
      color: "var(--theme-error-text)",
      label: "Refine it",
    };
  }, [value.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isInvalid || isSubmitting) {
      return;
    }
    const form = event.currentTarget;
    await delay(SUBMIT_DELAY_MS);
    const wasSuccessful = await onSubmit(form);
    if (wasSuccessful) {
      setShowSavedFeedback(true);
      window.setTimeout(() => {
        onChange("");
        onSignatureChange("");
        setShowSavedFeedback(false);
      }, 1700);
    }
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-400 motion-reduce:transition-none ${
          isFocused && value.length > 0 ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--theme-text) 12%, transparent)",
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full space-y-5 rounded-2xl bg-(--theme-surface) p-6 transition-all duration-400 motion-reduce:transition-none sm:p-7"
        style={{
          boxShadow: isFocused ? "0 12px 32px rgba(0, 0, 0, 0.07)" : "var(--theme-shadow-soft)",
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
        <div className="relative space-y-2">
          <p
            aria-hidden="true"
            className={`typography-ui px-2 text-(--theme-muted)/70 transition-opacity duration-620 ease-in-out motion-reduce:transition-none ${
              isPromptFloating ? "opacity-55" : "opacity-100"
            } ${isVisible || isPromptFloating ? "opacity-100" : "opacity-0"} ${
              !isPromptFloating
                ? "motion-safe:animate-[promptDreamyBlink_9s_ease-in-out_infinite]"
                : ""
            }`}
          >
            {prompt}
          </p>
          <textarea
            id="entry-text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => {
              onFocus();
              onFocusChange?.(true);
            }}
            onBlur={() => {
              onBlur();
              onFocusChange?.(false);
            }}
            maxLength={maxLength}
            className="typography-ui min-h-40 w-full resize-none rounded-xl border-b px-6 py-5 text-lg leading-8 text-(--theme-text) outline-none transition duration-300 focus:ring-0 motion-reduce:transition-none"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-border) 55%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--theme-surface) 96%, white 4%)",
              boxShadow: isFocused
                ? "inset 0 -2px 0 color-mix(in srgb, var(--theme-accent) 35%, transparent)"
                : "inset 0 -1px 0 color-mix(in srgb, var(--theme-border) 45%, transparent)",
            }}
          />
        </div>

        <p className="typography-hint text-(--theme-muted)/75">
          Keep it simple. One idea is enough.
        </p>

        <div
          className={`overflow-hidden transition-all duration-300 motion-reduce:transition-none ${
            canRevealSignature ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {!showSignatureInput || !canRevealSignature ? (
            <button
              type="button"
              disabled={!canRevealSignature}
              onClick={() => setShowSignatureInput(true)}
              title="Add signature"
              className="text-xs text-(--theme-muted)/80 underline decoration-transparent transition hover:decoration-current disabled:cursor-default disabled:no-underline"
            >
              Would you like to sign it?
            </button>
          ) : (
            <input
              type="text"
              name="signature"
              value={signature}
              onChange={(event) =>
                onSignatureChange(event.target.value.slice(0, SIGNATURE_MAX_LENGTH))
              }
              maxLength={SIGNATURE_MAX_LENGTH}
              placeholder="Your name (optional)"
              className="typography-ui w-full rounded-lg border px-3 py-2 text-sm text-(--theme-text) outline-none transition placeholder:text-(--theme-muted)/70 focus:ring-2 focus:ring-(--theme-accent-soft)"
              style={{
                borderColor: "color-mix(in srgb, var(--theme-border) 75%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, white 6%)",
              }}
            />
          )}
        </div>

        {value.trim().length > 0 ? (
          <blockquote
            className="rounded-xl border px-4 py-3 text-center italic"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-border) 75%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--theme-surface) 90%, white 10%)",
              color: "color-mix(in srgb, var(--theme-text) 90%, var(--theme-muted) 10%)",
            }}
          >
            <p>&ldquo;{value.trim()}&rdquo;</p>
            {signature.trim().length > 0 ? (
              <footer className="typography-signature mt-2 not-italic text-(--theme-muted)">
                &mdash; {signature.trim()}
              </footer>
            ) : null}
          </blockquote>
        ) : null}

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
          <span
            title={`${Math.max(0, maxLength - value.length)} characters remaining (${value.length}/${maxLength})`}
            className="text-sm transition-colors duration-300"
            style={{ color: lengthFeedback.color }}
          >
            {value.length} / {maxLength} - {lengthFeedback.label}
          </span>
          <button
            type="submit"
            disabled={isInvalid || isSubmitting}
            title={
              isSubmitting
                ? "Saving your trace..."
                : isInvalid
                  ? "Enter a trace to submit"
                  : "Submit trace"
            }
            className={`rounded-full px-5 py-2 text-sm font-medium transition duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:hover:brightness-100 ${
              isInvalid || isSubmitting ? "opacity-45" : "opacity-100"
            }`}
            style={{
              backgroundColor: "color-mix(in srgb, var(--theme-accent) 84%, #f8ecdb 16%)",
              color: "color-mix(in srgb, var(--theme-accent-contrast) 90%, #fff5e8 10%)",
              boxShadow: "0 0 0 1px color-mix(in srgb, var(--theme-accent-soft) 65%, transparent) inset",
            }}
          >
            {isSubmitting ? "Saving..." : "Leave a trace"}
          </button>
        </div>

        <p
          aria-live="polite"
          className={`text-center text-xs text-(--theme-muted) transition-opacity duration-300 ${
            showSavedFeedback ? "opacity-100" : "opacity-0"
          }`}
        >
          Saved for the future.
        </p>
      </form>
    </div>
  );
}
