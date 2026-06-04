"use client";

import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { CopyTraceTextButton } from "@/components/ui/CopyTraceTextButton";
import { NativeShareButton } from "@/components/ui/NativeShareButton";

type TracePageShareActionsProps = {
  entryId: string;
  traceText: string;
};

export function TracePageShareActions({ entryId, traceText }: TracePageShareActionsProps) {
  return (
    <div className="flex w-full max-w-[min(100%,24rem)] flex-col gap-2.5 sm:max-w-xl">
      <CopyTraceLinkButton entryId={entryId} label="Copy link" variant="full" />
      <CopyTraceTextButton traceText={traceText} variant="full" />
      <NativeShareButton traceText={traceText} entryId={entryId} />
    </div>
  );
}
