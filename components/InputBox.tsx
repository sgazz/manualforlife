import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import { RotatingPrompt } from "@/components/RotatingPrompt";
import { CustomCaret } from "@/components/ui/CustomCaret";
import { useFocusState } from "@/hooks/useFocusState";

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
const COUNTER_THRESHOLDS = [50, 100, 150] as const;
const COUNTER_FLASH_MS = 3000;
const PROMPTS = [
  "What would you tell your younger self?",
  "What changed the way you see things?",
  "What did you learn the hard way?",
  "What truly matters?",
  "Say it in one sentence.",
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
  onFocusChange,
}: InputBoxProps) {
  const { isFocused, onFocus, onBlur } = useFocusState();
  const [showSignatureInput, setShowSignatureInput] = useState(false);
  const [isSignatureFocused, setIsSignatureFocused] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const previousLengthRef = useRef(value.length);
  const currentLengthRef = useRef(value.length);
  const counterTimeoutRef = useRef<number | null>(null);
  const savedFeedbackTimeoutRef = useRef<number | null>(null);
  const [isCounterVisible, setIsCounterVisible] = useState(false);

  const requiresTurnstile = Boolean(turnstileSiteKey);
  const normalizedValue = value.trim();
  const hasText = normalizedValue.length > 0;
  const canRevealSignature = normalizedValue.length > SIGNATURE_REVEAL_MIN_LENGTH;

  const isInvalid =
    normalizedValue.length === 0 ||
    value.length > maxLength ||
    (requiresTurnstile && !hasTurnstileToken);
  const thoughtWeight = useMemo(() => {
    if (normalizedValue.length <= 20) return "quiet";
    if (normalizedValue.length <= 60) return "neutral";
    return "ready";
  }, [normalizedValue.length]);

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

  useEffect(() => {
    if (!showSignatureInput || !canRevealSignature || !signatureInputRef.current) {
      return;
    }

    signatureInputRef.current.focus({ preventScroll: true });
    signatureInputRef.current.setSelectionRange(
      signatureInputRef.current.value.length,
      signatureInputRef.current.value.length,
    );
  }, [canRevealSignature, showSignatureInput]);

  useEffect(() => {
    const currentLength = value.length;
    currentLengthRef.current = currentLength;
    const previousLength = previousLengthRef.current;
    let visibilityFrame: number | null = null;

    const clearCounterTimeout = () => {
      if (counterTimeoutRef.current !== null) {
        window.clearTimeout(counterTimeoutRef.current);
        counterTimeoutRef.current = null;
      }
    };

    const scheduleCounterVisibility = (nextVisible: boolean) => {
      visibilityFrame = window.setTimeout(() => {
        setIsCounterVisible(nextVisible);
      }, 0);
    };

    const flashCounter = () => {
      clearCounterTimeout();
      scheduleCounterVisibility(true);
      counterTimeoutRef.current = window.setTimeout(() => {
        if (currentLengthRef.current < maxLength) {
          setIsCounterVisible(false);
        }
      }, COUNTER_FLASH_MS);
    };

    if (currentLength >= maxLength) {
      clearCounterTimeout();
      scheduleCounterVisibility(true);
      previousLengthRef.current = currentLength;
      return () => {
        if (visibilityFrame !== null) {
          window.clearTimeout(visibilityFrame);
        }
      };
    }

    if (previousLength >= maxLength && currentLength < maxLength) {
      clearCounterTimeout();
      scheduleCounterVisibility(false);
      previousLengthRef.current = currentLength;
      return () => {
        if (visibilityFrame !== null) {
          window.clearTimeout(visibilityFrame);
        }
      };
    }

    const crossedThreshold = COUNTER_THRESHOLDS.some(
      (threshold) => previousLength < threshold && currentLength >= threshold,
    );

    if (crossedThreshold) {
      flashCounter();
    }

    previousLengthRef.current = currentLength;
    return () => {
      if (visibilityFrame !== null) {
        window.clearTimeout(visibilityFrame);
      }
    };
  }, [maxLength, value.length]);

  useEffect(() => {
    return () => {
      if (counterTimeoutRef.current !== null) {
        window.clearTimeout(counterTimeoutRef.current);
      }
      if (savedFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(savedFeedbackTimeoutRef.current);
      }
    };
  }, []);

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
      if (savedFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(savedFeedbackTimeoutRef.current);
      }
      savedFeedbackTimeoutRef.current = window.setTimeout(() => {
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
        className="relative z-10 w-full space-y-4 rounded-2xl bg-(--theme-surface) px-4 py-4 transition-shadow duration-400 motion-reduce:transition-none sm:space-y-5 sm:px-6 sm:py-5"
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
        <div className="relative space-y-1.5 sm:space-y-2">
          <RotatingPrompt prompts={PROMPTS} paused={isFocused || hasText} />
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
            className={`typography-ui w-full scroll-mt-24 resize-none rounded-xl border-b px-4 py-4 text-base leading-7 text-(--theme-text) outline-none transition-[box-shadow,min-height] duration-300 focus:ring-0 motion-reduce:transition-none sm:min-h-40 sm:px-6 sm:py-5 sm:text-lg sm:leading-8 ${
              isFocused ? "min-h-60 sm:min-h-52" : "min-h-44 sm:min-h-40"
            }`}
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
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${
            canRevealSignature ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            {!showSignatureInput || !canRevealSignature ? (
            <button
              type="button"
              disabled={!canRevealSignature}
              onClick={() => setShowSignatureInput(true)}
              title="Add signature"
              className="inline-flex min-h-11 items-center text-xs text-(--theme-muted)/80 underline decoration-transparent transition-colors hover:decoration-current disabled:cursor-default disabled:no-underline"
            >
              Would you like to sign it?
            </button>
          ) : (
            <div className="relative">
              <input
                ref={signatureInputRef}
                type="text"
                name="signature"
                value={signature}
                onChange={(event) =>
                  onSignatureChange(event.target.value.slice(0, SIGNATURE_MAX_LENGTH))
                }
                onFocus={() => setIsSignatureFocused(true)}
                onBlur={() => setIsSignatureFocused(false)}
                maxLength={SIGNATURE_MAX_LENGTH}
                placeholder="Your name (optional)"
                className="w-full scroll-mt-24 rounded-lg border px-3 py-2 font-sans text-base leading-normal tracking-[0.01em] text-(--theme-text) outline-none transition-shadow placeholder:text-(--theme-muted)/70 focus:ring-2 focus:ring-(--theme-accent-soft)"
                style={{
                  borderColor: "color-mix(in srgb, var(--theme-border) 75%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, white 6%)",
                  caretColor: "transparent",
                }}
              />
              <CustomCaret visible={isSignatureFocused} />
            </div>
            )}
          </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span
            title={`${Math.max(0, maxLength - value.length)} characters remaining (${value.length}/${maxLength})`}
            className={`text-center text-sm transition-opacity duration-300 sm:text-left ${
              isCounterVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              color: lengthFeedback.color,
              visibility: isCounterVisible ? "visible" : "hidden",
            }}
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
            className={`mx-auto inline-flex min-h-11 min-w-44 items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-[opacity,transform] duration-300 hover:brightness-105 motion-reduce:transition-none disabled:cursor-not-allowed disabled:hover:brightness-100 sm:mx-0 ${
              isInvalid || isSubmitting
                ? "opacity-45"
                : thoughtWeight === "quiet"
                  ? "opacity-72"
                  : thoughtWeight === "neutral"
                    ? "opacity-88"
                    : "opacity-100"
            }`}
            style={{
              backgroundColor:
                thoughtWeight === "quiet"
                  ? "color-mix(in srgb, var(--theme-accent) 74%, #f8ecdb 26%)"
                  : thoughtWeight === "neutral"
                    ? "color-mix(in srgb, var(--theme-accent) 82%, #f8ecdb 18%)"
                    : "color-mix(in srgb, var(--theme-accent) 88%, #f8ecdb 12%)",
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
