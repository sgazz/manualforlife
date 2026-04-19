"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { SupportedTranslationLang } from "@/lib/translationLocale";
import {
  getLikelyTraceLanguageHint,
  readNavigatorPreferredTranslationLang,
} from "@/lib/translationLocale";

const sessionTranslationCache = new Map<string, string>();

function cacheKey(entryId: string, lang: string) {
  return `${entryId}\u0000${lang}`;
}

type TraceReadVariant = "surface" | "panel";

type TraceReadInLanguageProps = {
  entryId: string;
  sourceText: string;
  variant?: TraceReadVariant;
};

const translatedBodyClass: Record<TraceReadVariant, string> = {
  surface:
    "typography-trace reading-block text-[0.98rem] leading-[1.55] text-(--theme-text)/62 sm:text-[1.02rem] sm:leading-[1.58] transition-colors duration-300 motion-reduce:transition-none",
  panel:
    "font-serif text-[0.98rem] leading-7 text-(--theme-text)/62 sm:text-[1.05rem] sm:leading-[1.75] transition-opacity duration-300 motion-reduce:transition-none",
};

/** Minimal outline globe (stroke), matches muted icon controls like Live star row. */
function GlobeTranslateIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.4 2.8 2.4 16.2 0 18M12 3c-2.4 2.8-2.4 16.2 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TraceReadInLanguage({
  entryId,
  sourceText,
  variant = "panel",
}: TraceReadInLanguageProps) {
  const hintId = useId();
  const [ready, setReady] = useState(false);
  const [targetLang, setTargetLang] = useState<SupportedTranslationLang | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "visible" | "hidden" | "error">("idle");
  const [translated, setTranslated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const likelyTraceLang = useMemo(
    () => getLikelyTraceLanguageHint(sourceText),
    [sourceText],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTargetLang(readNavigatorPreferredTranslationLang());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const requestTranslation = useCallback(async () => {
    if (!targetLang) {
      return;
    }
    const key = cacheKey(entryId, targetLang);
    const cached = sessionTranslationCache.get(key);
    if (cached) {
      setTranslated(cached);
      setPhase("visible");
      setErrorMessage(null);
      return;
    }

    setPhase("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: sourceText, targetLang }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        translated?: string;
        error?: string;
      };
      if (!response.ok) {
        setErrorMessage(payload.error ?? "Could not translate.");
        setPhase("error");
        return;
      }
      const next = typeof payload.translated === "string" ? payload.translated.trim() : "";
      if (!next) {
        setErrorMessage("Could not translate.");
        setPhase("error");
        return;
      }
      sessionTranslationCache.set(key, next);
      setTranslated(next);
      setPhase("visible");
    } catch {
      setErrorMessage("Network issue.");
      setPhase("error");
    }
  }, [entryId, sourceText, targetLang]);

  if (!ready || !sourceText.trim()) {
    return null;
  }

  if (targetLang === null) {
    return null;
  }

  if (likelyTraceLang !== null && likelyTraceLang === targetLang) {
    return null;
  }

  const showReadControl = phase !== "visible";

  return (
    <div className="mt-1.5 flex flex-col items-stretch gap-0">
      {showReadControl ? (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={phase === "loading"}
            aria-busy={phase === "loading"}
            aria-label="Read in my language"
            title={phase === "loading" ? "Translating…" : "Read in my language"}
            aria-describedby={errorMessage ? hintId : undefined}
            onClick={() => void requestTranslation()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-(--theme-muted)/48 transition-[color,opacity,transform] duration-300 ease-in-out hover:text-(--theme-muted)/78 active:scale-95 disabled:cursor-wait disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--theme-border)/55"
          >
            <GlobeTranslateIcon
              className={
                phase === "loading"
                  ? "motion-safe:animate-pulse motion-reduce:animate-none"
                  : undefined
              }
            />
          </button>
        </div>
      ) : null}

      {phase === "visible" && translated ? (
        <div className="mt-3 border-t border-(--theme-border)/10 pt-2.5">
          <p className="typography-hint mb-1 text-[0.6rem] font-medium tracking-[0.16em] text-(--theme-muted)/42">
            Translated
          </p>
          <p className={translatedBodyClass[variant]}>{translated}</p>
          <button
            type="button"
            onClick={() => setPhase("hidden")}
            className="mt-2.5 inline-flex min-h-9 items-center text-[0.65rem] font-normal tracking-wide text-(--theme-muted)/48 underline decoration-transparent underline-offset-[0.2em] transition-[color,text-decoration-color] duration-200 hover:text-(--theme-muted)/72 hover:decoration-(--theme-muted)/30 motion-reduce:transition-none"
          >
            Hide translation
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p id={hintId} role="status" className="mt-1.5 text-[0.65rem] text-(--theme-muted)/62">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
