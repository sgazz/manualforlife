import { ToneBadge } from "@/components/ToneBadge";

type ShareTraceCardProps = {
  text: string;
  signature?: string | null;
  tone?: string | null;
  dateLabel?: string | null;
  variant?: "page" | "modal";
  className?: string;
};

export function ShareTraceCard({
  text,
  signature,
  tone,
  dateLabel,
  variant = "page",
  className = "",
}: ShareTraceCardProps) {
  const isPage = variant === "page";

  return (
    <article
      className={`relative mx-auto w-full overflow-hidden text-center ${isPage ? "max-w-[min(100%,24rem)] sm:max-w-xl" : "max-w-full"} ${className}`.trim()}
      style={{
        borderRadius: isPage ? "1.35rem" : "1.15rem",
        border: "1px solid color-mix(in srgb, var(--theme-border) 36%, transparent)",
        backgroundColor: "color-mix(in srgb, #faf6ef 86%, var(--theme-surface) 14%)",
        boxShadow:
          "0 1px 0 color-mix(in srgb, white 55%, transparent) inset, 0 18px 40px color-mix(in srgb, var(--theme-text) 5%, transparent)",
      }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-(--theme-muted)/18 to-transparent ${isPage ? "opacity-100" : "opacity-80"}`}
      />
      <div className={isPage ? "px-7 py-9 sm:px-10 sm:py-11" : "px-5 py-6 sm:px-6 sm:py-7"}>
        <svg
          aria-hidden="true"
          viewBox="0 0 120 12"
          className={`mx-auto text-(--theme-muted)/42 ${isPage ? "mb-7 h-2.5 w-24 sm:mb-8 sm:w-28" : "mb-5 h-2 w-20"}`}
          fill="none"
        >
          <path
            d="M4 8 C 18 10, 30 2, 48 4 C 58 5, 62 9, 72 7 C 82 5, 92 3, 116 5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        <blockquote className="border-none p-0 shadow-none">
          <p
            className={`font-serif text-(--theme-text)/93 ${
              isPage
                ? "text-[1.375rem] leading-[1.68] sm:text-[1.625rem] sm:leading-[1.74]"
                : "text-[1.125rem] leading-[1.65] sm:text-[1.2rem] sm:leading-[1.7]"
            }`}
          >
            &ldquo;{text}&rdquo;
          </p>
          {signature ? (
            <footer
              className={`typography-signature text-(--theme-muted)/80 ${isPage ? "mt-6 text-sm sm:mt-7" : "mt-4 text-sm"}`}
            >
              &mdash; {signature}
            </footer>
          ) : null}
        </blockquote>

        <ToneBadge tone={tone} className={isPage ? "mt-4 block text-center" : "mt-3 block text-center"} />

        {dateLabel ? (
          <p
            className={`typography-hint text-(--theme-muted)/54 ${isPage ? "mt-6 sm:mt-7" : "mt-4"}`}
          >
            {dateLabel}
          </p>
        ) : null}

        <p
          className={`typography-hint tracking-[0.14em] text-(--theme-muted)/50 uppercase ${isPage ? "mt-8 sm:mt-9" : "mt-5"}`}
        >
          manualfor.life
        </p>
      </div>
    </article>
  );
}
