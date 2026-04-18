"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panels/PanelShell";
import type { Entry, LoadingEntryMap, StarActionOptions } from "@/types/ui";

type LivePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  isTyping?: boolean;
  entries: Entry[];
  olderEntries: Entry[];
  hasMoreOlderEntries: boolean;
  isLoadingOlderEntries: boolean;
  onLoadOlderEntries: () => Promise<void>;
  newlyAddedIds: string[];
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  starringEntryIds: LoadingEntryMap;
  starredEntryIds: string[];
};

function formatRelativeTime(dateString: string, hasMounted: boolean) {
  if (!hasMounted) return "recently";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "recently";

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMinutes) < 1) return "just now";
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(Math.round(diffHours / 24), "day");
}

export function LivePanel({
  isOpen,
  onClose,
  isLoading,
  isTyping = false,
  entries,
  olderEntries,
  hasMoreOlderEntries,
  isLoadingOlderEntries,
  onLoadOlderEntries,
  newlyAddedIds,
  onStar,
  starringEntryIds,
  starredEntryIds,
}: LivePanelProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasMounted(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <PanelShell side="left" isOpen={isOpen} onClose={onClose} title="Live Traces">
      <div
        className={`ios-scroll-touch relative min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 transition-opacity duration-300 ease-in-out sm:pr-1 ${
          isTyping ? "opacity-65" : "opacity-100"
        }`}
      >
        <div className="pointer-events-none sticky top-0 z-10 h-4 bg-linear-to-b from-[#f8f5f0] to-transparent sm:h-6" />
        {isLoading ? (
          <p className="px-2 py-4 text-sm text-(--theme-muted)">
            Loading traces...
          </p>
        ) : (
          <ul className="space-y-5 pb-5 sm:space-y-6 sm:pb-6">
            {entries.map((entry) => {
              const isNew = newlyAddedIds.includes(entry.id);
              const isStarring = Boolean(starringEntryIds[entry.id]);
              const isStarred = starredEntryIds.includes(entry.id);
              return (
                <li
                  key={entry.id}
                  className={`border-b border-(--theme-border)/25 pb-4 transition-opacity duration-300 ease-in-out sm:pb-5 ${
                    isNew ? "motion-safe:animate-[liveEntryIn_320ms_ease-in-out]" : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-(--theme-muted)/65">
                    <span
                      suppressHydrationWarning
                      className="inline-flex items-center gap-2"
                      title={`Created at ${new Date(entry.created_at).toLocaleString("en-US")}`}
                    >
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-(--theme-muted)/45" />
                      <span className="whitespace-nowrap">
                        {formatRelativeTime(entry.created_at, hasMounted)}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={isStarring}
                      onClick={() => void onStar(entry.id, { sourceEntry: entry })}
                      title={
                        isStarred
                          ? "Remove star"
                          : isStarring
                            ? "Saving star..."
                            : "Add star"
                      }
                      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-1.5 text-xs text-(--theme-muted)/55 transition-[color,transform] duration-300 ease-in-out hover:text-(--theme-muted)/80 active:scale-95 disabled:opacity-45"
                    >
                      <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
                      <span className="tabular-nums">{entry.stars}</span>
                    </button>
                  </div>
                  <p className="font-serif text-[1.03rem] leading-7 text-(--theme-text) sm:text-lg sm:leading-8">
                    {entry.text}
                  </p>
                  {entry.signature ? (
                    <p className="mt-2.5 text-xs italic text-(--theme-muted)/70">
                      &mdash; {entry.signature}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {!isLoading && (olderEntries.length > 0 || hasMoreOlderEntries) ? (
          <section className="mt-2 border-t border-(--theme-border)/20 pt-3">
            <div className="flex items-center justify-end">
              {hasMoreOlderEntries ? (
                <button
                  type="button"
                  disabled={isLoadingOlderEntries}
                  onClick={() => void onLoadOlderEntries()}
                  className="inline-flex min-h-11 items-center text-sm text-(--theme-muted)/75 underline decoration-transparent transition hover:decoration-current disabled:opacity-45"
                >
                  {isLoadingOlderEntries ? "Loading earlier traces..." : "Earlier traces"}
                </button>
              ) : null}
            </div>
            {olderEntries.length > 0 ? (
              <ul className="mt-3 space-y-5 pb-3 sm:space-y-6">
                {olderEntries.map((entry) => {
                  const isStarring = Boolean(starringEntryIds[entry.id]);
                  const isStarred = starredEntryIds.includes(entry.id);
                  return (
                    <li
                      key={entry.id}
                      className="border-b border-(--theme-border)/18 pb-4 transition-opacity duration-300 ease-in-out sm:pb-5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-(--theme-muted)/60">
                        <span
                          suppressHydrationWarning
                          className="inline-flex items-center gap-2"
                          title={`Created at ${new Date(entry.created_at).toLocaleString("en-US")}`}
                        >
                          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-(--theme-muted)/40" />
                          <span className="whitespace-nowrap">
                            {formatRelativeTime(entry.created_at, hasMounted)}
                          </span>
                        </span>
                        <button
                          type="button"
                          disabled={isStarring}
                          onClick={() => void onStar(entry.id, { sourceEntry: entry })}
                          title={
                            isStarred
                              ? "Remove star"
                              : isStarring
                                ? "Saving star..."
                                : "Add star"
                          }
                          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-1.5 text-xs text-(--theme-muted)/55 transition-[color,transform] duration-300 ease-in-out hover:text-(--theme-muted)/80 active:scale-95 disabled:opacity-45"
                        >
                          <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
                          <span className="tabular-nums">{entry.stars}</span>
                        </button>
                      </div>
                      <p className="font-serif text-[1.03rem] leading-7 text-(--theme-text) sm:text-lg sm:leading-8">
                        {entry.text}
                      </p>
                      {entry.signature ? (
                        <p className="mt-2.5 text-xs italic text-(--theme-muted)/70">
                          &mdash; {entry.signature}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        ) : null}
        <div aria-hidden="true" className="h-6 sm:h-8" />
        <div className="pointer-events-none sticky bottom-0 z-10 h-6 bg-linear-to-t from-[#f8f5f0] to-transparent sm:h-8" />
      </div>
    </PanelShell>
  );
}
