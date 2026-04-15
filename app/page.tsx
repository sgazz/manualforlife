"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { EntriesList } from "@/components/EntriesList";
import { Hero } from "@/components/Hero";
import { InputBox } from "@/components/InputBox";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";

type Entry = {
  id: string;
  text: string;
  created_at: string;
  stars: number;
};

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
  const [starringEntryIds, setStarringEntryIds] = useState<Record<string, boolean>>(
    {},
  );
  const [starredEntryIds, setStarredEntryIds] = useState<string[]>([]);

  const fetchEntries = useCallback(async () => {
    const response = await fetch("/api/entries", { method: "GET" });
    const payload = (await response.json()) as {
      entries?: Array<Entry & { stars?: number }>;
      error?: string;
    };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to load entries.");
      return;
    }

    const normalizedEntries = (payload.entries ?? []).map((entry) => ({
      ...entry,
      stars: typeof entry.stars === "number" ? entry.stars : 0,
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const website = String(formData.get("website") ?? "");

    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > MAX_LENGTH) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setErrorMessage(null);

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ text: trimmedText, website, turnstileToken }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to save entry.");
    } else {
      setText("");
      setTurnstileToken("");
      await fetchEntries();
    }

    setIsLoading(false);
    setIsSubmitting(false);
  }

  async function handleStar(entryId: string) {
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
    } catch {
      setEntries((previousEntries) =>
        previousEntries.map((entry) =>
          entry.id === entryId ? { ...entry, stars: Math.max(0, entry.stars - 1) } : entry,
        ),
      );
      throw new Error("Could not save your star right now.");
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
        errorMessage={errorMessage}
        entries={entries}
        isLoading={isLoading}
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
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  errorMessage: string | null;
  entries: Entry[];
  isLoading: boolean;
  onStar: (entryId: string) => Promise<void>;
  starringEntryIds: Record<string, boolean>;
  starredEntryIds: string[];
};

function ThemedContent({
  text,
  setText,
  isSubmitting,
  turnstileToken,
  handleSubmit,
  errorMessage,
  entries,
  isLoading,
  onStar,
  starringEntryIds,
  starredEntryIds,
}: ThemedContentProps) {
  const { themes, currentTheme, currentThemeIndex } = useTheme();
  const [showHint, setShowHint] = useState(false);

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
        <Hero />
        <InputBox
          value={text}
          maxLength={MAX_LENGTH}
          isSubmitting={isSubmitting}
          turnstileSiteKey={TURNSTILE_SITE_KEY || undefined}
          hasTurnstileToken={Boolean(turnstileToken)}
          onChange={setText}
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
        <EntriesList
          entries={entries}
          isLoading={isLoading}
          onStar={onStar}
          starringEntryIds={starringEntryIds}
          starredEntryIds={starredEntryIds}
        />
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
