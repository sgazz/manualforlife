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
  id: "reflection";
  label: string;
  className: string;
};

const themes: ThemeDefinition[] = [
  { id: "reflection", label: "Reflection", className: "theme-reflection" },
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
      </div>
    </ThemeContext.Provider>
  );
}
