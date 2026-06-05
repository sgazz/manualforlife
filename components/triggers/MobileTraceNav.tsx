"use client";

type MobileTraceNavProps = {
  openPanel: "live" | "starred" | null;
  liveBadgeCount?: number;
  onOpenLive: () => void;
  onOpenSaved: () => void;
};

export function MobileTraceNav({
  openPanel,
  liveBadgeCount = 0,
  onOpenLive,
  onOpenSaved,
}: MobileTraceNavProps) {
  return (
    <nav
      aria-label="Trace navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
      style={{
        borderColor: "color-mix(in srgb, var(--theme-border) 40%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        <button
          type="button"
          aria-label="Open live archive"
          aria-current={openPanel === "live" ? "page" : undefined}
          onClick={onOpenLive}
          className={`relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--theme-accent-soft) ${
            openPanel === "live"
              ? "text-(--theme-text)"
              : "text-(--theme-muted)/78 active:text-(--theme-text)"
          }`}
        >
          <span className="relative flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full bg-(--theme-accent) ${
                openPanel !== "live" ? "motion-safe:animate-[livePulse_2.4s_ease-in-out_infinite]" : ""
              }`}
            />
            <span className="font-medium tracking-wide">Archive</span>
            {liveBadgeCount > 0 && openPanel !== "live" ? (
              <span
                aria-label={`${liveBadgeCount} new traces`}
                className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] font-medium tabular-nums"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--theme-accent) 88%, #f8ecdb 12%)",
                  color: "color-mix(in srgb, var(--theme-accent-contrast) 92%, #fff5e8 8%)",
                }}
              >
                +{liveBadgeCount > 99 ? "99" : liveBadgeCount}
              </span>
            ) : null}
          </span>
        </button>
        <button
          type="button"
          aria-label="Open saved traces"
          aria-current={openPanel === "starred" ? "page" : undefined}
          onClick={onOpenSaved}
          className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--theme-accent-soft) ${
            openPanel === "starred"
              ? "text-(--theme-text)"
              : "text-(--theme-muted)/78 active:text-(--theme-text)"
          }`}
        >
          <span className="font-medium tracking-wide">Saved</span>
        </button>
      </div>
    </nav>
  );
}
