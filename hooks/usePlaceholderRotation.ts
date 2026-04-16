"use client";

import { useEffect, useMemo, useState } from "react";

type PromptsByCategory = Record<string, readonly string[]>;

type PromptItem = {
  category: string;
  text: string;
};

type UsePlaceholderRotationOptions = {
  promptsByCategory: PromptsByCategory;
  minIntervalMs?: number;
  maxIntervalMs?: number;
  paused?: boolean;
  fadeOutDurationMs?: number;
  fadeInDurationMs?: number;
};

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRandomDelay(minMs: number, maxMs: number) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function buildBalancedBatch(promptsByCategory: PromptsByCategory) {
  const categories = Object.keys(promptsByCategory).filter(
    (category) => promptsByCategory[category]?.length > 0,
  );
  return shuffle(categories).map((category) => ({
    category,
    text: pickRandom(promptsByCategory[category]),
  }));
}

function buildDeterministicInitialBatch(promptsByCategory: PromptsByCategory) {
  const categories = Object.keys(promptsByCategory)
    .filter((category) => promptsByCategory[category]?.length > 0)
    .sort((a, b) => a.localeCompare(b));

  const batch = categories.map((category) => ({
    category,
    text: promptsByCategory[category][0],
  }));

  return batch.length > 0
    ? batch
    : [{ category: "default", text: "Write your trace..." }];
}

export function usePlaceholderRotation({
  promptsByCategory,
  minIntervalMs = 5000,
  maxIntervalMs = 7000,
  paused = false,
  fadeOutDurationMs = 620,
  fadeInDurationMs = 620,
}: UsePlaceholderRotationOptions) {
  const deterministicPromptPool = useMemo(
    () => buildDeterministicInitialBatch(promptsByCategory),
    [promptsByCategory],
  );

  const [queue, setQueue] = useState<PromptItem[]>(deterministicPromptPool);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setQueue(deterministicPromptPool);
    setCurrentIndex(0);
    setIsVisible(true);
  }, [deterministicPromptPool]);

  useEffect(() => {
    setQueue(buildBalancedBatch(promptsByCategory));
    setCurrentIndex(0);
    setIsVisible(true);
  }, [promptsByCategory]);

  useEffect(() => {
    if (paused || queue.length <= 1) {
      setIsVisible(true);
      return;
    }

    let rotateTimeoutId: number | undefined;
    let swapTimeoutId: number | undefined;
    let fadeInTimeoutId: number | undefined;

    const scheduleRotation = () => {
      const delay = getRandomDelay(minIntervalMs, maxIntervalMs);
      rotateTimeoutId = window.setTimeout(() => {
        setIsVisible(false);

        swapTimeoutId = window.setTimeout(() => {
          setCurrentIndex((previous) => {
            const nextIndex = previous + 1;
            if (nextIndex < queue.length) {
              return nextIndex;
            }

            setQueue(buildBalancedBatch(promptsByCategory));
            return 0;
          });
          setIsVisible(true);
          fadeInTimeoutId = window.setTimeout(() => {
            scheduleRotation();
          }, fadeInDurationMs);
        }, fadeOutDurationMs);
      }, delay);
    };

    scheduleRotation();

    return () => {
      if (rotateTimeoutId) {
        window.clearTimeout(rotateTimeoutId);
      }
      if (swapTimeoutId) {
        window.clearTimeout(swapTimeoutId);
      }
      if (fadeInTimeoutId) {
        window.clearTimeout(fadeInTimeoutId);
      }
    };
  }, [
    fadeInDurationMs,
    fadeOutDurationMs,
    maxIntervalMs,
    minIntervalMs,
    paused,
    promptsByCategory,
    queue,
  ]);

  return {
    prompt: queue[currentIndex]?.text ?? "Write your trace...",
    promptCategory: queue[currentIndex]?.category ?? "default",
    isVisible,
  };
}
