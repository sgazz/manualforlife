"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panels/PanelShell";
import { ToneBadge } from "@/components/ToneBadge";
import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { ShareImageButton } from "@/components/ui/ShareImageButton";
import { TraceReadInLanguage } from "@/components/ui/TraceReadInLanguage";
import type { Entry, LoadingEntryMap, StarActionOptions } from "@/types/ui";

type StarredPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  starringEntryIds: LoadingEntryMap;
};

function formatDate(dateString: string, hasMounted: boolean) {
  if (!hasMounted) return "recently";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function StarredPanel({
  isOpen,
  onClose,
  entries,
  onStar,
  starringEntryIds,
}: StarredPanelProps) {
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
    <PanelShell side="right" isOpen={isOpen} onClose={onClose} title="Starred Traces">
      <div className="ios-scroll-touch min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="pointer-events-none sticky top-0 z-10 h-6 bg-linear-to-b from-[#f8f5f0] to-transparent" />
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-sm text-(--theme-muted)">
            Save a trace that stays with you. Your collection will appear here.
          </p>
        ) : (
          <ul className="space-y-7 pb-6 sm:space-y-8">
            {entries.map((entry) => (
              <li key={entry.id} className="pb-5 sm:pb-6">
                <p className="font-serif text-[1.03rem] leading-7 text-(--theme-text) sm:text-lg sm:leading-8">
                  {entry.text}
                </p>
                {entry.signature ? (
                  <p className="mt-3 text-xs italic text-(--theme-muted)/70">
                    &mdash; {entry.signature}
                  </p>
                ) : null}
                <TraceReadInLanguage entryId={entry.id} sourceText={entry.text} variant="panel" />
                <div className="mt-3.5 flex items-center justify-between text-xs text-(--theme-muted)/55">
                  <span
                    suppressHydrationWarning
                    className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
                    title={new Date(entry.created_at).toLocaleString("en-US")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-(--theme-muted)/40" />
                      <span className="whitespace-nowrap">{formatDate(entry.created_at, hasMounted)}</span>
                    </span>
                    <ToneBadge tone={entry.tone} />
                  </span>
                  <div className="flex items-center gap-0.5">
                    <CopyTraceLinkButton entryId={entry.id} />
                    <ShareImageButton
                      traceText={entry.text}
                      entryId={entry.id}
                      signature={entry.signature}
                      createdAt={entry.created_at}
                      variant="inline"
                    />
                    <button
                      type="button"
                      disabled={Boolean(starringEntryIds[entry.id])}
                      onClick={() => void onStar(entry.id)}
                      aria-label={
                        starringEntryIds[entry.id] ? "Saving star" : "Remove Saved Trace"
                      }
                      title={starringEntryIds[entry.id] ? "Saving star..." : "Remove star"}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-xs text-(--theme-muted)/55 transition-colors duration-300 ease-in-out hover:text-(--theme-muted)/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) disabled:opacity-45"
                    >
                      <span aria-hidden="true">★</span>
                      <span className="tabular-nums">{entry.stars}</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div aria-hidden="true" className="h-6 sm:h-8" />
        <div className="pointer-events-none sticky bottom-0 z-10 h-8 bg-linear-to-t from-[#f8f5f0] to-transparent" />
      </div>
    </PanelShell>
  );
}
