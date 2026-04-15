"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useScrollTheme } from "@/hooks/useScrollTheme";

export type ThemeDefinition = {
  id: "beginning" | "clarity" | "reflection" | "intensity" | "legacy";
  label: string;
  className: string;
};

const themes: ThemeDefinition[] = [
  { id: "beginning", label: "Beginning", className: "theme-beginning" },
  { id: "clarity", label: "Clarity", className: "theme-clarity" },
  { id: "reflection", label: "Reflection", className: "theme-reflection" },
  { id: "intensity", label: "Intensity", className: "theme-intensity" },
  { id: "legacy", label: "Legacy", className: "theme-legacy" },
];

export type ThemeContextValue = {
  themes: ThemeDefinition[];
  currentThemeIndex: number;
  currentTheme: ThemeDefinition;
  setThemeByIndex: (index: number) => void;
  goToNextTheme: () => void;
  goToPreviousTheme: () => void;
  isMobile: boolean;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function clampThemeIndex(index: number) {
  return Math.max(0, Math.min(themes.length - 1, index));
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setThemeByIndex = useCallback((index: number) => {
    setCurrentThemeIndex(clampThemeIndex(index));
  }, []);

  const goToNextTheme = useCallback(() => {
    setCurrentThemeIndex((previous) => clampThemeIndex(previous + 1));
  }, []);

  const goToPreviousTheme = useCallback(() => {
    setCurrentThemeIndex((previous) => clampThemeIndex(previous - 1));
  }, []);

  useScrollTheme({
    onScrollDown: goToNextTheme,
    onScrollUp: goToPreviousTheme,
    throttleMs: 420,
    setIsMobile,
  });

  const value = useMemo<ThemeContextValue>(
    () => ({
      themes,
      currentThemeIndex,
      currentTheme: themes[currentThemeIndex],
      setThemeByIndex,
      goToNextTheme,
      goToPreviousTheme,
      isMobile,
    }),
    [
      currentThemeIndex,
      setThemeByIndex,
      goToNextTheme,
      goToPreviousTheme,
      isMobile,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        ref={containerRef}
        className={`theme-shell ${themes[currentThemeIndex].className} relative min-h-svh overflow-x-hidden`}
      >
        {children}
        {!isMobile ? (
          <div className="fixed right-5 top-1/2 z-30 -translate-y-1/2 space-y-3">
            {themes.map((theme, index) => {
              const isActive = index === currentThemeIndex;
              return (
                <button
                  key={theme.id}
                  type="button"
                  aria-label={`Switch to ${theme.label} theme`}
                  onClick={() => setThemeByIndex(index)}
                  className="block"
                >
                  <span
                    className={`block h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                      isActive
                        ? "scale-125 border-[color:var(--theme-accent)] bg-[color:var(--theme-accent)]"
                        : "border-[color:var(--theme-border)] bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="fixed inset-x-0 bottom-4 z-30 flex items-center justify-center gap-2 px-4">
            {themes.map((theme, index) => {
              const isActive = index === currentThemeIndex;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeByIndex(index)}
                  className={`rounded-full border px-3 py-1 text-xs transition duration-300 ${
                    isActive
                      ? "border-[color:var(--theme-accent)] bg-[color:var(--theme-accent)] text-[color:var(--theme-accent-contrast)]"
                      : "border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] text-[color:var(--theme-muted)]"
                  }`}
                >
                  {theme.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}
