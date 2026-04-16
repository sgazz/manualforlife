"use client";

import { useCallback, useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { InputBox } from "@/components/InputBox";
import { LivePanel } from "@/components/panels/LivePanel";
import { StarredPanel } from "@/components/panels/StarredPanel";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LiveTrigger } from "@/components/triggers/LiveTrigger";
import { StarredTrigger } from "@/components/triggers/StarredTrigger";
import { useLiveTraces } from "@/hooks/useLiveTraces";
import { useTheme } from "@/hooks/useTheme";
import { useTypingState } from "@/hooks/useTypingState";
import type {
  Entry,
  LoadingEntryMap,
  PanelType,
  StarActionOptions,
  StarApiResponse,
} from "@/types/ui";

const MAX_LENGTH = 175;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

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
  const [starredEntryIds, setStarredEntryIds] = useState<string[]>([]);
  const [starredEntries, setStarredEntries] = useState<Entry[]>([]);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const isTyping = useTypingState(text, { idleDelayMs: 2600 });

  const fetchStarredEntries = useCallback(async () => {
    if (!visitorId) {
      setStarredEntries([]);
      setStarredEntryIds([]);
      return;
    }

    const response = await fetch("/api/entries/starred", {
      method: "GET",
      headers: {
        "x-visitor-id": visitorId,
      },
    });
    const payload = (await response.json()) as {
      entries?: Array<Entry & { stars?: number; signature?: string | null }>;
      error?: string;
    };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to load starred entries.");
      return;
    }

    const normalizedEntries = (payload.entries ?? []).map((entry) => ({
      ...entry,
      stars: typeof entry.stars === "number" ? entry.stars : 0,
      signature: typeof entry.signature === "string" ? entry.signature : null,
    }));
    setStarredEntries(normalizedEntries);
    setStarredEntryIds(normalizedEntries.map((entry) => entry.id));
  }, [visitorId]);

  const fetchEntries = useCallback(async () => {
    const response = await fetch("/api/entries", { method: "GET" });
    const payload = (await response.json()) as {
      entries?: Array<Entry & { stars?: number; signature?: string | null }>;
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
    if (!visitorId) {
      return;
    }
    void fetchStarredEntries();
  }, [fetchStarredEntries, visitorId]);

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
    const wasStarred = starredEntryIds.includes(entryId);

    setEntries((previousEntries) =>
      previousEntries.map((entry) =>
        entry.id === entryId
          ? { ...entry, stars: Math.max(0, entry.stars + (wasStarred ? -1 : 1)) }
          : entry,
      ),
    );
    if (wasStarred) {
      setStarredEntryIds((previous) => previous.filter((id) => id !== entryId));
      setStarredEntries((previous) => previous.filter((entry) => entry.id !== entryId));
    } else {
      setStarredEntryIds((previous) =>
        previous.includes(entryId) ? previous : [...previous, entryId],
      );
    }
    setStarringEntryIds((previous) => ({ ...previous, [entryId]: true }));

    try {
      if (!visitorId) {
        throw new Error("Missing visitor identity.");
      }
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

      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId ? { ...entry, stars: payload.stars ?? entry.stars } : entry,
        ),
      );
      if (payload.alreadyStarred === true || !wasStarred) {
        setStarredEntryIds((previous) => (previous.includes(entryId) ? previous : [...previous, entryId]));
      } else if (wasStarred) {
        setStarredEntryIds((previous) => previous.filter((id) => id !== entryId));
      }
      void fetchStarredEntries();
      if (options?.closePanelOnSuccess) {
        setOpenPanel(null);
      }
    } catch {
      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, stars: Math.max(0, entry.stars + (wasStarred ? 1 : -1)) }
            : entry,
        ),
      );
      if (wasStarred) {
        setStarredEntryIds((previous) =>
          previous.includes(entryId) ? previous : [...previous, entryId],
        );
      } else {
        setStarredEntryIds((previous) => previous.filter((id) => id !== entryId));
      }
      void fetchStarredEntries();
      setErrorMessage("Could not save your star right now.");
    } finally {
      setStarringEntryIds((previous) => {
        const next = { ...previous };
        delete next[entryId];
        return next;
      });
    }
  }

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
}: ThemedContentProps) {
  const { themes, currentTheme, currentThemeIndex } = useTheme();
  const [showHint, setShowHint] = useState(false);
  const [isWritingFocused, setIsWritingFocused] = useState(false);
  const { liveEntries, newlyAddedIds } = useLiveTraces({
    initialEntries: entries,
    paused: isTyping,
    limit: 20,
  });

  const hasUnreadLiveEntries = openPanel !== "live" && newlyAddedIds.length > 0;
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

  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
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
        className={`pointer-events-none fixed top-5 left-1/2 z-30 -translate-x-1/2 rounded-full border px-4 py-2 text-xs tracking-wide backdrop-blur-md transition-all duration-400 ${
          showHint ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
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
        className="relative z-10 w-full max-w-3xl space-y-10 rounded-3xl transition-transform duration-400"
      >
        <LiveTrigger
          isOpen={openPanel === "live"}
          hasUnread={hasUnreadLiveEntries}
          isFocusModeActive={isFocusModeActive}
          onToggle={() =>
            setOpenPanel(openPanel === "live" ? null : "live")
          }
        />
        <StarredTrigger
          isOpen={openPanel === "starred"}
          isFocusModeActive={isFocusModeActive}
          onToggle={() =>
            setOpenPanel(openPanel === "starred" ? null : "starred")
          }
        />
        <LivePanel
          isOpen={openPanel === "live"}
          onClose={() => setOpenPanel(null)}
          isLoading={isLoading}
          entries={liveEntries}
          newlyAddedIds={newlyAddedIds}
          onStar={(entryId) =>
            onStar(entryId, { closePanelOnSuccess: window.innerWidth < 768 })
          }
          starringEntryIds={starringEntryIds}
          starredEntryIds={starredEntryIds}
        />
        <StarredPanel
          isOpen={openPanel === "starred"}
          onClose={() => setOpenPanel(null)}
          entries={starredEntries}
          onStar={(entryId) =>
            onStar(entryId, { closePanelOnSuccess: window.innerWidth < 768 })
          }
          starringEntryIds={starringEntryIds}
        />
        <div
          className={`transition-opacity duration-300 motion-reduce:transition-none ${
            isFocusModeActive ? "opacity-70" : "opacity-100"
          }`}
        >
          <Hero />
        </div>
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
        />
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
        <footer className="pt-2 text-center text-sm text-(--theme-muted) transition-colors duration-400">
          For future generations.
        </footer>
        <p className="text-center text-xs tracking-wide text-(--theme-muted)/80 transition-colors duration-400">
          {currentThemeIndex + 1} / {themes.length} - {currentTheme.label}
        </p>
      </div>
    </main>
  );
}
