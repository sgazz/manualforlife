"use client";

import { useEffect, useState } from "react";

function formatCountLabel(count: number) {
  const formatted = count.toLocaleString("en-US");
  const noun = count === 1 ? "thought" : "thoughts";
  return `${formatted} ${noun} left by strangers`;
}

export function SocialProofCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      try {
        const response = await fetch("/api/entries/count", { method: "GET" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { count?: number };
        if (
          cancelled ||
          typeof payload.count !== "number" ||
          !Number.isFinite(payload.count) ||
          payload.count <= 0
        ) {
          return;
        }
        setCount(payload.count);
      } catch {
        // Hide gracefully on failure.
      }
    }

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) {
    return null;
  }

  return (
    <p
      className="typography-hint text-[0.8125rem] tracking-wide text-(--theme-muted)/62 transition-colors duration-400 sm:text-sm"
      aria-live="polite"
    >
      {formatCountLabel(count)}
    </p>
  );
}
