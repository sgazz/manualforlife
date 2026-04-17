"use client";

type StarredTriggerProps = {
  isOpen: boolean;
  isHushed?: boolean;
  onToggle: () => void;
};

export function StarredTrigger({
  isOpen,
  isHushed = false,
  onToggle,
}: StarredTriggerProps) {
  return (
    <button
      type="button"
      title={isOpen ? "Close starred panel" : "Open starred panel"}
      aria-label="Toggle starred traces panel"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`bf-trigger fixed top-[40%] z-30 flex h-11 min-h-11 w-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-[999px] border text-sm shadow-(--theme-shadow-soft) transition-[opacity,transform] duration-300 hover:opacity-60 right-[max(1.25rem,env(safe-area-inset-right,0px))] sm:top-1/2 ${
        isOpen
          ? "opacity-100 border-(--theme-accent) bg-(--theme-accent) text-(--theme-accent-contrast)"
          : "opacity-30 border-(--theme-accent-soft) bg-(--theme-surface)/85 text-(--theme-text)"
      } ${isHushed && !isOpen ? "opacity-22" : ""}`}
    >
      ★
    </button>
  );
}
