"use client";

import { useEffect, useMemo, useState } from "react";
import { TraceReadInLanguage } from "@/components/ui/TraceReadInLanguage";
import type { Entry, LoadingEntryMap } from "@/types/ui";

type EntriesListProps = {
  entries: Entry[];
  isLoading: boolean;
  onStar: (entryId: string) => Promise<void>;
  starringEntryIds: LoadingEntryMap;
  starredEntryIds: string[];
};

const INITIAL_VISIBLE_COUNT = 5;
const SHORT_TRACE_LENGTH = 86;

function formatRelativeTime(dateString: string, hasMounted: boolean) {
  if (!hasMounted) {
    return "recently";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 1) return "just now";
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export function EntriesList({
  entries,
  isLoading,
  onStar,
  starringEntryIds,
  starredEntryIds,
}: EntriesListProps) {
  const [showAll, setShowAll] = useState(false);
  const [starError, setStarError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasMounted(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const visibleEntries = useMemo(() => {
    if (showAll) {
      return entries;
    }
    return entries.slice(0, INITIAL_VISIBLE_COUNT);
  }, [entries, showAll]);

  const hasMoreEntries = entries.length > INITIAL_VISIBLE_COUNT;

  async function handleStar(entryId: string) {
    setStarError(null);
    try {
      await onStar(entryId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save your star right now.";
      setStarError(message);
    }
  }

  return (
    <section
      className="w-full rounded-2xl bg-(--theme-surface) p-5 transition-all duration-400 sm:p-6"
      style={{ boxShadow: "var(--theme-shadow-soft)" }}
    >
      <h2 className="mb-4 text-sm font-medium tracking-wide text-(--theme-muted) uppercase transition-colors duration-400">
        Latest traces
      </h2>
      {starError ? (
        <p className="mb-3 text-xs text-(--theme-error-text)">{starError}</p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border px-4 py-3"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor:
                  "color-mix(in srgb, var(--theme-surface) 90%, white 10%)",
              }}
            >
              <div
                className="mb-2 h-3 w-20 rounded"
                style={{ backgroundColor: "color-mix(in srgb, var(--theme-border) 65%, white 35%)" }}
              />
              <div
                className="h-3 w-full rounded"
                style={{ backgroundColor: "color-mix(in srgb, var(--theme-border) 60%, white 40%)" }}
              />
              <div
                className="mt-2 h-3 w-2/3 rounded"
                style={{ backgroundColor: "color-mix(in srgb, var(--theme-border) 55%, white 45%)" }}
              />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-4 text-sm text-(--theme-muted)">
          No entries yet. Leave the first trace.
        </p>
      ) : (
        <div className="relative">
          <ul className="space-y-3">
            {visibleEntries.map((entry) => {
              const isStarring = Boolean(starringEntryIds[entry.id]);
              const isStarred = starredEntryIds.includes(entry.id);
              return (
                <li
                  key={entry.id}
                  className="rounded-xl border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--theme-border)",
                    backgroundColor:
                      "color-mix(in srgb, var(--theme-surface) 93%, white 7%)",
                    boxShadow: "var(--theme-glow)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-(--theme-muted)">
                    <span suppressHydrationWarning>
                      <span title={`Created at ${new Date(entry.created_at).toLocaleString("en-US")}`}>
                        {formatRelativeTime(entry.created_at, hasMounted)}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={isStarring}
                      onClick={() => void handleStar(entry.id)}
                      title={
                        isStarred
                          ? "Remove star"
                          : isStarring
                            ? "Saving star..."
                            : "Add star"
                      }
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-55"
                      style={{
                        borderColor: "var(--theme-border)",
                        backgroundColor: isStarred
                          ? "color-mix(in srgb, var(--theme-accent-soft) 65%, white 35%)"
                          : "transparent",
                        color: "var(--theme-muted)",
                      }}
                    >
                      <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
                      <span>{entry.stars}</span>
                    </button>
                  </div>
                  <p
                    className={`typography-trace reading-block transition-colors duration-400 ${
                      entry.text.length <= SHORT_TRACE_LENGTH ? "typography-trace-short" : ""
                    }`}
                    style={{ textShadow: "0 1px 0 rgba(255, 255, 255, 0.15)" }}
                  >
                    {entry.text}
                  </p>
                  {entry.signature ? (
                    <p className="typography-signature mt-2 text-(--theme-muted)/90">
                      &mdash; {entry.signature}
                    </p>
                  ) : null}
                  <TraceReadInLanguage
                    entryId={entry.id}
                    sourceText={entry.text}
                    variant="surface"
                  />
                </li>
              );
            })}
          </ul>

          {!showAll && hasMoreEntries ? (
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 rounded-b-xl"
              style={{
                background:
                  "linear-gradient(to bottom, color-mix(in srgb, var(--theme-surface) 0%, transparent), var(--theme-surface))",
              }}
            />
          ) : null}
        </div>
      )}

      {hasMoreEntries ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((previous) => !previous)}
            title={showAll ? "Show fewer traces" : "Show more traces"}
            className="inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-1.5 text-xs tracking-wide transition"
            style={{
              borderColor: "var(--theme-border)",
              color: "var(--theme-muted)",
              backgroundColor: "color-mix(in srgb, var(--theme-surface) 90%, white 10%)",
            }}
          >
            {showAll ? "Show less" : "View more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
