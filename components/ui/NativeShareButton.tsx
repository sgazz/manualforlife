"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildTraceUrl, siteUrl } from "@/lib/site";
import {
  formatTraceShareClipboardPayload,
  NATIVE_SHARE_TITLE,
} from "@/lib/traceShare";

type NativeShareButtonProps = {
  traceText: string;
  entryId?: string;
  label?: string;
  className?: string;
  variant?: "inline" | "full";
};

type ShareFeedback = "idle" | "copied" | "failed";

const fullButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 motion-reduce:transition-none";

const inlineButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs text-(--theme-muted)/55 transition-colors duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) active:scale-95";

const buttonSurfaceStyle = {
  borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
  backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
};

export function NativeShareButton({
  traceText,
  entryId,
  label = "Share",
  className = "",
  variant = "full",
}: NativeShareButtonProps) {
  const [canShare, setCanShare] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback>("idle");
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const clearFeedbackLater = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback("idle");
      feedbackTimeoutRef.current = null;
    }, 2400);
  }, []);

  const shareUrl = entryId ? buildTraceUrl(entryId) : siteUrl;

  const handleShare = useCallback(async () => {
    const trimmed = traceText.trim();
    if (!trimmed) {
      return;
    }

    if (canShare) {
      try {
        await navigator.share({
          title: NATIVE_SHARE_TITLE,
          text: trimmed,
          url: shareUrl,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(formatTraceShareClipboardPayload(trimmed, shareUrl));
      setFeedback("copied");
    } catch {
      setFeedback("failed");
    }
    clearFeedbackLater();
  }, [canShare, clearFeedbackLater, shareUrl, traceText]);

  const isFull = variant === "full";

  return (
    <div
      className={`${isFull ? "w-full" : "inline-flex flex-col items-center"} ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label="Share this Trace"
        className={isFull ? fullButtonClass : inlineButtonClass}
        style={isFull ? buttonSurfaceStyle : undefined}
      >
        {label}
      </button>
      {!canShare ? (
        <p
          aria-live="polite"
          className={`text-[0.65rem] text-(--theme-muted)/62 transition-opacity duration-300 motion-reduce:transition-none ${
            isFull ? "mt-2 min-h-4 text-center" : "mt-0.5 min-h-4 text-center"
          } ${feedback === "idle" ? "opacity-0" : "opacity-100"}`}
        >
          {feedback === "copied"
            ? "Copied to clipboard"
            : feedback === "failed"
              ? "Could not share"
              : "\u00a0"}
        </p>
      ) : null}
    </div>
  );
}
