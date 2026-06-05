import Link from "next/link";

export function TraceNotFound() {
  return (
    <div className="theme-shell theme-reflection relative flex min-h-dvh items-center justify-center px-[max(1rem,env(safe-area-inset-left,0px))] py-[max(2rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
      <main className="relative z-10 w-full max-w-md space-y-6 text-center">
        <p className="typography-hint text-[0.7rem] font-medium tracking-[0.16em] text-(--theme-muted)/70 uppercase">
          Trace Not Found
        </p>
        <p className="font-serif text-[1.2rem] leading-8 text-(--theme-text)/88 sm:text-[1.35rem] sm:leading-9">
          This trace may have drifted away, or the link may no longer lead anywhere.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium text-(--theme-text)/88 transition-[color,background-color] duration-200 hover:text-(--theme-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2"
          style={{
            borderColor: "color-mix(in srgb, var(--theme-border) 45%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--theme-surface) 92%, white 8%)",
          }}
        >
          Leave Your Own Trace
        </Link>
        <footer className="typography-hint pt-2 text-(--theme-muted)/58">manualfor.life</footer>
      </main>
    </div>
  );
}
