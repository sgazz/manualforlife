import {
  formatSignatureShareDate,
  getShareCardDimensions,
  quoteFontSizePx,
  SIGNATURE_CARD,
  type ShareCardFormat,
} from "@/lib/signatureShareCard";

export type ShareImageData = {
  traceText: string;
  signature?: string | null;
  createdAt?: string | null;
  shareUrl: string;
  format?: ShareCardFormat;
};

/** @deprecated Use SHARE_CARD_PORTRAIT_WIDTH from lib/signatureShareCard */
export const SHARE_IMAGE_WIDTH = 1080;
/** @deprecated Use SHARE_CARD_PORTRAIT_HEIGHT from lib/signatureShareCard */
export const SHARE_IMAGE_HEIGHT = 1350;

let traceMarkImagePromise: Promise<HTMLImageElement | null> | null = null;

function loadTraceMarkImage() {
  if (typeof document === "undefined") {
    return Promise.resolve(null);
  }

  if (!traceMarkImagePromise) {
    traceMarkImagePromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/brand/manual-trace.svg";
    });
  }

  return traceMarkImagePromise;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function drawPaperBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = SIGNATURE_CARD.paper;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.18,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  );
  vignette.addColorStop(0, "rgba(250, 246, 239, 0)");
  vignette.addColorStop(1, SIGNATURE_CARD.vignette);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 6;
    data[i] = Math.min(255, Math.max(0, data[i]! + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1]! + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2]! + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  ctx.strokeStyle = "rgba(107, 74, 44, 0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);
}

function drawTraceMark(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  markImage: HTMLImageElement | null,
) {
  const markWidth = Math.min(220, width * 0.34);
  const markHeight = (markWidth / 420) * 54;
  const x = (width - markWidth) / 2;

  ctx.save();
  ctx.globalAlpha = 0.82;

  if (markImage) {
    ctx.drawImage(markImage, x, y, markWidth, markHeight);
  } else {
    ctx.strokeStyle = SIGNATURE_CARD.mark;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + markWidth * 0.02, y + markHeight * 0.7);
    ctx.bezierCurveTo(
      x + markWidth * 0.11,
      y + markHeight * 0.78,
      x + markWidth * 0.2,
      y + markHeight * 0.3,
      x + markWidth * 0.31,
      y + markHeight * 0.11,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.39,
      y + markHeight * 0.04,
      x + markWidth * 0.45,
      y + markHeight * 0.41,
      x + markWidth * 0.4,
      y + markHeight * 0.63,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.37,
      y + markHeight * 0.78,
      x + markWidth * 0.4,
      y + markHeight * 0.85,
      x + markWidth * 0.45,
      y + markHeight * 0.74,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.5,
      y + markHeight * 0.63,
      x + markWidth * 0.52,
      y + markHeight * 0.41,
      x + markWidth * 0.57,
      y + markHeight * 0.41,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.63,
      y + markHeight * 0.41,
      x + markWidth * 0.64,
      y + markHeight * 0.78,
      x + markWidth * 0.6,
      y + markHeight * 0.81,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.56,
      y + markHeight * 0.85,
      x + markWidth * 0.55,
      y + markHeight * 0.96,
      x + markWidth * 0.61,
      y + markHeight * 0.93,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.69,
      y + markHeight * 0.89,
      x + markWidth * 0.77,
      y + markHeight * 0.63,
      x + markWidth * 0.85,
      y + markHeight * 0.56,
    );
    ctx.bezierCurveTo(
      x + markWidth * 0.9,
      y + markHeight * 0.52,
      x + markWidth * 0.94,
      y + markHeight * 0.52,
      x + markWidth * 0.98,
      y + markHeight * 0.56,
    );
    ctx.stroke();
  }

  ctx.restore();
}

export async function exportShareImagePng(data: ShareImageData): Promise<Blob | null> {
  if (typeof document === "undefined") {
    return null;
  }

  await document.fonts.ready;

  const trimmed = data.traceText.trim();
  if (!trimmed) {
    return null;
  }

  const format = data.format ?? "portrait";
  const { width, height } = getShareCardDimensions(format);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  drawPaperBackground(ctx, width, height);

  const paddingX = 120;
  const maxTextWidth = width - paddingX * 2;
  const quote = `\u201C${trimmed}\u201D`;
  const size = quoteFontSizePx(trimmed.length);
  const footerHeight = 260;
  const quoteAreaTop = 120;
  const quoteAreaBottom = height - footerHeight;
  const quoteAreaHeight = quoteAreaBottom - quoteAreaTop;

  ctx.fillStyle = SIGNATURE_CARD.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${size}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;

  const lines = wrapText(ctx, quote, maxTextWidth);
  const lineHeight = size * 1.46;
  const textBlockHeight = lines.length * lineHeight;
  let y = quoteAreaTop + quoteAreaHeight / 2 - textBlockHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, width / 2, y);
    y += lineHeight;
  }

  const markImage = await loadTraceMarkImage();
  const markY = height - footerHeight + 28;
  drawTraceMark(ctx, width, markY, markImage);

  ctx.fillStyle = "rgba(107, 74, 44, 0.62)";
  ctx.font = '500 22px "Inter", system-ui, sans-serif';
  ctx.fillText("manualfor.life", width / 2, height - 118);

  const author = data.signature?.trim() || "";
  const dateLabel = formatSignatureShareDate(data.createdAt) || "";

  if (author || dateLabel) {
    ctx.font = '400 22px "Inter", system-ui, sans-serif';
    ctx.fillStyle = "rgba(107, 74, 44, 0.58)";
    ctx.textAlign = "left";
    ctx.fillText(author, paddingX, height - 62);
    ctx.textAlign = "right";
    ctx.fillText(dateLabel, width - paddingX, height - 62);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export function downloadShareImageBlob(blob: Blob, filename = "manualforlife-trace.png") {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
