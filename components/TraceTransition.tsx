"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type TraceTransitionState = "idle" | "closing" | "paused" | "opening";

type TraceTransitionProps = {
  text: string;
  className?: string;
};

type Timings = {
  startDelay: number;
  close: number;
  pause: number;
  open: number;
};

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function getTimings(): Timings {
  return {
    startDelay: randomBetween(50, 80),
    close: randomBetween(120, 180),
    pause: randomBetween(80, 120),
    open: randomBetween(300, 450),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function TraceTransition({ text, className = "" }: TraceTransitionProps) {
  const [displayedText, setDisplayedText] = useState(text);
  const [state, setState] = useState<TraceTransitionState>("idle");
  const [durations, setDurations] = useState(() => getTimings());

  const isAnimatingRef = useRef(false);
  const pendingTextRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  const runTransition = useCallback(
    async (nextText: string) => {
      isAnimatingRef.current = true;
      let nextInQueue: string | null = nextText;

      while (nextInQueue !== null) {
        const currentTarget = nextInQueue;
        const nextTimings = getTimings();
        setDurations(nextTimings);

        await wait(nextTimings.startDelay);
        setState("closing");
        await wait(nextTimings.close);

        setState("paused");
        setDisplayedText(currentTarget);
        await wait(nextTimings.pause);

        setState("opening");
        await wait(nextTimings.open);

        setState("idle");

        if (pendingTextRef.current && pendingTextRef.current !== currentTarget) {
          nextInQueue = pendingTextRef.current;
          pendingTextRef.current = null;
        } else {
          nextInQueue = null;
          pendingTextRef.current = null;
        }
      }

      isAnimatingRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (text === displayedText) {
      return;
    }

    if (isAnimatingRef.current) {
      pendingTextRef.current = text;
      return;
    }

    const timer = window.setTimeout(() => {
      void runTransition(text);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [displayedText, runTransition, text]);

  return (
    <span
      data-trace-state={state}
      className={`trace-transition ${className}`.trim()}
      style={
        {
          "--trace-close-duration": `${durations.close}ms`,
          "--trace-open-duration": `${durations.open}ms`,
        } as CSSProperties
      }
    >
      {displayedText}
    </span>
  );
}
