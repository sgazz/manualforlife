"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Hero } from "@/components/Hero";
import { InputBox } from "@/components/InputBox";
import { LivePanel } from "@/components/panels/LivePanel";
import { PurposeModal } from "@/components/ui/PurposeModal";
import { ReflectionShareCard } from "@/components/ui/ReflectionShareCard";
import { StarredPanel } from "@/components/panels/StarredPanel";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LiveTrigger } from "@/components/triggers/LiveTrigger";
import { StarredTrigger } from "@/components/triggers/StarredTrigger";
import { useLiveTraces } from "@/hooks/useLiveTraces";
import { useTypingState } from "@/hooks/useTypingState";
import {
  buildSavedTraceFromEntry,
  getSavedTraces,
  savedTraceToEntry,
  sortSavedTracesBySavedAt,
  writeStoredSavedTraces,
  type SavedTrace,
} from "@/lib/savedTraces";
import type {
  Entry,
  LoadingEntryMap,
  PanelType,
  StarActionOptions,
  StarApiResponse,
} from "@/types/ui";

const MAX_LENGTH = 175;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const RECENT_LIVE_LIMIT = 12;
const OLDER_BATCH_SIZE = 12;
/** Matches prior `window.innerWidth < 768` check for panel auto-close. */
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
type EntriesCursor = {
  beforeCreatedAt: string;
  beforeId: string;
};

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
  }
}

export default function Home() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [signature, setSignature] = useState("");
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  const [starringEntryIds, setStarringEntryIds] = useState<LoadingEntryMap>(
    {},
  );
  const [savedTraces, setSavedTraces] = useState<SavedTrace[]>([]);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [initialNextCursor, setInitialNextCursor] = useState<EntriesCursor | null>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSignature, setReflectionSignature] = useState("");
  const isTyping = useTypingState(text, { idleDelayMs: 2600 });

  const closeReflection = useCallback(() => {
    setReflectionOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("entry-text")?.focus({ preventScroll: true });
    });
  }, []);

  const fetchEntries = useCallback(async () => {
    const response = await fetch(`/api/entries?limit=${RECENT_LIVE_LIMIT}`, {
      method: "GET",
    });
    const payload = (await response.json()) as {
      entries?: Array<Entry & { stars?: number; signature?: string | null }>;
      nextCursor?: EntriesCursor | null;
      error?: string;
    };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to load entries.");
      return;
    }

    const normalizedEntries = (payload.entries ?? []).map((entry) => ({
      ...entry,
      stars: typeof entry.stars === "number" ? entry.stars : 0,
      signature: typeof entry.signature === "string" ? entry.signature : null,
    }));
    setEntries(normalizedEntries);
    setInitialNextCursor(payload.nextCursor ?? null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    const storageKey = "visitor-id";
    let id = window.localStorage.getItem(storageKey);
    if (!id) {
      id = window.crypto.randomUUID();
      window.localStorage.setItem(storageKey, id);
    }
    setVisitorId(id);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialEntries() {
      await fetchEntries();
      if (!isMounted) return;
      setIsLoading(false);
    }

    void loadInitialEntries();

    return () => {
      isMounted = false;
    };
  }, [fetchEntries]);

  useEffect(() => {
    setSavedTraces(getSavedTraces());
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      return;
    }

    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };

    return () => {
      window.onTurnstileSuccess = undefined;
    };
  }, []);

  async function handleSubmit(
    formOrEvent:
      | HTMLFormElement
      | { currentTarget?: EventTarget | null; target?: EventTarget | null },
  ) {
    const eventLike =
      formOrEvent && typeof formOrEvent === "object" ? formOrEvent : null;
    const form =
      formOrEvent instanceof HTMLFormElement
        ? formOrEvent
        : eventLike?.currentTarget instanceof HTMLFormElement
          ? eventLike.currentTarget
          : eventLike?.target instanceof HTMLFormElement
            ? eventLike.target
            : null;

    if (!form) {
      setErrorMessage("Could not read the form. Please try again.");
      return false;
    }

    const formData = new FormData(form);
    const website = String(formData.get("website") ?? "");
    const signatureFromForm = String(formData.get("signature") ?? "")
      .trim()
      .slice(0, 30);

    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > MAX_LENGTH) {
      return false;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
          website,
          turnstileToken,
          signature: signatureFromForm || undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Failed to save entry.");
        return false;
      }

      setReflectionText(trimmedText);
      setReflectionSignature(signatureFromForm);
      setReflectionOpen(true);
      setText("");
      setSignature("");
      setTurnstileToken("");
      await fetchEntries();
      return true;
    } catch {
      setErrorMessage("Network error. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  async function handleStar(
    entryId: string,
    options?: StarActionOptions,
  ) {
    if (starringEntryIds[entryId]) {
      return;
    }
    const wasStarred = savedTraces.some((row) => row.id === entryId);

    setEntries((previousEntries) =>
      previousEntries.map((entry) =>
        entry.id === entryId
          ? { ...entry, stars: Math.max(0, entry.stars + (wasStarred ? -1 : 1)) }
          : entry,
      ),
    );

    if (wasStarred) {
      setSavedTraces((previous) => {
        const next = previous.filter((row) => row.id !== entryId);
        writeStoredSavedTraces(next);
        return sortSavedTracesBySavedAt(next);
      });
    } else {
      const baseEntry =
        options?.sourceEntry ?? entries.find((entry) => entry.id === entryId);
      if (baseEntry) {
        const optimisticStars = baseEntry.stars + 1;
        const row = buildSavedTraceFromEntry(
          { ...baseEntry, stars: optimisticStars },
          optimisticStars,
        );
        setSavedTraces((previous) => {
          const next = sortSavedTracesBySavedAt([
            ...previous.filter((t) => t.id !== entryId),
            row,
          ]);
          writeStoredSavedTraces(next);
          return next;
        });
      }
    }

    if (options?.closePanelOnSuccess) {
      setOpenPanel(null);
    }

    if (!visitorId) {
      return;
    }

    setStarringEntryIds((previous) => ({ ...previous, [entryId]: true }));

    try {
      const response = await fetch(`/api/entries/${entryId}/star`, {
        method: wasStarred ? "DELETE" : "POST",
        headers: {
          "x-visitor-id": visitorId,
        },
      });
      const payload = (await response.json()) as StarApiResponse;
      if (!response.ok || typeof payload.stars !== "number") {
        throw new Error(payload.error ?? "Failed to star entry.");
      }
      const serverStars = payload.stars;

      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId ? { ...entry, stars: serverStars } : entry,
        ),
      );

      if (!wasStarred) {
        setSavedTraces((previous) => {
          const hasRow = previous.some((row) => row.id === entryId);
          let next: SavedTrace[];
          if (hasRow) {
            next = previous.map((row) =>
              row.id === entryId ? { ...row, stars: serverStars } : row,
            );
          } else {
            const baseEntry =
              options?.sourceEntry ?? entries.find((entry) => entry.id === entryId);
            if (baseEntry) {
              next = sortSavedTracesBySavedAt([
                ...previous,
                buildSavedTraceFromEntry(
                  { ...baseEntry, stars: serverStars },
                  serverStars,
                ),
              ]);
            } else {
              next = previous;
            }
          }
          writeStoredSavedTraces(next);
          return sortSavedTracesBySavedAt(next);
        });
      }
    } catch {
      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, stars: Math.max(0, entry.stars + (wasStarred ? 1 : -1)) }
            : entry,
        ),
      );
      setErrorMessage("Saved locally. Could not sync star count right now.");
    } finally {
      setStarringEntryIds((previous) => {
        const next = { ...previous };
        delete next[entryId];
        return next;
      });
    }
  }

  const starredEntries = useMemo(
    () => savedTraces.map(savedTraceToEntry),
    [savedTraces],
  );
  const starredEntryIds = useMemo(
    () => savedTraces.map((row) => row.id),
    [savedTraces],
  );

  return (
    <ThemeProvider>
      <ThemedContent
        text={text}
        setText={setText}
        isSubmitting={isSubmitting}
        turnstileToken={turnstileToken}
        handleSubmit={handleSubmit}
        signature={signature}
        setSignature={setSignature}
        errorMessage={errorMessage}
        entries={entries}
        isLoading={isLoading}
        isTyping={isTyping}
        starredEntries={starredEntries}
        openPanel={openPanel}
        setOpenPanel={setOpenPanel}
        onStar={handleStar}
        starringEntryIds={starringEntryIds}
        starredEntryIds={starredEntryIds}
        initialNextCursor={initialNextCursor}
        setErrorMessage={setErrorMessage}
        reflectionOpen={reflectionOpen}
        reflectionText={reflectionText}
        reflectionSignature={reflectionSignature}
        onCloseReflection={closeReflection}
      />
    </ThemeProvider>
  );
}

type ThemedContentProps = {
  text: string;
  setText: (value: string) => void;
  isSubmitting: boolean;
  turnstileToken: string;
  handleSubmit: (form: HTMLFormElement) => Promise<boolean>;
  signature: string;
  setSignature: (value: string) => void;
  errorMessage: string | null;
  entries: Entry[];
  isLoading: boolean;
  isTyping: boolean;
  starredEntries: Entry[];
  openPanel: PanelType;
  setOpenPanel: (panel: PanelType) => void;
  onStar: (entryId: string, options?: StarActionOptions) => Promise<void>;
  starringEntryIds: LoadingEntryMap;
  starredEntryIds: string[];
  initialNextCursor: EntriesCursor | null;
  setErrorMessage: (value: string | null) => void;
  reflectionOpen: boolean;
  reflectionText: string;
  reflectionSignature: string;
  onCloseReflection: () => void;
};

function ThemedContent({
  text,
  setText,
  isSubmitting,
  turnstileToken,
  handleSubmit,
  signature,
  setSignature,
  errorMessage,
  entries,
  isLoading,
  isTyping,
  starredEntries,
  openPanel,
  setOpenPanel,
  onStar,
  starringEntryIds,
  starredEntryIds,
  initialNextCursor,
  setErrorMessage,
  reflectionOpen,
  reflectionText,
  reflectionSignature,
  onCloseReflection,
}: ThemedContentProps) {
  const [showHint, setShowHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isWritingFocused, setIsWritingFocused] = useState(false);
  const [isPurposeOpen, setIsPurposeOpen] = useState(false);
  const [olderEntries, setOlderEntries] = useState<Entry[]>([]);
  const [nextCursor, setNextCursor] = useState<EntriesCursor | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const { liveEntries, newlyAddedIds } = useLiveTraces({
    initialEntries: entries,
    paused: isTyping,
    limit: RECENT_LIVE_LIMIT,
  });
  const recentEntries = liveEntries;

  const hasUnreadLiveEntries = openPanel !== "live" && newlyAddedIds.length > 0;
  const hasStartedThought = text.trim().length > 0;
  const isFocusModeActive = isTyping || (isWritingFocused && text.trim().length > 0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setShowHint(window.localStorage.getItem("theme-hint-dismissed") !== "true");
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const sync = () => {
      setIsMobile(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!showHint) {
      return;
    }

    const timer = setTimeout(() => {
      setShowHint(false);
      window.localStorage.setItem("theme-hint-dismissed", "true");
    }, 4500);

    return () => {
      clearTimeout(timer);
    };
  }, [showHint]);

  useEffect(() => {
    setOlderEntries([]);
    setNextCursor(initialNextCursor);
  }, [entries, initialNextCursor]);

  useEffect(() => {
    setOlderEntries((previous) => {
      if (previous.length === 0) {
        return previous;
      }
      const recentIds = new Set(recentEntries.map((entry) => entry.id));
      return previous.filter((entry) => !recentIds.has(entry.id));
    });
  }, [recentEntries]);

  const loadOlderEntries = useCallback(async () => {
    if (isLoadingOlder || !nextCursor) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      const response = await fetch(
        `/api/entries?limit=${OLDER_BATCH_SIZE}&beforeCreatedAt=${encodeURIComponent(nextCursor.beforeCreatedAt)}&beforeId=${encodeURIComponent(nextCursor.beforeId)}`,
      );
      const payload = (await response.json()) as {
        entries?: Array<Entry & { stars?: number; signature?: string | null }>;
        nextCursor?: EntriesCursor | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load older traces.");
      }

      const normalized = (payload.entries ?? []).map((entry) => ({
        ...entry,
        stars: typeof entry.stars === "number" ? entry.stars : 0,
        signature: typeof entry.signature === "string" ? entry.signature : null,
      }));

      setOlderEntries((previous) => {
        const recentIds = new Set(recentEntries.map((entry) => entry.id));
        const merged = [...previous, ...normalized].filter((entry) => !recentIds.has(entry.id));
        return merged.filter(
          (entry, index, array) =>
            array.findIndex((candidate) => candidate.id === entry.id) === index,
        );
      });
      setNextCursor(payload.nextCursor ?? null);
      setErrorMessage(null);
    } catch {
      setErrorMessage("Could not load earlier traces right now. Please try again.");
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, nextCursor, recentEntries, setErrorMessage]);

  return (
    <main className="relative flex min-h-dvh items-start justify-center pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:pl-6 sm:pr-6 sm:pt-14 sm:pb-14">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${
          isFocusModeActive ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle at center, transparent 22%, color-mix(in srgb, var(--theme-text) 14%, transparent) 100%)",
        }}
      />
      <div
        className={`bf-toast pointer-events-none fixed left-1/2 z-30 hidden -translate-x-1/2 rounded-full border px-4 py-2 text-xs tracking-wide transition-[opacity,transform] duration-400 top-[max(1.25rem,env(safe-area-inset-top,0px))] sm:block ${
          showHint ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-surface)",
          color: "var(--theme-muted)",
          boxShadow: "var(--theme-shadow-soft), var(--theme-glow)",
        }}
      >
        Shift + scroll or use arrow keys to change mood.
      </div>
      <div
        className="relative z-10 w-full max-w-3xl space-y-6 rounded-3xl transition-[opacity,transform] duration-400 sm:space-y-10"
      >
        <LiveTrigger
          isOpen={openPanel === "live"}
          hasUnread={hasUnreadLiveEntries}
          isHushed={hasStartedThought}
          onToggle={() =>
            setOpenPanel(openPanel === "live" ? null : "live")
          }
        />
        <StarredTrigger
          isOpen={openPanel === "starred"}
          isHushed={hasStartedThought}
          onToggle={() =>
            setOpenPanel(openPanel === "starred" ? null : "starred")
          }
        />
        <LivePanel
          isOpen={openPanel === "live"}
          onClose={() => setOpenPanel(null)}
          isLoading={isLoading}
          isTyping={isTyping}
          entries={recentEntries}
          olderEntries={olderEntries}
          hasMoreOlderEntries={Boolean(nextCursor)}
          isLoadingOlderEntries={isLoadingOlder}
          onLoadOlderEntries={loadOlderEntries}
          newlyAddedIds={newlyAddedIds}
          onStar={(entryId, starOpts) =>
            onStar(entryId, {
              ...starOpts,
              closePanelOnSuccess: isMobile,
            })
          }
          starringEntryIds={starringEntryIds}
          starredEntryIds={starredEntryIds}
        />
        <StarredPanel
          isOpen={openPanel === "starred"}
          onClose={() => setOpenPanel(null)}
          entries={starredEntries}
          onStar={(entryId, starOpts) =>
            onStar(entryId, {
              ...starOpts,
              closePanelOnSuccess: isMobile,
            })
          }
          starringEntryIds={starringEntryIds}
        />
        <div
          className={`-mx-1 px-1 transition-opacity duration-300 motion-reduce:transition-none sm:mx-0 sm:px-0 ${
            hasStartedThought ? "opacity-86 sm:opacity-88" : "opacity-100"
          }`}
        >
          <Hero />
        </div>
        <div className="pt-2 sm:pt-0">
          <InputBox
            value={text}
            signature={signature}
            maxLength={MAX_LENGTH}
            isSubmitting={isSubmitting}
            turnstileSiteKey={TURNSTILE_SITE_KEY || undefined}
            hasTurnstileToken={Boolean(turnstileToken)}
            onChange={setText}
            onSignatureChange={setSignature}
            onSubmit={handleSubmit}
            onFocusChange={setIsWritingFocused}
            deferPostSubmitToParent
          />
        </div>
        {errorMessage ? (
          <p
            className="rounded-xl border px-4 py-3 text-sm transition-colors duration-400"
            style={{
              borderColor: "var(--theme-error-border)",
              backgroundColor: "var(--theme-error-bg)",
              color: "var(--theme-error-text)",
            }}
          >
            {errorMessage}
          </p>
        ) : null}
        <section className="pt-1 text-center text-sm text-(--theme-muted) transition-colors duration-400">
          <p>For future generations.</p>
          <button
            type="button"
            onClick={() => setIsPurposeOpen(true)}
            className="inline-flex min-h-11 items-center text-sm text-(--theme-muted)/75 underline decoration-transparent transition hover:decoration-current hover:text-(--theme-muted)"
          >
            Why this exists
          </button>
        </section>
      </div>
      <PurposeModal isOpen={isPurposeOpen} onClose={() => setIsPurposeOpen(false)} />
      {reflectionOpen ? (
        <ReflectionShareCard
          traceText={reflectionText}
          signature={reflectionSignature}
          onClose={onCloseReflection}
        />
      ) : null}
    </main>
  );
}
