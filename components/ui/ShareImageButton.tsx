"use client";

import { useCallback, useState } from "react";
import { ShareImageModal } from "@/components/share/ShareImageModal";
import { buildTraceUrl, siteUrl } from "@/lib/site";

type ShareImageButtonProps = {
  traceText: string;
  entryId?: string | null;
  signature?: string | null;
  createdAt?: string | null;
  label?: string;
  className?: string;
  variant?: "inline" | "full";
};

const fullButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 motion-reduce:transition-none";

const inlineButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs text-(--theme-muted)/55 transition-colors duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) active:scale-95 motion-reduce:transition-none motion-reduce:active:transform-none";

const buttonSurfaceStyle = {
  borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
  backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
};

export function ShareImageButton({
  traceText,
  entryId = null,
  signature = null,
  createdAt = null,
  label = "Image",
  className = "",
  variant = "inline",
}: ShareImageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = entryId ? buildTraceUrl(entryId) : siteUrl;

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const isFull = variant === "full";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open share image preview"
        title="Share image"
        className={`${isFull ? fullButtonClass : inlineButtonClass} ${className}`.trim()}
        style={isFull ? buttonSurfaceStyle : undefined}
      >
        {label}
      </button>
      <ShareImageModal
        isOpen={isOpen}
        onClose={handleClose}
        traceText={traceText}
        signature={signature}
        createdAt={createdAt}
        shareUrl={shareUrl}
      />
    </>
  );
}
