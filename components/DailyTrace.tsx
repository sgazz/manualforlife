"use client";

import { useCallback, useEffect, useState } from "react";
import { ShareTraceCard } from "@/components/trace/ShareTraceCard";
import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { NativeShareButton } from "@/components/ui/NativeShareButton";
import { formatDailyTraceSelectionDate } from "@/lib/dailyTrace";
import type { Entry, StarActionOptions } from "@/types/ui";

type DailyTraceProps = {
  entry: Entry | null;
  isLoading: boolean;
  subdued?: boolean;
  onStar?: (entryId: string, options?: StarActionOptions) => Promise<void>;
  isStarred?: boolean;
  isStarring?: boolean;
  onLeaveTrace: () => void;
};

export function DailyTrace({
  entry,
  isLoading,
  subdued = false,
  onStar,
  isStarred = false,
  isStarring = false,
  onLeaveTrace,
}: DailyTraceProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [selectionDateLabel, setSelectionDateLabel] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasMounted(true);
      setSelectionDateLabel(formatDailyTraceSelectionDate(new Date()));
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleStar = useCallback(() => {
    if (!entry || !onStar) {
      return;
    }
    void onStar(entry.id, { sourceEntry: entry });
  }, [entry, onStar]);

  if (isLoading) {
    return null;
  }

  return (
    <section
      id="daily-trace"
      aria-labelledby="daily-trace-title"
      className={`scroll-mt-24 transition-opacity duration-300 motion-reduce:transition-none ${
        subdued ? "opacity-55" : "opacity-100"
      }`}
    >
      <div className="text-center">
        <h2
          id="daily-trace-title"
          className="typography-hint text-[0.7rem] font-medium tracking-[0.16em] text-(--theme-muted)/58 uppercase"
        >
          Daily Trace
        </h2>
        <p className="mt-2 font-serif text-[1.05rem] leading-snug text-(--theme-text)/82 sm:text-[1.15rem]">
          One thought from the archive. Chosen for today.
        </p>
      </div>

      {entry ? (
        <>
          <div className="mt-5 sm:mt-6">
            <ShareTraceCard
              text={entry.text}
              signature={entry.signature}
              tone={entry.tone}
              variant="page"
            />
          </div>

          <p
            suppressHydrationWarning
            className="mt-4 text-center text-xs leading-5 text-(--theme-muted)/58 sm:mt-5"
          >
            {hasMounted
              ? `Selected from the archive on ${selectionDateLabel}.`
              : "Selected from the archive today."}
          </p>

          <div
            className="mt-4 flex flex-wrap items-start justify-center gap-x-1 gap-y-2 sm:mt-5"
            role="group"
            aria-label={`Daily Trace actions: ${entry.text}`}
          >
            <CopyTraceLinkButton entryId={entry.id} label="Copy" variant="inline" />
            <NativeShareButton
              traceText={entry.text}
              entryId={entry.id}
              label="Share"
              variant="inline"
            />
            {onStar ? (
              <button
                type="button"
                disabled={isStarring}
                onClick={() => void handleStar()}
                aria-label={
                  isStarred
                    ? "Remove Saved Trace"
                    : isStarring
                      ? "Saving Trace"
                      : "Save Trace"
                }
                title={
                  isStarred
                    ? "Remove save"
                    : isStarring
                      ? "Saving..."
                      : "Save Trace"
                }
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs text-(--theme-muted)/55 transition-[color,transform] duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) active:scale-95 disabled:opacity-45 motion-reduce:transition-none"
              >
                <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-6 text-center sm:mt-7">
          <p className="mx-auto max-w-md font-serif text-[1.02rem] leading-7 text-(--theme-muted)/75 sm:text-[1.08rem]">
            Today&apos;s page has not been written yet.
          </p>
          <button
            type="button"
            onClick={onLeaveTrace}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 motion-reduce:transition-none"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
            }}
          >
            Leave the first Trace
          </button>
        </div>
      )}
    </section>
  );
}
