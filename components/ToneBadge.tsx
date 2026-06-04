import { getToneLabel } from "@/lib/tones";

type ToneBadgeProps = {
  tone: string | null | undefined;
  className?: string;
};

export function ToneBadge({ tone, className = "" }: ToneBadgeProps) {
  const label = getToneLabel(tone ?? null);
  if (!label) {
    return null;
  }

  return (
    <span
      className={`typography-hint inline-flex items-center text-[0.6875rem] tracking-wide text-(--theme-muted)/50 ${className}`.trim()}
    >
      {label}
    </span>
  );
}
