"use client";

type StarredTriggerProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function StarredTrigger({ isOpen, onToggle }: StarredTriggerProps) {
  return (
    <button
      type="button"
      aria-label="Toggle starred traces panel"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`fixed top-1/2 right-2 z-30 -translate-y-1/2 rounded-full border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)]/75 px-2 py-1 text-sm text-[color:var(--theme-muted)] shadow-[var(--theme-shadow-soft)] backdrop-blur-sm transition duration-300 hover:opacity-100 ${
        isOpen ? "opacity-100" : "opacity-45"
      }`}
    >
      ★
    </button>
  );
}
