const FEATURED_TRACES = [
  "Most things you fear will never happen. The rest will teach you.",
  "You were not late. You were becoming.",
  "Call them while you can.",
  "Do not confuse peace with boredom.",
  "You survived days you thought would end you.",
] as const;

type FeaturedTracesProps = {
  subdued?: boolean;
};

export function FeaturedTraces({ subdued = false }: FeaturedTracesProps) {
  return (
    <section
      aria-label="Featured traces"
      className={`transition-opacity duration-300 motion-reduce:transition-none ${
        subdued ? "opacity-55" : "opacity-100"
      }`}
    >
      <h2 className="typography-hint text-center text-[0.7rem] font-medium tracking-[0.16em] text-(--theme-muted)/58 uppercase">
        A few traces left behind
      </h2>
      <ul className="mt-4 space-y-3 sm:mt-5 sm:space-y-3.5">
        {FEATURED_TRACES.map((trace) => (
          <li
            key={trace}
            className="rounded-xl border px-4 py-3.5 sm:px-5 sm:py-4"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-border) 28%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--theme-surface) 88%, var(--theme-muted) 12%)",
              boxShadow: "var(--theme-shadow-soft)",
            }}
          >
            <p className="font-serif text-[0.98rem] leading-7 text-(--theme-text)/88 sm:text-[1.05rem] sm:leading-8">
              &ldquo;{trace}&rdquo;
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
