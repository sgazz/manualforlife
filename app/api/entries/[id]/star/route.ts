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

function getVisitorId(request: Request) {
  const visitorId = request.headers.get("x-visitor-id")?.trim() ?? "";
  if (!isValidUuid(visitorId)) {
    return null;
  }
  return visitorId;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }
  const visitorId = getVisitorId(request);
  if (!visitorId) {
    return NextResponse.json({ error: "Missing visitor id." }, { status: 400 });
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

  const { data: existingStar, error: readStarError } = await supabaseServer
    .from("entry_stars")
    .select("entry_id")
    .eq("entry_id", id)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (readStarError) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "database_error",
      metadata: { action: "star", step: "read_star" },
    });
    return NextResponse.json({ error: "Failed to star entry." }, { status: 500 });
  }

  if (existingStar) {
    const { data: existingEntry, error: existingEntryError } = await supabaseServer
      .from("entries")
      .select("stars")
      .eq("id", id)
      .maybeSingle();

    if (existingEntryError || !existingEntry) {
      return NextResponse.json({ error: "Failed to star entry." }, { status: 500 });
    }

    return NextResponse.json(
      { stars: typeof existingEntry.stars === "number" ? existingEntry.stars : 0, alreadyStarred: true },
      { status: 200 },
    );
  }

  const { error: createStarError } = await supabaseServer
    .from("entry_stars")
    .insert({ entry_id: id, visitor_id: visitorId });

  if (createStarError) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "database_error",
      metadata: { action: "star", step: "insert_star" },
    });
    return NextResponse.json({ error: "Failed to star entry." }, { status: 500 });
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
      return NextResponse.json({ stars: updated.stars, alreadyStarred: false }, { status: 200 });
    }
  }

  logAbuseAttempt({
    ip: rateLimitKey,
    userAgent,
    reason: "database_error",
    metadata: { action: "star", step: "retry_exhausted" },
  });
  await supabaseServer
    .from("entry_stars")
    .delete()
    .eq("entry_id", id)
    .eq("visitor_id", visitorId);
  return NextResponse.json(
    { error: "Could not update stars right now. Please try again." },
    { status: 409 },
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid entry id." }, { status: 400 });
  }
  const visitorId = getVisitorId(request);
  if (!visitorId) {
    return NextResponse.json({ error: "Missing visitor id." }, { status: 400 });
  }

  const { rateLimitKey, userAgent } = getClientIdentifier(request);
  const rateLimit = checkStarRateLimit(`${rateLimitKey}:${id}:unstar`);
  if (!rateLimit.allowed) {
    registerViolation(rateLimitKey);
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "rate_limit_exceeded",
      metadata: { retryAfterMs: rateLimit.retryAfterMs, action: "unstar" },
    });
    return NextResponse.json(
      { error: "Too many unstar attempts. Please wait a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString(),
        },
      },
    );
  }

  const { data: existingStar, error: readStarError } = await supabaseServer
    .from("entry_stars")
    .select("id")
    .eq("entry_id", id)
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (readStarError) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "database_error",
      metadata: { action: "unstar", step: "read_star" },
    });
    return NextResponse.json({ error: "Failed to unstar entry." }, { status: 500 });
  }

  if (!existingStar) {
    const { data: existingEntry, error: existingEntryError } = await supabaseServer
      .from("entries")
      .select("stars")
      .eq("id", id)
      .maybeSingle();

    if (existingEntryError || !existingEntry) {
      return NextResponse.json({ error: "Failed to unstar entry." }, { status: 500 });
    }

    return NextResponse.json(
      { stars: typeof existingEntry.stars === "number" ? existingEntry.stars : 0, alreadyStarred: false },
      { status: 200 },
    );
  }

  const { error: deleteStarError } = await supabaseServer
    .from("entry_stars")
    .delete()
    .eq("entry_id", id)
    .eq("visitor_id", visitorId);

  if (deleteStarError) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "database_error",
      metadata: { action: "unstar", step: "delete_star" },
    });
    return NextResponse.json({ error: "Failed to unstar entry." }, { status: 500 });
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
        metadata: { action: "unstar", step: "read" },
      });
      return NextResponse.json({ error: "Failed to unstar entry." }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const previousStars = typeof existing.stars === "number" ? existing.stars : null;
    const nextStars = Math.max(0, (previousStars ?? 0) - 1);
    const updateQuery = supabaseServer
      .from("entries")
      .update({ stars: nextStars })
      .eq("id", id);

    const { data: updated, error: updateError } =
      previousStars === null
        ? await updateQuery.is("stars", null).select("stars").maybeSingle()
        : await updateQuery.eq("stars", previousStars).select("stars").maybeSingle();

    if (!updateError && updated) {
      return NextResponse.json({ stars: updated.stars, alreadyStarred: false }, { status: 200 });
    }
  }

  logAbuseAttempt({
    ip: rateLimitKey,
    userAgent,
    reason: "database_error",
    metadata: { action: "unstar", step: "retry_exhausted" },
  });
  await supabaseServer
    .from("entry_stars")
    .insert({ entry_id: id, visitor_id: visitorId });
  return NextResponse.json(
    { error: "Could not update stars right now. Please try again." },
    { status: 409 },
  );
}
