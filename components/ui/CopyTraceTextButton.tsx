"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatTraceShareClipboardPayload,
  formatTraceShareText,
} from "@/lib/traceShare";

type CopyTraceTextButtonProps = {
  traceText: string;
  label?: string;
  variant?: "inline" | "full";
  className?: string;
  /** When true, copy includes a URL on a second line. */
  includeAppUrl?: boolean;
  /** URL appended when includeAppUrl is true. Defaults to public app origin. */
  shareUrl?: string;
};

type CopyFeedback = "idle" | "copied" | "failed";

export function CopyTraceTextButton({
  traceText,
  label = "Copy text",
  variant = "inline",
  className = "",
  includeAppUrl = false,
  shareUrl,
}: CopyTraceTextButtonProps) {
  const [feedback, setFeedback] = useState<CopyFeedback>("idle");
  const feedbackTimeoutRef = useRef<number | null>(null);

  const clearFeedbackLater = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback("idle");
      feedbackTimeoutRef.current = null;
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const trimmed = traceText.trim();
    if (!trimmed) {
      return;
    }
    try {
      const payload = includeAppUrl
        ? formatTraceShareClipboardPayload(trimmed, shareUrl)
        : formatTraceShareText(trimmed);
      await navigator.clipboard.writeText(payload);
      setFeedback("copied");
    } catch {
      setFeedback("failed");
    }
    clearFeedbackLater();
  }, [clearFeedbackLater, includeAppUrl, shareUrl, traceText]);

  const isFull = variant === "full";

  return (
    <div className={`${isFull ? "w-full" : "inline-flex flex-col items-end"} ${className}`.trim()}>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label="Copy trace text"
        className={
          isFull
            ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 motion-reduce:transition-none"
            : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs text-(--theme-muted)/55 transition-colors duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) active:scale-95"
        }
        style={
          isFull
            ? {
                borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
              }
            : undefined
        }
      >
        {label}
      </button>
      <p
        aria-live="polite"
        className={`text-[0.65rem] text-(--theme-muted)/62 transition-opacity duration-300 motion-reduce:transition-none ${
          isFull ? "mt-2 min-h-4 text-center" : "mt-0.5 pr-1 text-right"
        } ${feedback === "idle" ? "opacity-0" : "opacity-100"}`}
      >
        {feedback === "copied"
          ? "Text copied"
          : feedback === "failed"
            ? "Could not copy text"
            : "\u00a0"}
      </p>
    </div>
  );
}
