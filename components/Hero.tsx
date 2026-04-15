export function Hero() {
  return (
    <section className="space-y-5 text-center">
      <div className="mx-auto w-full max-w-xl">
        <svg
          aria-hidden="true"
          viewBox="0 0 420 54"
          className="mx-auto h-9 w-68 sm:h-11 sm:w-88"
        >
          <path
            d="M8 38
               C 46 42, 82 16, 130 6
               C 162 -2, 188 22, 170 34
               C 158 42, 168 46, 188 40
               C 208 34, 220 22, 240 22
               C 264 22, 268 42, 250 44
               C 236 46, 232 52, 258 50
               C 292 48, 324 34, 356 30
               C 376 28, 394 28, 412 30
               C 408 30, 410 30, 412 30"
            fill="none"
            stroke="var(--theme-muted)"
            strokeOpacity="0.88"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1
          className="mt-1 font-(--font-display) text-[2.7rem] leading-none tracking-tight text-(--theme-text) transition-colors duration-400 sm:text-[3.5rem]"
          style={{ textShadow: "0 1px 0 rgba(255, 255, 255, 0.18)", fontWeight: 500 }}
        >
          <span>Manualfor.</span>
          <span>life</span>
        </h1>
      </div>
      <p className="mx-auto max-w-2xl text-base leading-relaxed text-(--theme-muted) transition-colors duration-400 sm:text-lg">
        This is a place where people leave one thought that changed their life.
        <br />
        Write yours - for someone you will never meet.
      </p>
    </section>
  );
}
