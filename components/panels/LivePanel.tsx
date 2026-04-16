"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panels/PanelShell";
import { TraceTransition } from "@/components/TraceTransition";
import type { Entry, LoadingEntryMap } from "@/types/ui";

type LivePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  isTyping?: boolean;
  entries: Entry[];
  newlyAddedIds: string[];
  onStar: (entryId: string) => Promise<void>;
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
        className={`relative h-[calc(100vh-5rem)] overflow-y-auto pr-1 transition-opacity duration-300 ease-in-out ${
          isTyping ? "opacity-65" : "opacity-100"
        }`}
      >
        <div className="pointer-events-none sticky top-0 z-10 h-6 bg-linear-to-b from-[#f8f5f0] to-transparent" />
        {isLoading ? (
          <p className="px-2 py-4 text-sm text-(--theme-muted)">
            Loading traces...
          </p>
        ) : (
          <ul className="space-y-6 pb-6">
            {entries.map((entry) => {
              const isNew = newlyAddedIds.includes(entry.id);
              const isStarring = Boolean(starringEntryIds[entry.id]);
              const isStarred = starredEntryIds.includes(entry.id);
              return (
                <li
                  key={entry.id}
                  className={`border-b border-(--theme-border)/35 pb-5 transition-all duration-300 ease-in-out ${
                    isNew ? "motion-safe:animate-[liveEntryIn_320ms_ease-in-out]" : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-(--theme-muted)/70">
                    <span
                      suppressHydrationWarning
                      className="group/date inline-flex items-center gap-2"
                      title={`Created at ${new Date(entry.created_at).toLocaleString("en-US")}`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-(--theme-muted)/45 transition-colors duration-300 ease-in-out group-hover/date:bg-(--theme-muted)/65"
                      />
                      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover/date:max-w-28 group-hover/date:opacity-100 group-focus-within/date:max-w-28 group-focus-within/date:opacity-100">
                        {formatRelativeTime(entry.created_at, hasMounted)}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={isStarring}
                      onClick={() => void onStar(entry.id)}
                      title={
                        isStarred
                          ? "Remove star"
                          : isStarring
                            ? "Saving star..."
                            : "Add star"
                      }
                      className="inline-flex items-center gap-1 text-xs text-(--theme-muted)/65 transition-colors duration-300 ease-in-out hover:text-(--theme-muted) disabled:opacity-45"
                    >
                      <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
                      <span>{entry.stars}</span>
                    </button>
                  </div>
                  <TraceTransition
                    text={entry.text}
                    className="block font-serif text-lg leading-8 text-(--theme-text)"
                  />
                  {entry.signature ? (
                    <p className="mt-3 text-xs italic text-(--theme-muted)/70">
                      &mdash; {entry.signature}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="pointer-events-none sticky bottom-0 z-10 h-8 bg-linear-to-t from-[#f8f5f0] to-transparent" />
      </div>
    </PanelShell>
  );
}
