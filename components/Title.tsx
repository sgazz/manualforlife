type TitleProps = {
  primary?: string;
  suffix?: string;
  className?: string;
};

export function Title({
  primary = "Manualfor",
  suffix = ".life",
  className = "",
}: TitleProps) {
  return (
    <h1 className={`typography-title ${className}`.trim()}>
      <span>{primary}</span>
      <span
        className="ml-[0.012em] inline-block translate-y-[0.04em] align-baseline text-[1.1em] font-normal tracking-[0.003em] opacity-90 sm:ml-[0.03em] sm:translate-y-[0.08em] sm:text-[1.3em] sm:tracking-[0.008em] sm:opacity-100"
        style={{
          fontFamily: "var(--font-caveat), Caveat, cursive",
          color: "color-mix(in srgb, var(--theme-text) 84%, var(--theme-muted) 16%)",
        }}
      >
        {suffix}
      </span>
    </h1>
  );
}
