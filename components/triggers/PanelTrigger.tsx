"use client";

import type { ReactNode } from "react";

type PanelTriggerProps = {
  side: "left" | "right";
  label: string;
  supportingText?: string;
  isOpen: boolean;
  isHushed?: boolean;
  onToggle: () => void;
  ariaLabel: string;
  badgeCount?: number;
  showLivePulse?: boolean;
  icon: ReactNode;
  highlighted?: boolean;
};

export function PanelTrigger({
  side,
  label,
  supportingText,
  isOpen,
  isHushed = false,
  onToggle,
  ariaLabel,
  badgeCount = 0,
  showLivePulse = false,
  icon,
  highlighted = false,
}: PanelTriggerProps) {
  const sidePosition =
    side === "left"
      ? "left-[max(1rem,env(safe-area-inset-left,0px))]"
      : "right-[max(1rem,env(safe-area-inset-right,0px))]";

  return (
    <button
      type="button"
      title={isOpen ? `Close ${label.toLowerCase()} panel` : `Open ${label.toLowerCase()} panel`}
      aria-label={isOpen ? `Close ${label.toLowerCase()} panel` : ariaLabel}
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`bf-trigger group fixed top-[38%] z-30 hidden min-h-12 min-w-12 -translate-y-1/2 items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-sm shadow-(--theme-shadow-soft) transition-[opacity,transform,box-shadow,border-color,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:flex sm:top-1/2 ${sidePosition} ${
        isOpen
          ? "border-(--theme-accent) bg-(--theme-accent) text-(--theme-accent-contrast) opacity-100"
          : "border-(--theme-accent-soft)/70 bg-(--theme-surface)/92 text-(--theme-text) opacity-72 hover:border-(--theme-accent-soft) hover:bg-(--theme-surface) hover:opacity-95 hover:shadow-[var(--theme-shadow-soft),0_0_0_1px_color-mix(in_srgb,var(--theme-accent-soft)_35%,transparent)]"
      } ${isHushed && !isOpen ? "opacity-55 hover:opacity-82" : ""} ${
        highlighted && !isOpen ? "ring-2 ring-(--theme-accent-soft)/45 ring-offset-2 ring-offset-transparent" : ""
      }`}
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
        {showLivePulse && !isOpen ? (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-(--theme-accent) motion-safe:animate-[livePulse_2.4s_ease-in-out_infinite]"
          />
        ) : null}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[0.8125rem] font-medium tracking-wide">{label}</span>
        {supportingText ? (
          <span
            className={`hidden text-[0.6875rem] tracking-wide lg:block ${
              isOpen ? "text-(--theme-accent-contrast)/78" : "text-(--theme-muted)/72"
            }`}
          >
            {supportingText}
          </span>
        ) : null}
      </span>
      {badgeCount > 0 && !isOpen ? (
        <span
          aria-label={`${badgeCount} new traces`}
          className="ml-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-medium tabular-nums"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-accent) 88%, #f8ecdb 12%)",
            color: "color-mix(in srgb, var(--theme-accent-contrast) 92%, #fff5e8 8%)",
          }}
        >
          +{badgeCount > 99 ? "99" : badgeCount}
        </span>
      ) : null}
    </button>
  );
}
