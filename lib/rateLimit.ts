type RateLimitEntry = {
  timestamp: number;
  violationCount: number;
  shadowBanUntil: number | null;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

const RATE_LIMIT_WINDOW_MS = 15_000;
const STAR_RATE_LIMIT_WINDOW_MS = 60_000;
const STAR_RATE_LIMIT_MAX_REQUESTS = 15;
const ENTRY_TTL_MS = 120_000;
const CLEANUP_INTERVAL_MS = 60_000;
const SHADOW_BAN_THRESHOLD = 5;
const SHADOW_BAN_DURATION_MS = 10 * 60_000;

const store = new Map<string, RateLimitEntry>();
const submissionWindowStore = new Map<string, { timestamp: number; requestCount: number }>();
const starWindowStore = new Map<string, { timestamp: number; requestCount: number }>();

function getOrCreateEntry(ip: string, now: number) {
  const current = store.get(ip);
  if (current) {
    return current;
  }

  const created: RateLimitEntry = {
    timestamp: now,
    violationCount: 0,
    shadowBanUntil: null,
  };
  store.set(ip, created);
  return created;
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    const isShadowBanned = entry.shadowBanUntil !== null && now < entry.shadowBanUntil;
    const isStale = now - entry.timestamp > ENTRY_TTL_MS;
    if (!isShadowBanned && isStale) {
      store.delete(ip);
    }
  }

  for (const [key, entry] of submissionWindowStore.entries()) {
    if (now - entry.timestamp > ENTRY_TTL_MS) {
      submissionWindowStore.delete(key);
    }
  }

  for (const [key, entry] of starWindowStore.entries()) {
    if (now - entry.timestamp > ENTRY_TTL_MS) {
      starWindowStore.delete(key);
    }
  }
}

declare global {
  var __rateLimitCleanupStarted__: boolean | undefined;
}

if (!globalThis.__rateLimitCleanupStarted__) {
  globalThis.__rateLimitCleanupStarted__ = true;
  const interval = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
  interval.unref?.();
}

export function registerViolation(ip: string) {
  const now = Date.now();
  const entry = getOrCreateEntry(ip, now);

  entry.violationCount += 1;
  entry.timestamp = now;

  if (entry.violationCount >= SHADOW_BAN_THRESHOLD) {
    entry.shadowBanUntil = now + SHADOW_BAN_DURATION_MS;
  }
}

export function isShadowBanned(ip: string) {
  const entry = store.get(ip);
  if (!entry?.shadowBanUntil) {
    return false;
  }
  return Date.now() < entry.shadowBanUntil;
}

export function checkSubmissionRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = submissionWindowStore.get(ip);
  if (!entry) {
    submissionWindowStore.set(ip, { timestamp: now, requestCount: 1 });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    entry.timestamp = now;
    entry.requestCount = 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.requestCount += 1;
  if (entry.requestCount > 1) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, RATE_LIMIT_WINDOW_MS - (now - entry.timestamp)),
    };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function checkStarRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = starWindowStore.get(key);
  if (!entry) {
    starWindowStore.set(key, { timestamp: now, requestCount: 1 });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (now - entry.timestamp > STAR_RATE_LIMIT_WINDOW_MS) {
    entry.timestamp = now;
    entry.requestCount = 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.requestCount += 1;
  if (entry.requestCount > STAR_RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, STAR_RATE_LIMIT_WINDOW_MS - (now - entry.timestamp)),
    };
  }

  return { allowed: true, retryAfterMs: 0 };
}
