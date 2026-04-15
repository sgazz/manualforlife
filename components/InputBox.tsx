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
};

const SIGNATURE_REVEAL_MIN_LENGTH = 20;
const SIGNATURE_MAX_LENGTH = 30;
const SUBMIT_DELAY_MS = 240;
const WRITING_PROMPTS = [
  "What changed the way you see life?",
  "What would you tell your younger self?",
  "One truth you learned the hard way.",
  "Something worth remembering.",
  "What stayed with you?",
];

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
}: InputBoxProps) {
  const { isFocused, onFocus, onBlur } = useFocusState();
  const { prompt, isVisible } = usePlaceholderRotation({ prompts: WRITING_PROMPTS });
  const [showSignatureInput, setShowSignatureInput] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const requiresTurnstile = Boolean(turnstileSiteKey);
  const normalizedValue = value.trim();
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
        setShowSavedFeedback(false);
      }, 1600);
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
          backgroundColor: "color-mix(in srgb, var(--theme-text) 8%, transparent)",
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full space-y-4 rounded-2xl border bg-[color:var(--theme-surface)] p-5 backdrop-blur-md transition-all duration-400 motion-reduce:transition-none sm:p-6"
        style={{
          borderColor: "var(--theme-border)",
          boxShadow: isFocused
            ? "var(--theme-shadow-strong), var(--theme-glow)"
            : "var(--theme-shadow-soft), var(--theme-glow)",
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
        <div className="relative">
          <textarea
            id="entry-text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            maxLength={maxLength}
            placeholder={prompt}
            className="min-h-36 w-full resize-none rounded-xl border px-5 py-4 text-base leading-7 text-[color:var(--theme-text)] outline-none transition duration-300 placeholder:text-transparent focus:ring-2 focus:ring-[color:var(--theme-accent-soft)] motion-reduce:transition-none"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-border) 70%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--theme-surface) 92%, white 8%)",
              boxShadow: "var(--theme-glow)",
            }}
          />
          {value.length === 0 ? (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-4 left-5 right-5 text-base leading-7 text-[color:var(--theme-muted)]/50 transition-opacity duration-300 motion-reduce:transition-none ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {prompt}
            </span>
          ) : null}
        </div>

        <p className="text-xs text-[color:var(--theme-muted)]/75">
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
              className="text-xs text-[color:var(--theme-muted)]/80 underline decoration-transparent transition hover:decoration-current disabled:cursor-default disabled:no-underline"
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
              className="w-full rounded-lg border px-3 py-2 text-sm text-[color:var(--theme-text)] outline-none transition placeholder:text-[color:var(--theme-muted)]/70 focus:ring-2 focus:ring-[color:var(--theme-accent-soft)]"
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
              <footer className="mt-2 text-sm not-italic text-[color:var(--theme-muted)]">
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
          <span className="text-sm transition-colors duration-300" style={{ color: lengthFeedback.color }}>
            {value.length} / {maxLength} - {lengthFeedback.label}
          </span>
          <button
            type="submit"
            disabled={isInvalid || isSubmitting}
            className="rounded-full px-5 py-2 text-sm font-medium transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              backgroundColor: "var(--theme-accent)",
              color: "var(--theme-accent-contrast)",
              boxShadow:
                value.length >= 50 && value.length <= 120
                  ? "0 0 0 1px var(--theme-accent-soft) inset, 0 8px 20px color-mix(in srgb, var(--theme-accent) 24%, transparent)"
                  : "0 0 0 1px var(--theme-accent-soft) inset",
            }}
          >
            {isSubmitting ? "Saving..." : "Leave a trace"}
          </button>
        </div>

        <p
          aria-live="polite"
          className={`text-center text-xs text-[color:var(--theme-muted)] transition-opacity duration-300 ${
            showSavedFeedback ? "opacity-100" : "opacity-0"
          }`}
        >
          Saved for the future.
        </p>
      </form>
    </div>
  );
}
