"use client";

import { useEffect, useState } from "react";

type CustomCaretProps = {
  visible: boolean;
  className?: string;
  /** `invite`: softer rhythm for main trace invitation (desktop). Default: single-line field. */
  variant?: "signature" | "invite";
};

export function CustomCaret({
  visible,
  className = "",
  variant = "signature",
}: CustomCaretProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      setReducedMotion(mediaQuery.matches);
    };

    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  if (!visible) {
    return null;
  }

  const isInvite = variant === "invite";
  const positionClasses = isInvite
    ? "z-[1] text-base sm:text-lg"
    : "top-1/2 left-3 z-[1] -translate-y-1/2";
  const heightClass = isInvite ? "h-[1.08em] w-[1.5px]" : "h-[1.05em] w-[1.5px]";
  const motionClasses = reducedMotion
    ? isInvite
      ? "opacity-[0.44]"
      : "opacity-100"
    : isInvite
      ? "animate-traceInviteCaretFade"
      : "animate-customCaretFade";

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${positionClasses} ${heightClass} ${motionClasses} ${className}`.trim()}
      style={{
        backgroundColor: isInvite
          ? "color-mix(in srgb, var(--theme-accent) 52%, var(--theme-muted) 48%)"
          : "color-mix(in srgb, var(--theme-accent) 78%, var(--theme-text) 22%)",
      }}
    />
  );
}
