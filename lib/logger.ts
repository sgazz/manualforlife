import { createHash } from "node:crypto";

type LogReason =
  | "rate_limit_exceeded"
  | "invalid_input"
  | "invalid_body"
  | "honeypot_triggered"
  | "turnstile_failed"
  | "database_error"
  | "payload_too_large"
  | "shadow_ban_active";

type LogParams = {
  ip: string;
  userAgent: string;
  reason: LogReason;
  metadata?: Record<string, unknown>;
};

type DedupeEntry = {
  windowStart: number;
  count: number;
};

const DEDUPE_WINDOW_MS = 60_000;
const SAMPLE_EVERY = 5;
const dedupeStore = new Map<string, DedupeEntry>();

function hashIp(ip: string) {
  const salt = process.env.LOG_HASH_SALT ?? "manualforlife-default-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function logAbuseAttempt({ ip, userAgent, reason, metadata }: LogParams) {
  const ipHash = hashIp(ip || "unknown");
  const dedupeKey = `${reason}:${ipHash}`;
  const now = Date.now();

  const existing = dedupeStore.get(dedupeKey);
  if (!existing || now - existing.windowStart > DEDUPE_WINDOW_MS) {
    dedupeStore.set(dedupeKey, { windowStart: now, count: 1 });
  } else {
    existing.count += 1;
    dedupeStore.set(dedupeKey, existing);
    if (existing.count % SAMPLE_EVERY !== 0) {
      return;
    }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    ipHash,
    userAgent: userAgent || "unknown",
    reason,
    metadata: metadata ?? {},
  };

  console.warn("[abuse-log]", JSON.stringify(entry));
}
