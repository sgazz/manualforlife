"use client";

import { useEffect, useState } from "react";

type CustomCaretProps = {
  visible: boolean;
  className?: string;
};

export function CustomCaret({ visible, className = "" }: CustomCaretProps) {
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

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 left-3 h-[1.05em] w-[1.5px] -translate-y-1/2 rounded-full ${
        reducedMotion ? "opacity-100" : "animate-customCaretFade"
      } ${className}`.trim()}
      style={{
        backgroundColor: "color-mix(in srgb, var(--theme-accent) 78%, var(--theme-text) 22%)",
      }}
    />
  );
}
