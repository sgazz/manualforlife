import { NextResponse } from "next/server";
import { logAbuseAttempt } from "@/lib/logger";
import { getClientIdentifier } from "@/lib/requestIdentity";
import { checkStarRateLimit, registerViolation } from "@/lib/rateLimit";
import { supabaseServer } from "@/lib/supabaseServer";

const MAX_RETRIES = 3;

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }

  const { rateLimitKey, userAgent } = getClientIdentifier(request);
  const rateLimit = checkStarRateLimit(`${rateLimitKey}:${id}`);
  if (!rateLimit.allowed) {
    registerViolation(rateLimitKey);
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "rate_limit_exceeded",
      metadata: { retryAfterMs: rateLimit.retryAfterMs, action: "star" },
    });
    return NextResponse.json(
      { error: "Too many star attempts. Please wait a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString(),
        },
      },
    );
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const { data: existing, error: readError } = await supabaseServer
      .from("entries")
      .select("id, stars")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      logAbuseAttempt({
        ip: rateLimitKey,
        userAgent,
        reason: "database_error",
        metadata: { action: "star", step: "read" },
      });
      return NextResponse.json({ error: "Failed to star entry." }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const previousStars = typeof existing.stars === "number" ? existing.stars : null;
    const updateQuery = supabaseServer
      .from("entries")
      .update({ stars: (previousStars ?? 0) + 1 })
      .eq("id", id);

    const { data: updated, error: updateError } =
      previousStars === null
        ? await updateQuery.is("stars", null).select("stars").maybeSingle()
        : await updateQuery.eq("stars", previousStars).select("stars").maybeSingle();

    if (!updateError && updated) {
      return NextResponse.json({ stars: updated.stars }, { status: 200 });
    }
  }

  logAbuseAttempt({
    ip: rateLimitKey,
    userAgent,
    reason: "database_error",
    metadata: { action: "star", step: "retry_exhausted" },
  });
  return NextResponse.json(
    { error: "Could not update stars right now. Please try again." },
    { status: 409 },
  );
}
