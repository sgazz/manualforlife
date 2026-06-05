"use client";

import { CopyTraceLinkButton } from "@/components/ui/CopyTraceLinkButton";
import { CopyTraceTextButton } from "@/components/ui/CopyTraceTextButton";
import { NativeShareButton } from "@/components/ui/NativeShareButton";
import { ShareImageButton } from "@/components/ui/ShareImageButton";

type TracePageShareActionsProps = {
  entryId: string;
  traceText: string;
  signature?: string | null;
  createdAt?: string | null;
};

export function TracePageShareActions({
  entryId,
  traceText,
  signature = null,
  createdAt = null,
}: TracePageShareActionsProps) {
  return (
    <div className="flex w-full max-w-[min(100%,24rem)] flex-col gap-2.5 sm:max-w-xl">
      <CopyTraceLinkButton entryId={entryId} label="Copy link" variant="full" />
      <CopyTraceTextButton traceText={traceText} variant="full" />
      <ShareImageButton
        traceText={traceText}
        entryId={entryId}
        signature={signature}
        createdAt={createdAt}
        variant="full"
      />
      <NativeShareButton traceText={traceText} entryId={entryId} />
    </div>
  );
}
