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
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-sm text-[color:var(--theme-muted)]">
            Nothing starred yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: "var(--theme-border)",
                  backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, white 6%)",
                  boxShadow: "var(--theme-glow)",
                }}
              >
                <div className="mb-2 flex items-center justify-between text-[11px] text-[color:var(--theme-muted)]">
                  <span suppressHydrationWarning>
                    {formatDate(entry.created_at, hasMounted)}
                  </span>
                  <button
                    type="button"
                    disabled={Boolean(starringEntryIds[entry.id])}
                    onClick={() => void onStar(entry.id)}
                    title={starringEntryIds[entry.id] ? "Saving star..." : "Remove star"}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 disabled:opacity-50"
                    style={{
                      borderColor: "var(--theme-border)",
                      color: "var(--theme-muted)",
                      backgroundColor:
                        "color-mix(in srgb, var(--theme-accent-soft) 65%, white 35%)",
                    }}
                  >
                    <span aria-hidden="true">★</span>
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
            ))}
          </ul>
        )}
      </div>
    </PanelShell>
  );
}
