"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { EntriesList } from "@/components/EntriesList";
import { Hero } from "@/components/Hero";
import { InputBox } from "@/components/InputBox";

type Entry = {
  id: string;
  text: string;
  created_at: string;
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

  const fetchEntries = useCallback(async () => {
    const response = await fetch("/api/entries", { method: "GET" });
    const payload = (await response.json()) as {
      entries?: Entry[];
      error?: string;
    };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Failed to load entries.");
      return;
    }

    setEntries(payload.entries ?? []);
    setErrorMessage(null);
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

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <div className="w-full max-w-3xl space-y-8">
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <EntriesList entries={entries} isLoading={isLoading} />
        <footer className="pt-2 text-center text-sm text-slate-500">
          For future generations.
        </footer>
      </div>
    </main>
  );
}
