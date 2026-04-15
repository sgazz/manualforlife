"use client";

import { useEffect, useState } from "react";

type UseTypingStateOptions = {
  idleDelayMs?: number;
};

export function useTypingState(
  text: string,
  options: UseTypingStateOptions = {},
) {
  const { idleDelayMs = 2400 } = options;
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (text.trim().length === 0) {
      const frame = window.requestAnimationFrame(() => {
        setIsTyping(false);
      });
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const frame = window.requestAnimationFrame(() => {
      setIsTyping(true);
    });
    const timeoutId = window.setTimeout(() => {
      setIsTyping(false);
    }, idleDelayMs);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeoutId);
    };
  }, [idleDelayMs, text]);

  return isTyping;
}
