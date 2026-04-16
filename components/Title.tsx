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
        className="ml-[0.03em] inline-block align-baseline text-[1.3em] font-normal tracking-[0.008em]"
        style={{
          fontFamily: "var(--font-caveat), Caveat, cursive",
          transform: "translateY(0.08em)",
          color: "color-mix(in srgb, var(--theme-text) 84%, var(--theme-muted) 16%)",
        }}
      >
        {suffix}
      </span>
    </h1>
  );
}
