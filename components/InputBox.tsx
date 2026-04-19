import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Script from "next/script";
import { RotatingPrompt } from "@/components/RotatingPrompt";
import { CustomCaret } from "@/components/ui/CustomCaret";
import { useFocusState } from "@/hooks/useFocusState";

type InputBoxProps = {
  value: string;
  maxLength: number;
  isSubmitting: boolean;
  turnstileSiteKey?: string;
  hasTurnstileToken?: boolean;
  onChange: (value: string) => void;
  onSubmit: (form: HTMLFormElement) => Promise<boolean>;
  onFocusChange?: (isFocused: boolean) => void;
  /** When true, a successful submit does not show inline “saved” copy or delayed clearing — the parent handles the post-submit experience. */
  deferPostSubmitToParent?: boolean;
  /** Hides the desktop trace invitation caret (e.g. while panels or modals are open). */
  chromeSuppressed?: boolean;
};

const SUBMIT_DELAY_MS = 240;
const COUNTER_THRESHOLDS = [50, 100, 150] as const;
const COUNTER_FLASH_MS = 3000;
/** Skip programmatic focus on narrow or touch-primary viewports to avoid popping the software keyboard. */
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const COARSE_POINTER_MEDIA_QUERY = "(pointer: coarse)";
/** ~5 rows incl. padding (mobile) / ~6 rows (desktop) — auto-grow clamps to max px. */
const TRACE_TEXTAREA_MIN_HEIGHT_PX = { narrow: 168, wide: 212 } as const;
const TRACE_TEXTAREA_MAX_HEIGHT_PX = { narrow: 208, wide: 272 } as const;
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
  maxLength,
  isSubmitting,
  turnstileSiteKey,
  hasTurnstileToken = false,
  onChange,
  onSubmit,
  onFocusChange,
  deferPostSubmitToParent = false,
  chromeSuppressed = false,
}: InputBoxProps) {
  const { isFocused, onFocus, onBlur } = useFocusState();
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const previousLengthRef = useRef(value.length);
  const currentLengthRef = useRef(value.length);
  const counterTimeoutRef = useRef<number | null>(null);
  const savedFeedbackTimeoutRef = useRef<number | null>(null);
  const [isCounterVisible, setIsCounterVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [inviteChromeEligible, setInviteChromeEligible] = useState(false);

  const requiresTurnstile = Boolean(turnstileSiteKey);
  const normalizedValue = value.trim();
  const hasText = normalizedValue.length > 0;

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
    const narrow = window.matchMedia(MOBILE_MEDIA_QUERY);
    const coarse = window.matchMedia(COARSE_POINTER_MEDIA_QUERY);
    if (narrow.matches || coarse.matches) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const narrow = window.matchMedia(MOBILE_MEDIA_QUERY);
    const coarse = window.matchMedia(COARSE_POINTER_MEDIA_QUERY);
    const sync = () => {
      setInviteChromeEligible(!narrow.matches && !coarse.matches);
    };
    sync();
    narrow.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
    };
  }, []);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const narrow = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    const minPx = narrow
      ? TRACE_TEXTAREA_MIN_HEIGHT_PX.narrow
      : TRACE_TEXTAREA_MIN_HEIGHT_PX.wide;
    const maxPx = narrow
      ? TRACE_TEXTAREA_MAX_HEIGHT_PX.narrow
      : TRACE_TEXTAREA_MAX_HEIGHT_PX.wide;
    el.style.height = "0px";
    const next = Math.min(Math.max(el.scrollHeight, minPx), maxPx);
    el.style.height = `${next}px`;
  }, [value]);

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
    if (!wasSuccessful) {
      return;
    }
    if (deferPostSubmitToParent) {
      return;
    }
    setShowSavedFeedback(true);
    if (savedFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(savedFeedbackTimeoutRef.current);
    }
    savedFeedbackTimeoutRef.current = window.setTimeout(() => {
      onChange("");
      setShowSavedFeedback(false);
    }, 1700);
  }

  const showTraceInviteCaret =
    inviteChromeEligible &&
    isFocused &&
    !hasText &&
    !chromeSuppressed;

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
          <div
            aria-hidden={hasText ? true : undefined}
            className={`transition-opacity duration-400 ease-out motion-reduce:transition-none ${
              hasText ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <RotatingPrompt prompts={PROMPTS} paused={hasText} />
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
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
              rows={1}
              className="typography-ui relative z-0 w-full scroll-mt-24 resize-none overflow-y-auto overflow-x-hidden rounded-xl border-b px-4 py-4 text-base leading-7 text-(--theme-text) outline-none transition-[box-shadow] duration-300 focus:ring-0 motion-reduce:transition-none sm:px-6 sm:py-5 sm:text-lg sm:leading-8"
              style={{
                borderColor: "color-mix(in srgb, var(--theme-border) 55%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--theme-surface) 96%, white 4%)",
                boxShadow: isFocused
                  ? "inset 0 -2px 0 color-mix(in srgb, var(--theme-accent) 35%, transparent)"
                  : "inset 0 -1px 0 color-mix(in srgb, var(--theme-border) 45%, transparent)",
                caretColor: showTraceInviteCaret ? "transparent" : undefined,
              }}
            />
            <CustomCaret
              variant="invite"
              visible={showTraceInviteCaret}
              className="top-[1.875rem] left-4 -translate-y-1/2 sm:top-[2.25rem] sm:left-6"
            />
          </div>
        </div>

        <p className="typography-hint text-(--theme-muted)/75">
          Keep it simple. One idea is enough.
        </p>

        {value.trim().length > 0 ? (
          <blockquote
            className="rounded-xl border px-4 py-3 text-center italic transition-opacity duration-300 motion-reduce:transition-none"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-border) 75%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--theme-surface) 90%, white 10%)",
              color: "color-mix(in srgb, var(--theme-text) 90%, var(--theme-muted) 10%)",
            }}
          >
            <p>&ldquo;{value.trim()}&rdquo;</p>
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
