"use client";

import { ShareTraceCard } from "@/components/trace/ShareTraceCard";
import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { CopyTraceTextButton } from "@/components/ui/CopyTraceTextButton";
import { NativeShareButton } from "@/components/ui/NativeShareButton";
import { ShareImageButton } from "@/components/ui/ShareImageButton";
import type { EditorsChoiceItem } from "@/lib/editorsChoice";
import type { Entry, LoadingEntryMap, StarActionOptions } from "@/types/ui";

type EditorsChoiceProps = {
  items: EditorsChoiceItem[];
  subdued?: boolean;
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  starringEntryIds: LoadingEntryMap;
  starredEntryIds: string[];
  resolveEntry: (entryId: string) => Entry | undefined;
};

function EditorsChoiceCard({
  item,
  onStar,
  isStarring,
  isStarred,
  sourceEntry,
}: {
  item: EditorsChoiceItem;
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  isStarring: boolean;
  isStarred: boolean;
  sourceEntry?: Entry;
}) {
  const hasEntry = Boolean(item.entryId);

  return (
    <article className="flex h-full flex-col">
      <p className="typography-hint mb-3 text-center text-[0.65rem] tracking-[0.14em] text-(--theme-muted)/52 uppercase">
        Selected
      </p>
      <ShareTraceCard
        text={item.text}
        signature={item.signature}
        tone={item.tone}
        variant="modal"
        className="flex-1"
      />
      <div
        className="mt-4 flex flex-wrap items-start justify-center gap-x-1 gap-y-2"
        role="group"
        aria-label={`Actions for Selected Trace: ${item.text}`}
      >
        {hasEntry && item.entryId ? (
          <>
            <CopyTraceLinkButton entryId={item.entryId} label="Copy" variant="inline" />
            <NativeShareButton
              traceText={item.text}
              entryId={item.entryId}
              label="Share"
              variant="inline"
            />
            <ShareImageButton
              traceText={item.text}
              entryId={item.entryId}
              signature={item.signature}
              createdAt={sourceEntry?.created_at}
              variant="inline"
            />
            {sourceEntry ? (
              <button
                type="button"
                disabled={isStarring}
                onClick={() => void onStar(item.entryId!, { sourceEntry })}
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
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-2 text-xs text-(--theme-muted)/55 transition-[color,transform] duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) active:scale-95 disabled:opacity-45 motion-reduce:transition-none"
              >
                <span aria-hidden="true">{isStarred ? "★" : "☆"}</span>
                <span className="tabular-nums">{item.stars}</span>
              </button>
            ) : null}
          </>
        ) : (
          <>
            <CopyTraceTextButton
              traceText={item.text}
              label="Copy"
              variant="inline"
              includeAppUrl
            />
            <NativeShareButton traceText={item.text} label="Share" variant="inline" />
            <ShareImageButton
              traceText={item.text}
              signature={item.signature}
              variant="inline"
            />
          </>
        )}
      </div>
    </article>
  );
}

export function EditorsChoice({
  items,
  subdued = false,
  onStar,
  starringEntryIds,
  starredEntryIds,
  resolveEntry,
}: EditorsChoiceProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="editors-choice-title"
      className={`transition-opacity duration-300 motion-reduce:transition-none ${
        subdued ? "opacity-55" : "opacity-100"
      }`}
    >
      <div className="text-center">
        <h2
          id="editors-choice-title"
          className="typography-hint text-[0.7rem] font-medium tracking-[0.16em] text-(--theme-muted)/58 uppercase"
        >
          Editor&apos;s Choice
        </h2>
        <p className="mt-2 font-serif text-[1.05rem] leading-snug text-(--theme-text)/82 sm:text-[1.15rem]">
          Quiet traces selected for their clarity.
        </p>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 lg:grid-cols-3 lg:gap-4">
        {items.map((item) => (
          <li key={item.text} className="min-h-0">
            <EditorsChoiceCard
              item={item}
              onStar={onStar}
              isStarring={item.entryId ? Boolean(starringEntryIds[item.entryId]) : false}
              isStarred={item.entryId ? starredEntryIds.includes(item.entryId) : false}
              sourceEntry={item.entryId ? resolveEntry(item.entryId) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
