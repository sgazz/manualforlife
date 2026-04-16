"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panels/PanelShell";
import type { Entry, LoadingEntryMap } from "@/types/ui";

type StarredPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  onStar: (entryId: string) => Promise<void>;
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
      <div className="h-[calc(100vh-5rem)] overflow-y-auto pr-1">
        <div className="pointer-events-none sticky top-0 z-10 h-6 bg-linear-to-b from-[#f8f5f0] to-transparent" />
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-sm text-(--theme-muted)">
            Nothing starred yet.
          </p>
        ) : (
          <ul className="space-y-8 pb-6">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="border-b border-(--theme-border)/30 pb-6"
              >
                <div className="mb-2 flex items-center justify-between text-xs text-(--theme-muted)/60">
                  <span
                    suppressHydrationWarning
                    className="group/date inline-flex items-center gap-2"
                    title={new Date(entry.created_at).toLocaleString("en-US")}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-(--theme-muted)/45 transition-colors duration-300 ease-in-out group-hover/date:bg-(--theme-muted)/65"
                    />
                    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover/date:max-w-28 group-hover/date:opacity-100 group-focus-within/date:max-w-28 group-focus-within/date:opacity-100">
                      {formatDate(entry.created_at, hasMounted)}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(starringEntryIds[entry.id])}
                    onClick={() => void onStar(entry.id)}
                    title={starringEntryIds[entry.id] ? "Saving star..." : "Remove star"}
                    className="inline-flex items-center gap-1 text-xs text-(--theme-muted)/65 transition-colors duration-300 ease-in-out hover:text-(--theme-muted) disabled:opacity-45"
                  >
                    <span aria-hidden="true">★</span>
                    <span>{entry.stars}</span>
                  </button>
                </div>
                <p className="font-serif text-lg leading-8 text-(--theme-text)">{entry.text}</p>
                {entry.signature ? (
                  <p className="mt-3 text-xs italic text-(--theme-muted)/70">
                    &mdash; {entry.signature}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="pointer-events-none sticky bottom-0 z-10 h-8 bg-linear-to-t from-[#f8f5f0] to-transparent" />
      </div>
    </PanelShell>
  );
}
