/** Canonical public app origin for share links, OG, and canonical URLs. */
export const CANONICAL_APP_ORIGIN = "https://app.manualfor.life";

// Public share URLs must always point to the canonical app host, not the current
// deployment host, because Vercel preview/default domains may also serve the app.

function isNonPublicShareOrigin(origin: string): boolean {
  const lower = origin.toLowerCase();
  return (
    lower.includes("vercel.app") ||
    lower.includes("localhost") ||
    lower.includes("127.0.0.1")
  );
}

function resolvePublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!configured || isNonPublicShareOrigin(configured)) {
    return CANONICAL_APP_ORIGIN;
  }
  return configured;
}

export const siteUrl = resolvePublicSiteOrigin();

export function buildTracePath(entryId: string) {
  return `/trace/${entryId}`;
}

export function buildTraceUrl(entryId: string): string {
  return `${siteUrl}${buildTracePath(entryId)}`;
}
