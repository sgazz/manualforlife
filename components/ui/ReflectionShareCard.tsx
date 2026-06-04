"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PostSubmitActions } from "@/components/PostSubmitActions";
import { ShareTraceCard } from "@/components/trace/ShareTraceCard";
import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { CopyTraceTextButton } from "@/components/ui/CopyTraceTextButton";
import { NativeShareButton } from "@/components/ui/NativeShareButton";
import { buildTraceUrl } from "@/lib/site";
import type { ToneValue } from "@/lib/tones";

const SIGNATURE_MAX_LENGTH = 30;

type ReflectionShareCardProps = {
  traceText: string;
  signature: string;
  tone?: ToneValue | null;
  onSignatureChange: (value: string) => void;
  entryId: string | null;
  onClose: () => void;
  onReadLiveTraces?: () => void;
};

export function ReflectionShareCard({
  traceText,
  signature,
  tone = null,
  onSignatureChange,
  entryId,
  onClose,
  onReadLiveTraces,
}: ReflectionShareCardProps) {
  const titleId = useId();
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const handleDoneRef = useRef<() => Promise<void>>(async () => {});
  const [animateIn, setAnimateIn] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedTraceText = traceText.trim();
  const trimmedSignature = signature.trim();
  const hasSignature = trimmedSignature.length > 0;
  const traceShareUrl = entryId ? buildTraceUrl(entryId) : null;

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

            <div className="mt-6">
              <ShareTraceCard
                text={trimmedTraceText}
                signature={hasSignature ? trimmedSignature : null}
                tone={tone}
                variant="modal"
              />
            </div>

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

            {onReadLiveTraces ? (
              <PostSubmitActions onReadLiveTraces={onReadLiveTraces} />
            ) : null}

            <div className="mt-4 flex flex-col gap-2.5">
              {entryId && traceShareUrl ? (
                <CopyTraceLinkButton
                  entryId={entryId}
                  label="Copy link to your trace"
                  variant="full"
                />
              ) : null}
              <CopyTraceTextButton traceText={trimmedTraceText} variant="full" />
              {entryId && traceShareUrl ? (
                <NativeShareButton traceText={trimmedTraceText} entryId={entryId} />
              ) : null}
            </div>

            <div className="mt-6 sm:mt-7">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleDone()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2 text-xs font-normal tracking-wide text-(--theme-muted)/50 transition-colors duration-200 hover:text-(--theme-muted)/72 motion-reduce:transition-none disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Done"}
              </button>
            </div>

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
