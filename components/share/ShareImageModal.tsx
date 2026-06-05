"use client";

import { useCallback, useEffect, useState } from "react";
import { ShareImageCard } from "@/components/share/ShareImageCard";
import { CopyTraceTextButton } from "@/components/ui/CopyTraceTextButton";
import {
  downloadShareImageBlob,
  exportShareImagePng,
  type ShareImageData,
} from "@/lib/shareImageExport";
import type { ShareCardFormat } from "@/lib/signatureShareCard";

type ShareImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  traceText: string;
  signature?: string | null;
  createdAt?: string | null;
  shareUrl: string;
};

const formatOptions: Array<{ value: ShareCardFormat; label: string }> = [
  { value: "portrait", label: "Portrait" },
  { value: "square", label: "Square" },
];

export function ShareImageModal({
  isOpen,
  onClose,
  traceText,
  signature = null,
  createdAt = null,
  shareUrl,
}: ShareImageModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [format, setFormat] = useState<ShareCardFormat>("portrait");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDownloadMessage(null);
      setIsDownloading(false);
      setFormat("portrait");
    }
  }, [isOpen]);

  const handleDownload = useCallback(async () => {
    setDownloadMessage(null);
    setIsDownloading(true);

    const payload: ShareImageData = {
      traceText,
      signature,
      createdAt,
      shareUrl,
      format,
    };

    try {
      const blob = await exportShareImagePng(payload);
      if (!blob) {
        setDownloadMessage("Screenshot the preview for now. PNG export is not available here.");
        return;
      }
      downloadShareImageBlob(blob);
      setDownloadMessage("Image downloaded.");
    } catch {
      setDownloadMessage("Screenshot the preview for now. PNG export is not available here.");
    } finally {
      setIsDownloading(false);
    }
  }, [createdAt, format, shareUrl, signature, traceText]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${
        isOpen ? "z-50 pointer-events-auto opacity-100" : "-z-10 pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close share image preview"
        onClick={onClose}
        className="bf-modal-scrim absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-y-auto px-[max(1rem,env(safe-area-inset-left,0px))] py-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Share image preview"
          className="pointer-events-auto w-full max-w-md rounded-2xl px-5 py-6 sm:px-7 sm:py-8"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-surface) 96%, white 4%)",
            boxShadow:
              "0 1px 0 color-mix(in srgb, var(--theme-border) 35%, transparent), 0 24px 48px color-mix(in srgb, var(--theme-text) 8%, transparent)",
          }}
        >
          <div className="text-center">
            <h2 className="typography-hint text-[0.7rem] font-medium tracking-[0.16em] text-(--theme-muted)/70 uppercase">
              Signature card
            </h2>
            <p className="mt-2 text-sm leading-6 text-(--theme-muted)/78">
              A preserved trace, ready to share or screenshot.
            </p>
          </div>

          <div
            className="mt-4 flex justify-center gap-2"
            role="tablist"
            aria-label="Card format"
          >
            {formatOptions.map((option) => {
              const isActive = format === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFormat(option.value)}
                  className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) ${
                    isActive
                      ? "bg-(--theme-text)/8 text-(--theme-text)/82"
                      : "text-(--theme-muted)/58 hover:text-(--theme-muted)/78"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 sm:mt-6">
            <ShareImageCard
              traceText={traceText}
              signature={signature}
              createdAt={createdAt}
              format={format}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
            <button
              type="button"
              disabled={isDownloading}
              onClick={() => void handleDownload()}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
              style={{
                borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
              }}
            >
              {isDownloading ? "Preparing image..." : "Download image"}
            </button>
            <CopyTraceTextButton
              traceText={traceText}
              label="Copy text"
              variant="full"
              includeAppUrl
              shareUrl={shareUrl}
            />
          </div>

          {downloadMessage ? (
            <p
              role="status"
              className="mt-3 text-center text-xs leading-5 text-(--theme-muted)/72"
            >
              {downloadMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center text-xs text-(--theme-muted)/55 transition-colors hover:text-(--theme-muted)/78 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2"
          >
            Close
          </button>
        </section>
      </div>
    </div>
  );
}
