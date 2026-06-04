"use client";

import { useEffect } from "react";

const STORAGE_KEY = "mfl-live-nudge-done";
const AUTO_DISMISS_MS = 5000;

type FirstVisitNudgeProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function FirstVisitNudge({ visible, onDismiss }: FirstVisitNudgeProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, "true");
      onDismiss();
    }, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onDismiss, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed z-30 max-w-[min(18rem,calc(100vw-2rem))] opacity-100 transition-opacity duration-500 motion-reduce:transition-none bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 md:bottom-auto md:left-[max(1rem,env(safe-area-inset-left,0px))] md:top-[calc(50%+3.25rem)] md:max-w-[14rem] md:translate-x-0"
    >
      <p
        className="rounded-full border px-4 py-2 text-center text-xs tracking-wide text-(--theme-muted)/82"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--theme-surface) 92%, white 8%)",
          boxShadow: "var(--theme-shadow-soft)",
        }}
      >
        See what others just left
      </p>
    </div>
  );
}

export function isLiveNudgeComplete() {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function markLiveNudgeComplete() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, "true");
}
