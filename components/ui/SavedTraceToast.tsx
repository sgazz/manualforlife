"use client";

import { useEffect } from "react";

type SavedTraceToastProps = {
  visible: boolean;
  onHide: () => void;
};

const AUTO_HIDE_MS = 4200;

export function SavedTraceToast({ visible, onHide }: SavedTraceToastProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setTimeout(() => {
      onHide();
    }, AUTO_HIDE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onHide, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bf-toast pointer-events-none fixed left-1/2 z-50 max-w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 translate-y-0 rounded-full border px-4 py-2.5 text-center text-xs leading-relaxed tracking-wide opacity-100 transition-[opacity,transform] duration-400 motion-reduce:transition-none bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:bottom-auto md:top-[max(1.25rem,env(safe-area-inset-top,0px))]"
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "var(--theme-surface)",
        color: "var(--theme-muted)",
        boxShadow: "var(--theme-shadow-soft), var(--theme-glow)",
      }}
    >
      Saved to your collection — find it anytime in Saved.
    </div>
  );
}
