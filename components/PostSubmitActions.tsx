type PostSubmitActionsProps = {
  onReadLiveTraces: () => void;
};

export function PostSubmitActions({ onReadLiveTraces }: PostSubmitActionsProps) {
  return (
    <button
      type="button"
      onClick={onReadLiveTraces}
      aria-label="Read what others left for you"
      className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-normal tracking-wide text-(--theme-muted)/78 transition-[color,background-color,border-color] duration-200 hover:text-(--theme-text)/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2 motion-reduce:transition-none"
      style={{
        borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-muted) 6%)",
      }}
    >
      Read what others left for you
    </button>
  );
}
