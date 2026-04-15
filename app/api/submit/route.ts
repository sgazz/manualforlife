import { NextResponse } from "next/server";
import { logAbuseAttempt } from "@/lib/logger";
import { getClientIdentifier } from "@/lib/requestIdentity";
import {
  checkSubmissionRateLimit,
  isShadowBanned,
  registerViolation,
} from "@/lib/rateLimit";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  isTurnstileEnabled,
  validateTurnstileToken,
} from "@/lib/turnstile";
import { validateEntryText } from "@/lib/validation";

type SubmitPayload = {
  text?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

export async function POST(request: Request) {
  const { ip, rateLimitKey, userAgent } = getClientIdentifier(request);

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  if (typeof contentLength === "number" && Number.isFinite(contentLength) && contentLength > 1024) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "payload_too_large",
      metadata: { contentLength },
    });
    registerViolation(rateLimitKey);
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const rateLimit = checkSubmissionRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    registerViolation(rateLimitKey);
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "rate_limit_exceeded",
      metadata: { retryAfterMs: rateLimit.retryAfterMs },
    });

    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString(),
        },
      },
    );
  }

  let payload: SubmitPayload;
  try {
    payload = (await request.json()) as SubmitPayload;
  } catch {
    registerViolation(rateLimitKey);
    logAbuseAttempt({ ip, userAgent, reason: "invalid_body" });
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    registerViolation(rateLimitKey);
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "honeypot_triggered",
    });
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (isTurnstileEnabled()) {
    const token =
      typeof payload.turnstileToken === "string" ? payload.turnstileToken : "";
    const validTurnstile = await validateTurnstileToken(token, ip);

    if (!validTurnstile.ok) {
      registerViolation(rateLimitKey);
      logAbuseAttempt({
        ip: rateLimitKey,
        userAgent,
        reason: "turnstile_failed",
      });
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
  }

  const validation = validateEntryText(payload.text);
  if (!validation.success) {
    registerViolation(rateLimitKey);
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "invalid_input",
      metadata: { validationReason: validation.reason },
    });
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (isShadowBanned(rateLimitKey)) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "shadow_ban_active",
    });
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const { error } = await supabaseServer.from("entries").insert({
    text: validation.normalizedText,
    stars: 0,
  });

  if (error) {
    registerViolation(rateLimitKey);
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "database_error",
    });
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
