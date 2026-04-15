"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panels/PanelShell";
import type { Entry, LoadingEntryMap } from "@/types/ui";

type LivePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
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
      <div className="h-[calc(100vh-5rem)] overflow-y-auto pr-1">
        {isLoading ? (
          <p className="px-2 py-4 text-sm text-[color:var(--theme-muted)]">
            Loading traces...
          </p>
        ) : (
          <ul className="space-y-3">
          {entries.map((entry) => {
            const isNew = newlyAddedIds.includes(entry.id);
            const isStarring = Boolean(starringEntryIds[entry.id]);
            const isStarred = starredEntryIds.includes(entry.id);
            return (
              <li
                key={entry.id}
                className={`rounded-xl border px-3 py-3 transition-all duration-300 ${
                  isNew ? "translate-y-0 opacity-100" : "opacity-95"
                }`}
                style={{
                  borderColor: "var(--theme-border)",
                  backgroundColor: "color-mix(in srgb, var(--theme-surface) 93%, white 7%)",
                  boxShadow: "var(--theme-glow)",
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-[color:var(--theme-muted)]">
                  <span suppressHydrationWarning>
                    <span title={`Created at ${new Date(entry.created_at).toLocaleString("en-US")}`}>
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
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 disabled:opacity-50"
                    style={{
                      borderColor: "var(--theme-border)",
                      color: "var(--theme-muted)",
                      backgroundColor: isStarred
                        ? "color-mix(in srgb, var(--theme-accent-soft) 65%, white 35%)"
                        : "transparent",
                    }}
                  >
                    <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
                    <span>{entry.stars}</span>
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-[color:var(--theme-text)]">{entry.text}</p>
                {entry.signature ? (
                  <p className="mt-2 text-xs italic text-[color:var(--theme-muted)]/90">
                    &mdash; {entry.signature}
                  </p>
                ) : null}
              </li>
            );
          })}
          </ul>
        )}
      </div>
    </PanelShell>
  );
}
