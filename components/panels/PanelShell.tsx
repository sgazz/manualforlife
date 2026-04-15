"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PropsWithChildren,
} from "react";

type PanelShellProps = PropsWithChildren<{
  side: "left" | "right";
  isOpen: boolean;
  onClose: () => void;
  title: string;
}>;

export function PanelShell({
  side,
  isOpen,
  onClose,
  title,
  children,
}: PanelShellProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [isOpen]);

  const sideClasses = useMemo(
    () =>
      side === "left"
        ? {
            position: "left-0 border-r",
            hidden: "-translate-x-full",
          }
        : {
            position: "right-0 border-l",
            hidden: "translate-x-full",
          },
    [side],
  );

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) {
      return;
    }

    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled"));

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-350 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label={`Close ${title} panel`}
        className="absolute inset-0 bg-black/8 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className={`absolute top-0 h-full w-[min(86vw,360px)] ${sideClasses.position} border-[color:var(--theme-border)] bg-[color:var(--theme-surface)]/95 p-4 shadow-[var(--theme-shadow-strong)] backdrop-blur-md transition-transform duration-350 motion-reduce:transition-none ${
          isOpen ? "translate-x-0" : sideClasses.hidden
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3
            id={titleId}
            className="text-xs tracking-[0.18em] uppercase text-[color:var(--theme-muted)]"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[color:var(--theme-border)] px-2 py-1 text-xs text-[color:var(--theme-muted)] transition hover:bg-white/30"
          >
            Close
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
