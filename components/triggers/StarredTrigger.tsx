"use client";

import { PanelTrigger } from "@/components/triggers/PanelTrigger";

type StarredTriggerProps = {
  isOpen: boolean;
  isHushed?: boolean;
  onToggle: () => void;
};

function SavedIcon() {
  return (
    <span aria-hidden="true" className="text-[0.95rem] leading-none">
      ★
    </span>
  );
}

export function StarredTrigger({
  isOpen,
  isHushed = false,
  onToggle,
}: StarredTriggerProps) {
  return (
    <PanelTrigger
      side="right"
      label="Saved"
      isOpen={isOpen}
      isHushed={isHushed}
      onToggle={onToggle}
      ariaLabel="Open Saved Traces panel"
      icon={<SavedIcon />}
    />
  );
}
