import { siteUrl } from "@/lib/site";

export const NATIVE_SHARE_TITLE = "A trace left on manualfor.life";

export function formatTraceShareText(text: string) {
  const trimmed = text.trim();
  return `"${trimmed}" — manualfor.life`;
}

export function formatTraceShareClipboardPayload(
  text: string,
  url: string = siteUrl,
) {
  return `${formatTraceShareText(text)}\n${url.replace(/\/$/, "")}`;
}
