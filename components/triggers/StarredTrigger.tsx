"use client";

type StarredTriggerProps = {
  isOpen: boolean;
  isFocusModeActive?: boolean;
  onToggle: () => void;
};

export function StarredTrigger({
  isOpen,
  isFocusModeActive = false,
  onToggle,
}: StarredTriggerProps) {
  return (
    <button
      type="button"
      title={isOpen ? "Close starred panel" : "Open starred panel"}
      aria-label="Toggle starred traces panel"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`fixed top-1/2 right-5 z-30 flex h-14 w-8 -translate-y-1/2 items-center justify-center rounded-[999px] border text-sm shadow-(--theme-shadow-soft) backdrop-blur-sm transition duration-300 hover:opacity-60 ${
        isOpen
          ? "opacity-100 border-(--theme-accent) bg-(--theme-accent) text-(--theme-accent-contrast)"
          : "opacity-30 border-(--theme-accent-soft) bg-(--theme-surface)/85 text-(--theme-text)"
      } ${isFocusModeActive && !isOpen ? "opacity-15" : ""}`}
    >
      ★
    </button>
  );
}
