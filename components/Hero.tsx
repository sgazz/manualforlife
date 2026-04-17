import { Title } from "@/components/Title";

export function Hero() {
  return (
    <section className="space-y-3 text-center sm:space-y-5">
      <div className="mx-auto w-full max-w-xl">
        <svg
          aria-hidden="true"
          viewBox="0 0 420 54"
          className="mx-auto h-6 w-48 sm:h-11 sm:w-88"
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
        <Title className="mt-0.5 transition-colors duration-400 sm:mt-1" />
      </div>
      <p className="typography-ui mx-auto max-w-lg px-3 text-(--theme-muted) transition-colors duration-400 sm:max-w-2xl sm:px-0 sm:text-lg">
        This is a place where people leave one thought that changed their life.
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        Write yours &mdash; for someone you will never meet.
      </p>
    </section>
  );
}
