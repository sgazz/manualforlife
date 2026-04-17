"use client";

import { useEffect, useMemo, useState } from "react";

const FADE_MIN_MS = 800;
const FADE_MAX_MS = 1200;
const HOLD_BASE_MS = 5000;
const HOLD_JITTER_MS = 500;
const HOLD_MIN_MS = 4000;
const HOLD_MAX_MS = 6000;
const INVISIBLE_PAUSE_MIN_MS = 80;
const INVISIBLE_PAUSE_MAX_MS = 120;

function randomBetween(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}

function nextHoldDuration() {
  const jitter = randomBetween(-HOLD_JITTER_MS, HOLD_JITTER_MS);
  return Math.min(HOLD_MAX_MS, Math.max(HOLD_MIN_MS, HOLD_BASE_MS + jitter));
}

type RotatingPromptProps = {
  prompts: string[];
  paused?: boolean;
  className?: string;
};

export function RotatingPrompt({
  prompts,
  paused = false,
  className = "",
}: RotatingPromptProps) {
  const safePrompts = useMemo(
    () => (prompts.length > 0 ? prompts : ["Write your trace..."]),
    [prompts],
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [transitionMs, setTransitionMs] = useState(1000);
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

  useEffect(() => {
    if (paused || reducedMotion || safePrompts.length <= 1) {
      return;
    }

    let cancelled = false;
    const timeoutIds = new Set<number>();

    const wait = (ms: number) =>
      new Promise<boolean>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          timeoutIds.delete(timeoutId);
          resolve(!cancelled);
        }, ms);
        timeoutIds.add(timeoutId);
      });

    const nextFrame = () =>
      new Promise<boolean>((resolve) => {
        const frameId = window.requestAnimationFrame(() => {
          resolve(!cancelled);
        });
        timeoutIds.add(frameId);
      });

    const runLoop = async () => {
      while (!cancelled) {
        const holdMs = nextHoldDuration();
        const keepRunningAfterHold = await wait(holdMs);
        if (!keepRunningAfterHold || cancelled) return;

        const fadeOutMs = randomBetween(FADE_MIN_MS, FADE_MAX_MS);
        setTransitionMs(fadeOutMs);
        const frameBeforeFadeOut = await nextFrame();
        if (!frameBeforeFadeOut || cancelled) return;

        setVisible(false);
        const keepRunningAfterFadeOut = await wait(fadeOutMs);
        if (!keepRunningAfterFadeOut || cancelled) return;

        const invisiblePauseMs = randomBetween(
          INVISIBLE_PAUSE_MIN_MS,
          INVISIBLE_PAUSE_MAX_MS,
        );
        const keepRunningAfterPause = await wait(invisiblePauseMs);
        if (!keepRunningAfterPause || cancelled) return;

        // Tekst se menja samo tokom potpuno nevidljive faze.
        setIndex((current) => (current + 1) % safePrompts.length);

        const fadeInMs = randomBetween(FADE_MIN_MS, FADE_MAX_MS);
        setTransitionMs(fadeInMs);
        const frameBeforeFadeIn = await nextFrame();
        if (!frameBeforeFadeIn || cancelled) return;

        setVisible(true);
        const keepRunningAfterFadeIn = await wait(fadeInMs);
        if (!keepRunningAfterFadeIn || cancelled) return;
      }
    };

    void runLoop();

    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => {
        window.clearTimeout(id);
        window.cancelAnimationFrame(id);
      });
      timeoutIds.clear();
    };
  }, [paused, reducedMotion, safePrompts.length]);

  const displayedIndex = index % safePrompts.length;
  const shouldForceVisible = paused || reducedMotion || safePrompts.length <= 1;
  const displayedVisible = shouldForceVisible ? true : visible;
  const dynamicDuration = reducedMotion ? 0 : transitionMs;

  return (
    <p
      aria-hidden="true"
      className={`typography-ui px-2 text-(--theme-muted)/70 transition-opacity ease-in-out motion-reduce:transition-none ${
        displayedVisible ? "opacity-100" : "opacity-0"
      } ${className}`.trim()}
      style={{
        transitionDuration: `${dynamicDuration}ms`,
        willChange: reducedMotion ? "auto" : "opacity",
      }}
    >
      {safePrompts[displayedIndex]}
    </p>
  );
}
