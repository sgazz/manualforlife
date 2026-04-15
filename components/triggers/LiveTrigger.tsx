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
      aria-label="Toggle live traces panel"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`fixed top-1/2 left-2 z-30 -translate-y-1/2 rounded-full border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)]/75 px-2 py-1 text-sm text-[color:var(--theme-muted)] shadow-[var(--theme-shadow-soft)] backdrop-blur-sm transition duration-300 hover:opacity-100 ${
        isOpen ? "opacity-100" : "opacity-45"
      }`}
    >
      ~
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-[color:var(--theme-accent)] shadow"
        />
      ) : null}
    </button>
  );
}
