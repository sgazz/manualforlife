"use client";

type LiveTriggerProps = {
  isOpen: boolean;
  hasUnread?: boolean;
  onToggle: () => void;
};

export function LiveTrigger({
  isOpen,
  hasUnread = false,
  onToggle,
}: LiveTriggerProps) {
  return (
    <button
      type="button"
      title={isOpen ? "Close live panel" : "Open live panel"}
      aria-label="Toggle live traces panel"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`fixed top-1/2 left-5 z-30 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-[999px] border text-sm shadow-(--theme-shadow-strong) backdrop-blur-sm transition duration-300 hover:scale-105 hover:opacity-100 ${
        isOpen
          ? "opacity-100 border-(--theme-accent) bg-(--theme-accent) text-(--theme-accent-contrast)"
          : "opacity-80 border-(--theme-accent-soft) bg-(--theme-surface)/90 text-(--theme-text)"
      }`}
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
