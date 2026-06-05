"use client";

import { useMemo, useState } from "react";
import { ShareTraceCard } from "@/components/trace/ShareTraceCard";
import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { NativeShareButton } from "@/components/ui/NativeShareButton";
import { ShareImageButton } from "@/components/ui/ShareImageButton";
import {
  MOST_SAVED_DEFAULT_PERIOD,
  MOST_SAVED_PERIOD_OPTIONS,
  selectMostSaved,
  type MostSavedPeriod,
} from "@/lib/mostSaved";
import type { Entry, LoadingEntryMap, StarActionOptions } from "@/types/ui";

type MostSavedProps = {
  entries: Entry[];
  excludeEntryIds?: string[];
  isLoading: boolean;
  subdued?: boolean;
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  starringEntryIds: LoadingEntryMap;
  starredEntryIds: string[];
};

function MostSavedPeriodFilter({
  value,
  onChange,
}: {
  value: MostSavedPeriod;
  onChange: (value: MostSavedPeriod) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Most saved time period"
      className="ios-scroll-touch -mx-1 flex justify-center gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {MOST_SAVED_PERIOD_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1 text-[0.6875rem] tracking-wide transition-[color,background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-1 motion-reduce:transition-none ${
              isSelected
                ? "border-(--theme-accent-soft)/65 bg-(--theme-accent)/8 text-(--theme-text)/85"
                : "border-transparent bg-transparent text-(--theme-muted)/62 hover:text-(--theme-muted)/78"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MostSavedCard({
  entry,
  onStar,
  isStarring,
  isStarred,
}: {
  entry: Entry;
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  isStarring: boolean;
  isStarred: boolean;
}) {
  return (
    <article className="flex h-full flex-col">
      <ShareTraceCard
        text={entry.text}
        signature={entry.signature}
        tone={entry.tone}
        variant="modal"
        className="flex-1"
      />
      <div
        className="mt-4 flex flex-wrap items-start justify-center gap-x-1 gap-y-2"
        role="group"
        aria-label={`Actions for Saved Trace: ${entry.text}`}
      >
        <CopyTraceLinkButton entryId={entry.id} label="Copy" variant="inline" />
        <NativeShareButton
          traceText={entry.text}
          entryId={entry.id}
          label="Share"
          variant="inline"
        />
        <ShareImageButton
          traceText={entry.text}
          entryId={entry.id}
          signature={entry.signature}
          createdAt={entry.created_at}
          variant="inline"
        />
        <button
          type="button"
          disabled={isStarring}
          onClick={() => void onStar(entry.id, { sourceEntry: entry })}
          aria-label={
            isStarred
              ? "Remove Saved Trace"
              : isStarring
                ? "Saving Trace"
                : "Save Trace"
          }
          title={
            isStarred ? "Remove save" : isStarring ? "Saving..." : "Save Trace"
          }
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-xs text-(--theme-muted)/55 transition-[color,transform] duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) active:scale-95 disabled:opacity-45 motion-reduce:transition-none"
        >
          <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
        </button>
      </div>
    </article>
  );
}

export function MostSaved({
  entries,
  excludeEntryIds = [],
  isLoading,
  subdued = false,
  onStar,
  starringEntryIds,
  starredEntryIds,
}: MostSavedProps) {
  const [period, setPeriod] = useState<MostSavedPeriod>(MOST_SAVED_DEFAULT_PERIOD);

  const traces = useMemo(
    () => selectMostSaved(entries, period, { excludeEntryIds }),
    [entries, excludeEntryIds, period],
  );

  if (isLoading) {
    return null;
  }

  return (
    <section
      aria-labelledby="most-saved-title"
      className={`transition-opacity duration-300 motion-reduce:transition-none ${
        subdued ? "opacity-55" : "opacity-100"
      }`}
    >
      <div className="text-center">
        <h2
          id="most-saved-title"
          className="typography-hint text-[0.7rem] font-medium tracking-[0.16em] text-(--theme-muted)/58 uppercase"
        >
          Most Saved Traces
        </h2>
        <p className="mt-2 font-serif text-[1.05rem] leading-snug text-(--theme-text)/82 sm:text-[1.15rem]">
          Thoughts people chose to keep.
        </p>
      </div>

      <div className="mt-5 sm:mt-6">
        <MostSavedPeriodFilter value={period} onChange={setPeriod} />
      </div>

      {traces.length === 0 ? (
        <div className="mt-6 text-center sm:mt-7">
          <p className="mx-auto max-w-md text-sm leading-7 text-(--theme-muted)/75">
            No Traces Yet for this period.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-(--theme-muted)/58">
            The archive is still being written.
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-3 lg:gap-4">
          {traces.map((entry) => (
            <li key={entry.id} className="min-h-0">
              <MostSavedCard
                entry={entry}
                onStar={onStar}
                isStarring={Boolean(starringEntryIds[entry.id])}
                isStarred={starredEntryIds.includes(entry.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
