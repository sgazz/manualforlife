"use client";

import { useEffect, useMemo, useState } from "react";

type UsePlaceholderRotationOptions = {
  prompts: string[];
  intervalMs?: number;
};

export function usePlaceholderRotation({
  prompts,
  intervalMs = 5200,
}: UsePlaceholderRotationOptions) {
  const safePrompts = useMemo(
    () => (prompts.length > 0 ? prompts : ["Write your trace..."]),
    [prompts],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (safePrompts.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIsVisible(false);

      const timeoutId = window.setTimeout(() => {
        setCurrentIndex((previous) => (previous + 1) % safePrompts.length);
        setIsVisible(true);
      }, 180);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs, safePrompts.length]);

  return {
    prompt: safePrompts[currentIndex],
    isVisible,
  };
}
