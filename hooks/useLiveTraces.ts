"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Entry } from "@/types/ui";

type UseLiveTracesOptions = {
  initialEntries: Entry[];
  paused: boolean;
  limit?: number;
};

type UseLiveTracesResult = {
  liveEntries: Entry[];
  newlyAddedIds: string[];
  setLiveEntriesFromSource: (entries: Entry[]) => void;
};

function normalizeEntry(input: Partial<Entry> & { id: string }): Entry {
  return {
    id: input.id,
    text: typeof input.text === "string" ? input.text : "",
    created_at: typeof input.created_at === "string" ? input.created_at : new Date().toISOString(),
    stars: typeof input.stars === "number" ? input.stars : 0,
    signature: typeof input.signature === "string" ? input.signature : null,
  };
}

export function useLiveTraces({
  initialEntries,
  paused,
  limit = 20,
}: UseLiveTracesOptions): UseLiveTracesResult {
  const [liveEntries, setLiveEntries] = useState<Entry[]>(() =>
    initialEntries.slice(0, limit),
  );
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const pausedRef = useRef(paused);
  const queuedEntriesRef = useRef<Entry[]>([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (paused || queuedEntriesRef.current.length === 0) {
      return;
    }

    const pending = [...queuedEntriesRef.current];
    queuedEntriesRef.current = [];
    const frame = window.requestAnimationFrame(() => {
      setLiveEntries((previous) => {
        const merged = [...pending, ...previous].reduce<Entry[]>(
          (accumulator, entry) => {
            if (!accumulator.some((existing) => existing.id === entry.id)) {
              accumulator.push(entry);
            }
            return accumulator;
          },
          [],
        );
        merged.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        return merged.slice(0, limit);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [limit, paused]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLiveEntries((previous) => {
        const merged = [...initialEntries, ...previous].reduce<Entry[]>(
          (accumulator, entry) => {
            if (!accumulator.some((existing) => existing.id === entry.id)) {
              accumulator.push(entry);
            }
            return accumulator;
          },
          [],
        );
        merged.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        return merged.slice(0, limit);
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [initialEntries, limit]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.WebSocket === "undefined" ||
      !(
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      )
    ) {
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("entries-live-feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "entries" },
          (payload) => {
            const nextEntry = normalizeEntry(payload.new as Entry);
            if (pausedRef.current) {
              queuedEntriesRef.current = [
                nextEntry,
                ...queuedEntriesRef.current.filter((entry) => entry.id !== nextEntry.id),
              ].slice(0, limit);
              return;
            }

            setLiveEntries((previous) =>
              [nextEntry, ...previous.filter((entry) => entry.id !== nextEntry.id)].slice(
                0,
                limit,
              ),
            );
            setNewlyAddedIds((previous) => [
              nextEntry.id,
              ...previous.filter((id) => id !== nextEntry.id),
            ]);
            window.setTimeout(() => {
              setNewlyAddedIds((previous) => previous.filter((id) => id !== nextEntry.id));
            }, 1400);
          },
        )
        .subscribe();
    } catch {
      return;
    }

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [limit]);

  function setLiveEntriesFromSource(entries: Entry[]) {
    setLiveEntries(entries.slice(0, limit));
  }

  return {
    liveEntries,
    newlyAddedIds,
    setLiveEntriesFromSource,
  };
}
