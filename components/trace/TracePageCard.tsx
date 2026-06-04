import Link from "next/link";
import { ShareTraceCard } from "@/components/trace/ShareTraceCard";
import { TracePageShareActions } from "@/components/trace/TracePageShareActions";
import type { PublicEntry } from "@/lib/entries";

type TracePageCardProps = {
  entry: PublicEntry;
};

function formatTraceDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function TracePageCard({ entry }: TracePageCardProps) {
  const formattedDate = formatTraceDate(entry.created_at);

  return (
    <div className="theme-shell theme-reflection relative min-h-dvh px-[max(1rem,env(safe-area-inset-left,0px))] py-[max(1.25rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:flex sm:items-center sm:justify-center sm:py-[max(2rem,env(safe-area-inset-top,0px))]">
      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center gap-5 sm:gap-8">
        <ShareTraceCard
          text={entry.text}
          signature={entry.signature}
          tone={entry.tone}
          dateLabel={formattedDate}
          variant="page"
        />
        <TracePageShareActions entryId={entry.id} traceText={entry.text} />
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-[opacity,transform] duration-200 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-soft) focus-visible:ring-offset-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-accent) 86%, #f8ecdb 14%)",
            color: "color-mix(in srgb, var(--theme-accent-contrast) 90%, #fff5e8 10%)",
            boxShadow:
              "0 0 0 1px color-mix(in srgb, var(--theme-accent-soft) 60%, transparent) inset",
          }}
        >
          Leave your own trace
        </Link>
      </main>
    </div>
  );
}
