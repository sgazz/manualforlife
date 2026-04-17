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
    focusable?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
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
        title="Close panel"
        className={`bf-panel-scrim absolute inset-0 bg-[color-mix(in_srgb,var(--theme-text)_14%,transparent)] transition-colors duration-300 ease-in-out ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className={`bf-panel-aside absolute inset-y-0 flex w-[min(82vw,340px)] flex-col overflow-hidden sm:w-[min(86vw,360px)] ${sideClasses.position} border-[color-mix(in_srgb,var(--theme-border)_60%,transparent)] bg-[#f8f5f0]/96 px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-transform duration-350 ease-in-out motion-reduce:transition-none ${
          isOpen ? "translate-x-0" : sideClasses.hidden
        } ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="mb-2.5 flex items-center justify-between sm:mb-3">
          <h3
            id={titleId}
            className="text-xs tracking-[0.18em] uppercase text-(--theme-muted)"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            title="Close panel"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-base leading-none text-(--theme-muted)/65 transition-colors duration-300 ease-in-out hover:text-(--theme-muted)"
          >
            ×
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
