"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const SHARE_URL = "https://manualfor.life";
const SHARE_TITLE = "Manualfor.life";
const SIGNATURE_MAX_LENGTH = 30;

type ReflectionShareCardProps = {
  traceText: string;
  signature: string;
  onSignatureChange: (value: string) => void;
  entryId: string | null;
  onClose: () => void;
};

type ShareFeedback = "idle" | "copied" | "copy_failed";

async function copyTraceForSharing(trimmedTrace: string, attribution: string | null) {
  const body =
    attribution && attribution.trim().length > 0
      ? `${trimmedTrace}\n\n— ${attribution.trim()}\n\nmanualfor.life`
      : `${trimmedTrace}\n\nmanualfor.life`;
  await navigator.clipboard.writeText(body);
}

export function ReflectionShareCard({
  traceText,
  signature,
  onSignatureChange,
  entryId,
  onClose,
}: ReflectionShareCardProps) {
  const titleId = useId();
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const handleDoneRef = useRef<() => Promise<void>>(async () => {});
  const [animateIn, setAnimateIn] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<ShareFeedback>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const attemptSignatureSave = useCallback(
    async (targetEntryId: string) => {
      return fetch(`/api/entries/${targetEntryId}/signature`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature: trimmedSignature }),
      });
    },
    [trimmedSignature],
  );

  const persistSignatureIfNeeded = useCallback(async () => {
    if (!hasSignature) {
      return true;
    }
    if (!entryId) {
      setSaveError(
        "Your trace was saved, but your name could not be attached. You can close this — we will try again automatically.",
      );
      return false;
    }

    let response: Response;
    try {
      response = await attemptSignatureSave(entryId);
    } catch {
      setSaveError("Network issue — please try once more.");
      return false;
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader
        ? Math.max(1, Math.min(15, Number.parseInt(retryAfterHeader, 10) || 2))
        : 2;
      setSaveError(
        `Saving in a moment… retrying in ${retryAfterSeconds}s. Feel free to close — your trace is already saved.`,
      );
      await new Promise((resolve) =>
        window.setTimeout(resolve, retryAfterSeconds * 1000),
      );
      try {
        response = await attemptSignatureSave(entryId);
      } catch {
        setSaveError("Network issue — please try once more.");
        return false;
      }
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setSaveError(payload.error ?? "Could not save your name.");
      return false;
    }
    setSaveError(null);
    return true;
  }, [attemptSignatureSave, entryId, hasSignature]);

  const handleDone = useCallback(async () => {
    setSaveError(null);
    if (hasSignature) {
      setIsSaving(true);
      try {
        const ok = await persistSignatureIfNeeded();
        if (!ok) {
          return;
        }
      } finally {
        setIsSaving(false);
      }
    }
    onClose();
  }, [hasSignature, onClose, persistSignatureIfNeeded]);

  useEffect(() => {
    handleDoneRef.current = handleDone;
  }, [handleDone]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const el = signatureInputRef.current;
      if (!el) {
        return;
      }
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void handleDoneRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleShare = async () => {
    if (!trimmedTraceText) {
      return;
    }

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        const shareText =
          hasSignature && trimmedSignature
            ? `${trimmedTraceText}\n\n— ${trimmedSignature}`
            : trimmedTraceText;
        await navigator.share({
          title: SHARE_TITLE,
          text: shareText,
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
      await copyTraceForSharing(
        trimmedTraceText,
        hasSignature ? trimmedSignature : null,
      );
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
        onClick={() => void handleDone()}
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

            <div className="mt-7 text-left sm:mt-8">
              <label
                htmlFor="reflection-signature"
                className="typography-hint block text-(--theme-muted)/70"
              >
                Name (optional)
              </label>
              <input
                ref={signatureInputRef}
                id="reflection-signature"
                type="text"
                value={signature}
                maxLength={SIGNATURE_MAX_LENGTH}
                onChange={(event) =>
                  onSignatureChange(event.target.value.slice(0, SIGNATURE_MAX_LENGTH))
                }
                placeholder="First name or initials"
                className="typography-ui mt-2 w-full rounded-lg border px-4 py-3 text-base leading-7 text-(--theme-text) outline-none transition-[box-shadow,border-color] duration-200 placeholder:text-sm placeholder:text-(--theme-muted)/50 focus:border-transparent focus:ring-1 focus:ring-(--theme-accent-soft) sm:text-lg sm:leading-8"
                style={{
                  borderColor: "color-mix(in srgb, var(--theme-border) 50%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--theme-surface) 96%, var(--theme-muted) 4%)",
                }}
              />
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:mt-9">
              <button
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
                Share
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleDone()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2 text-xs font-normal tracking-wide text-(--theme-muted)/50 transition-colors duration-200 hover:text-(--theme-muted)/72 motion-reduce:transition-none disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Done"}
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

            {saveError ? (
              <p
                role="alert"
                className="mt-2 text-center text-xs text-(--theme-error-text)"
              >
                {saveError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
