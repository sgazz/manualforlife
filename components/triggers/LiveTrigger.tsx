"use client";

import { PanelTrigger } from "@/components/triggers/PanelTrigger";

type LiveTriggerProps = {
  isOpen: boolean;
  newTraceCount?: number;
  isHushed?: boolean;
  highlighted?: boolean;
  onToggle: () => void;
};

function LiveIcon() {
  return (
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
  );
}

export function LiveTrigger({
  isOpen,
  newTraceCount = 0,
  isHushed = false,
  highlighted = false,
  onToggle,
}: LiveTriggerProps) {
  return (
    <PanelTrigger
      side="left"
      label="Archive"
      supportingText="Live archive"
      isOpen={isOpen}
      isHushed={isHushed}
      onToggle={onToggle}
      ariaLabel="Open live archive panel"
      badgeCount={newTraceCount}
      showLivePulse
      highlighted={highlighted}
      icon={<LiveIcon />}
    />
  );
}
