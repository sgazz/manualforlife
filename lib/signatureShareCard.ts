export const SHARE_CARD_PORTRAIT_WIDTH = 1080;
export const SHARE_CARD_PORTRAIT_HEIGHT = 1350;
export const SHARE_CARD_SQUARE_SIZE = 1080;

export type ShareCardFormat = "portrait" | "square";

export const MANUAL_TRACE_PATH =
  "M8 38 C 46 42, 82 16, 130 6 C 162 -2, 188 22, 170 34 C 158 42, 168 46, 188 40 C 208 34, 220 22, 240 22 C 264 22, 268 42, 250 44 C 236 46, 232 52, 258 50 C 292 48, 324 34, 356 30 C 376 28, 394 28, 412 30";

export const SIGNATURE_CARD = {
  paper: "#faf6ef",
  paperDeep: "#f3ebe0",
  text: "#3f2a1d",
  muted: "#6b4a2c",
  mark: "rgba(107, 74, 44, 0.78)",
  vignette: "rgba(84, 45, 24, 0.09)",
} as const;

export function getShareCardDimensions(format: ShareCardFormat) {
  if (format === "square") {
    return { width: SHARE_CARD_SQUARE_SIZE, height: SHARE_CARD_SQUARE_SIZE };
  }
  return { width: SHARE_CARD_PORTRAIT_WIDTH, height: SHARE_CARD_PORTRAIT_HEIGHT };
}

export function getShareCardAspectRatio(format: ShareCardFormat) {
  const { width, height } = getShareCardDimensions(format);
  return `${width} / ${height}`;
}

export function quoteFontSizePx(length: number) {
  if (length <= 60) return 56;
  if (length <= 100) return 48;
  if (length <= 140) return 42;
  return 36;
}

export function quoteSizeClass(length: number) {
  if (length <= 60) return "text-[clamp(1.75rem,5vw,2.45rem)] leading-[1.44]";
  if (length <= 100) return "text-[clamp(1.55rem,4.5vw,2.1rem)] leading-[1.46]";
  if (length <= 140) return "text-[clamp(1.35rem,4vw,1.85rem)] leading-[1.48]";
  return "text-[clamp(1.2rem,3.5vw,1.65rem)] leading-[1.5]";
}

export function formatSignatureShareDate(dateString: string | null | undefined) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
