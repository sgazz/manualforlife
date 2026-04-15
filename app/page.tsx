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
import type { Entry, LoadingEntryMap, PanelType, StarActionOptions } from "@/types/ui";

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
  const isTyping = useTypingState(text, { idleDelayMs: 2600 });

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
    const fromSession = window.sessionStorage.getItem("starred-entry-ids");
    if (!fromSession) {
      return;
    }
    try {
      const parsed = JSON.parse(fromSession) as unknown;
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        setStarredEntryIds(parsed);
      }
    } catch {
      // Ignore invalid session cache.
    }
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
    if (starringEntryIds[entryId] || starredEntryIds.includes(entryId)) {
      return;
    }

    setEntries((previousEntries) =>
      previousEntries.map((entry) =>
        entry.id === entryId ? { ...entry, stars: entry.stars + 1 } : entry,
      ),
    );
    setStarringEntryIds((previous) => ({ ...previous, [entryId]: true }));

    try {
      const response = await fetch(`/api/entries/${entryId}/star`, { method: "POST" });
      const payload = (await response.json()) as { stars?: number; error?: string };
      if (!response.ok || typeof payload.stars !== "number") {
        throw new Error(payload.error ?? "Failed to star entry.");
      }

      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId ? { ...entry, stars: payload.stars ?? entry.stars } : entry,
        ),
      );
      setStarredEntryIds((previous) => {
        if (previous.includes(entryId)) {
          return previous;
        }
        const next = [...previous, entryId];
        window.sessionStorage.setItem("starred-entry-ids", JSON.stringify(next));
        return next;
      });
      if (options?.closePanelOnSuccess) {
        setOpenPanel(null);
      }
    } catch {
      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId ? { ...entry, stars: Math.max(0, entry.stars - 1) } : entry,
        ),
      );
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
  openPanel,
  setOpenPanel,
  onStar,
  starringEntryIds,
  starredEntryIds,
}: ThemedContentProps) {
  const { themes, currentTheme, currentThemeIndex } = useTheme();
  const [showHint, setShowHint] = useState(false);
  const { liveEntries, newlyAddedIds } = useLiveTraces({
    initialEntries: entries,
    paused: isTyping,
    limit: 20,
  });

  const starredEntries = liveEntries.filter((entry) =>
    starredEntryIds.includes(entry.id),
  );
  const hasUnreadLiveEntries = openPanel !== "live" && newlyAddedIds.length > 0;

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
    <main className="flex min-h-svh items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <div
        className={`pointer-events-none fixed top-5 left-1/2 z-30 -translate-x-1/2 rounded-full border px-4 py-2 text-xs tracking-wide backdrop-blur-md transition-all duration-[400ms] ${
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
        className="w-full max-w-3xl space-y-8 rounded-3xl p-1 transition-transform duration-[400ms]"
        style={{ boxShadow: "var(--theme-shadow-soft)" }}
      >
        <LiveTrigger
          isOpen={openPanel === "live"}
          hasUnread={hasUnreadLiveEntries}
          onToggle={() =>
            setOpenPanel(openPanel === "live" ? null : "live")
          }
        />
        <StarredTrigger
          isOpen={openPanel === "starred"}
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
        />
        <Hero />
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
        />
        {errorMessage ? (
          <p
            className="rounded-xl border px-4 py-3 text-sm transition-colors duration-[400ms]"
            style={{
              borderColor: "var(--theme-error-border)",
              backgroundColor: "var(--theme-error-bg)",
              color: "var(--theme-error-text)",
            }}
          >
            {errorMessage}
          </p>
        ) : null}
        <footer className="pt-2 text-center text-sm text-[color:var(--theme-muted)] transition-colors duration-[400ms]">
          For future generations.
        </footer>
        <p className="text-center text-xs tracking-wide text-[color:var(--theme-muted)]/80 transition-colors duration-[400ms]">
          {currentThemeIndex + 1} / {themes.length} - {currentTheme.label}
        </p>
      </div>
    </main>
  );
}
