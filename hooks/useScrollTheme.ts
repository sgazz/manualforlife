"use client";

import { useEffect, useRef } from "react";

type UseScrollThemeProps = {
  onScrollDown: () => void;
  onScrollUp: () => void;
  throttleMs?: number;
  setIsMobile: (isMobile: boolean) => void;
};

const MOBILE_QUERY = "(max-width: 768px)";

export function useScrollTheme({
  onScrollDown,
  onScrollUp,
  throttleMs = 400,
  setIsMobile,
}: UseScrollThemeProps) {
  const lockRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const detectTouchDevice = () =>
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const applyMobileState = (matches: boolean) => {
      const isMobile = matches || detectTouchDevice();
      isMobileRef.current = isMobile;
      setIsMobile(isMobile);
    };

    applyMobileState(mediaQuery.matches);

    const onMediaChange = (event: MediaQueryListEvent) => {
      applyMobileState(event.matches);
    };

    mediaQuery.addEventListener("change", onMediaChange);
    return () => {
      mediaQuery.removeEventListener("change", onMediaChange);
    };
  }, [setIsMobile]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      if (target.isContentEditable) {
        return true;
      }
      const tagName = target.tagName;
      return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
    };

    const triggerWithThrottle = (direction: "up" | "down") => {
      if (lockRef.current) {
        return;
      }

      if (direction === "down") {
        onScrollDown();
      } else {
        onScrollUp();
      }

      lockRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lockRef.current = false;
      }, throttleMs);
    };

    const onWheel = (event: WheelEvent) => {
      if (isMobileRef.current) {
        return;
      }
      if (!event.shiftKey) {
        return;
      }

      if (Math.abs(event.deltaY) < 2) {
        return;
      }

      triggerWithThrottle(event.deltaY > 0 ? "down" : "up");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isMobileRef.current) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowDown") {
        triggerWithThrottle("down");
      } else if (event.key === "ArrowUp") {
        triggerWithThrottle("up");
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onScrollDown, onScrollUp, throttleMs]);
}
