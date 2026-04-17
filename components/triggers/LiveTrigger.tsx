"use client";

type LiveTriggerProps = {
  isOpen: boolean;
  hasUnread?: boolean;
  isFocusModeActive?: boolean;
  onToggle: () => void;
};

export function LiveTrigger({
  isOpen,
  hasUnread = false,
  isFocusModeActive = false,
  onToggle,
}: LiveTriggerProps) {
  return (
    <button
      type="button"
      title={isOpen ? "Close live panel" : "Open live panel"}
      aria-label="Toggle live traces panel"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`bf-trigger fixed top-[40%] z-30 flex h-11 min-h-11 w-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-[999px] border text-sm shadow-(--theme-shadow-soft) transition-[opacity,transform] duration-300 hover:opacity-60 left-[max(1.25rem,env(safe-area-inset-left,0px))] sm:top-1/2 ${
        isOpen
          ? "opacity-100 border-(--theme-accent) bg-(--theme-accent) text-(--theme-accent-contrast)"
          : "opacity-30 border-(--theme-accent-soft) bg-(--theme-surface)/85 text-(--theme-text)"
      } ${isFocusModeActive && !isOpen ? "opacity-15" : ""}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
        <path d="M5.8 12a6.2 6.2 0 0 1 6.2-6.2" />
        <path d="M12 5.8a6.2 6.2 0 0 1 6.2 6.2" />
        <path d="M18.2 12a6.2 6.2 0 0 1-6.2 6.2" />
        <path d="M12 18.2A6.2 6.2 0 0 1 5.8 12" />
      </svg>
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-(--theme-accent) shadow"
        />
      ) : null}
    </button>
  );
}
