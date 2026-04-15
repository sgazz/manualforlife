type ClientIdentity = {
  ip: string;
  rateLimitKey: string;
  userAgent: string;
};

function extractIpFromHeader(value: string | null) {
  if (!value) return null;
  const candidate = value.split(",")[0]?.trim();
  if (!candidate) return null;

  const looksLikeIp = /^([a-fA-F0-9:.]+)$/.test(candidate);
  return looksLikeIp ? candidate : null;
}

export function getClientIdentifier(request: Request): ClientIdentity {
  const trustedIp =
    extractIpFromHeader(request.headers.get("cf-connecting-ip")) ??
    extractIpFromHeader(request.headers.get("x-vercel-forwarded-for")) ??
    extractIpFromHeader(request.headers.get("x-real-ip"));

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  if (trustedIp) {
    return { ip: trustedIp, rateLimitKey: `ip:${trustedIp}`, userAgent };
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "unknown";
  const fallbackKey = `${userAgent}:${acceptLanguage}`;
  return {
    ip: "unknown",
    rateLimitKey: `fallback:${fallbackKey}`,
    userAgent,
  };
}
