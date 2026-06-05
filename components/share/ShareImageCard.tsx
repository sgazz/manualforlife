import { ManualTraceMark } from "@/components/share/ManualTraceMark";
import {
  formatSignatureShareDate,
  getShareCardAspectRatio,
  quoteSizeClass,
  SIGNATURE_CARD,
  type ShareCardFormat,
} from "@/lib/signatureShareCard";

export type ShareImageCardProps = {
  traceText: string;
  signature?: string | null;
  createdAt?: string | null;
  format?: ShareCardFormat;
  className?: string;
};

export function ShareImageCard({
  traceText,
  signature = null,
  createdAt = null,
  format = "portrait",
  className = "",
}: ShareImageCardProps) {
  const trimmed = traceText.trim();
  const author = signature?.trim() || null;
  const dateLabel = formatSignatureShareDate(createdAt);

  return (
    <div
      className={`relative mx-auto overflow-hidden ${className}`.trim()}
      style={{
        aspectRatio: getShareCardAspectRatio(format),
        width: "min(100%, 360px)",
        backgroundColor: SIGNATURE_CARD.paper,
        boxShadow:
          "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 24px 60px rgba(63, 42, 29, 0.12)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, rgba(84, 45, 24, 0.07) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "radial-gradient(rgba(63, 42, 29, 0.14) 0.55px, transparent 0.55px)",
          backgroundSize: "3px 3px",
          mixBlendMode: "multiply",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-[1rem] border sm:inset-5"
        style={{ borderColor: "rgba(107, 74, 44, 0.1)" }}
      />

      <div className="relative flex h-full flex-col px-7 py-8 sm:px-9 sm:py-10">
        <div className="flex flex-1 items-center justify-center pt-2 pb-4">
          <blockquote className="max-w-[26ch] border-none p-0 text-center shadow-none">
            <p
              className={`font-serif ${quoteSizeClass(trimmed.length)}`}
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                color: SIGNATURE_CARD.text,
              }}
            >
              &ldquo;{trimmed}&rdquo;
            </p>
          </blockquote>
        </div>

        <footer className="shrink-0 pt-2">
          <ManualTraceMark
            className="mx-auto h-auto w-[min(42%,180px)] text-[#6b4a2c]"
            opacity={0.8}
          />
          <p
            className="mt-4 text-center text-[0.68rem] tracking-[0.18em] uppercase"
            style={{ color: "rgba(107, 74, 44, 0.62)" }}
          >
            manualfor.life
          </p>
          {author || dateLabel ? (
            <div
              className="mt-4 flex items-baseline justify-between gap-4 text-[0.72rem]"
              style={{ color: "rgba(107, 74, 44, 0.58)" }}
            >
              <span className="truncate">{author ?? ""}</span>
              <span className="shrink-0 tabular-nums">{dateLabel ?? ""}</span>
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
