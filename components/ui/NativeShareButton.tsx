"use client";

import { useCallback, useEffect, useState } from "react";
import { buildTraceUrl } from "@/lib/site";
import { NATIVE_SHARE_TITLE } from "@/lib/traceShare";

type NativeShareButtonProps = {
  traceText: string;
  entryId: string;
  label?: string;
  className?: string;
};

export function NativeShareButton({
  traceText,
  entryId,
  label = "Share",
  className = "",
}: NativeShareButtonProps) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleShare = useCallback(async () => {
    const trimmed = traceText.trim();
    if (!trimmed || !canShare) {
      return;
    }

    const shareUrl = buildTraceUrl(entryId);

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
  }, [canShare, entryId, traceText]);

  if (!canShare) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      aria-label="Share this trace"
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 motion-reduce:transition-none ${className}`.trim()}
      style={{
        borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
      }}
    >
      {label}
    </button>
  );
}
