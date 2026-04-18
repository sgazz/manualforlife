"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const SHARE_URL = "https://manualfor.life";
const SHARE_TITLE = "Manualfor.life";

type ReflectionShareCardProps = {
  traceText: string;
  signature: string;
  onClose: () => void;
};

type ShareFeedback = "idle" | "copied" | "copy_failed";

async function copyTraceForSharing(trimmedTrace: string) {
  const clip = `${trimmedTrace}\n\nmanualfor.life`;
  await navigator.clipboard.writeText(clip);
}

export function ReflectionShareCard({
  traceText,
  signature,
  onClose,
}: ReflectionShareCardProps) {
  const titleId = useId();
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<ShareFeedback>("idle");
  const feedbackClearRef = useRef<number | null>(null);

  const trimmedTraceText = traceText.trim();
  const trimmedSignature = signature.trim();
  const hasSignature = trimmedSignature.length > 0;

  const clearFeedbackLater = useCallback(() => {
    if (feedbackClearRef.current !== null) {
      window.clearTimeout(feedbackClearRef.current);
    }
    feedbackClearRef.current = window.setTimeout(() => {
      setShareFeedback("idle");
      feedbackClearRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackClearRef.current !== null) {
        window.clearTimeout(feedbackClearRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, []);

  useEffect(() => {
    const focusShare = window.requestAnimationFrame(() => {
      shareButtonRef.current?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(focusShare);
    };
  }, [onClose]);

  const handleShare = async () => {
    if (!trimmedTraceText) {
      return;
    }

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: trimmedTraceText,
          url: SHARE_URL,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await copyTraceForSharing(trimmedTraceText);
      setShareFeedback("copied");
      clearFeedbackLater();
    } catch {
      setShareFeedback("copy_failed");
      clearFeedbackLater();
    }
  };

  return (
    <div className="fixed inset-0 z-48 pointer-events-auto opacity-100">
      <button
        type="button"
        aria-label="Close reflection"
        className="bf-modal-scrim absolute inset-0"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto px-[max(1rem,env(safe-area-inset-left,0px))] py-[max(1.5rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`pointer-events-auto w-full max-w-md transform transition-[opacity,transform] duration-400 ease-out motion-reduce:duration-0 motion-reduce:transition-none ${
            animateIn
              ? "translate-y-0 scale-100 opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100"
              : "translate-y-1.5 scale-[0.98] opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100"
          }`}
        >
          <div
            className="rounded-2xl px-6 py-7 text-center sm:px-8 sm:py-9"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--theme-surface) 92%, white 8%)",
              boxShadow:
                "0 1px 0 color-mix(in srgb, var(--theme-border) 35%, transparent), 0 24px 48px color-mix(in srgb, var(--theme-text) 6%, transparent)",
            }}
          >
            <p
              id={titleId}
              className="typography-hint text-[0.7rem] font-medium tracking-[0.18em] text-(--theme-muted)/80"
            >
              Saved for the future.
            </p>

            <blockquote className="mt-6 border-none px-0 py-0 shadow-none">
              <p className="font-serif text-[1.125rem] leading-[1.65] text-(--theme-text)/92 sm:text-[1.2rem] sm:leading-[1.7]">
                &ldquo;{trimmedTraceText}&rdquo;
              </p>
              {hasSignature ? (
                <footer className="typography-signature mt-4 text-sm text-(--theme-muted)/85">
                  &mdash; {trimmedSignature}
                </footer>
              ) : null}
            </blockquote>

            <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:mt-9">
              <button
                ref={shareButtonRef}
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-[opacity,transform] duration-200 hover:brightness-[1.03] motion-reduce:transition-none"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--theme-accent) 86%, #f8ecdb 14%)",
                  color:
                    "color-mix(in srgb, var(--theme-accent-contrast) 90%, #fff5e8 10%)",
                  boxShadow:
                    "0 0 0 1px color-mix(in srgb, var(--theme-accent-soft) 60%, transparent) inset",
                }}
              >
                Share your trace
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2 text-xs font-normal tracking-wide text-(--theme-muted)/50 transition-colors duration-200 hover:text-(--theme-muted)/72 motion-reduce:transition-none"
              >
                Write another
              </button>
            </div>

            <p
              aria-live="polite"
              className={`mt-4 min-h-5 text-center text-xs text-(--theme-muted)/70 transition-opacity duration-300 motion-reduce:transition-none ${
                shareFeedback === "idle" ? "opacity-0" : "opacity-100"
              }`}
            >
              {shareFeedback === "copied"
                ? "Copied to share."
                : shareFeedback === "copy_failed"
                  ? "Couldn't copy automatically — select the quote above if you need it."
                  : "\u00a0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
