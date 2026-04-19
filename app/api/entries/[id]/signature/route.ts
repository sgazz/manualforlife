import { NextResponse } from "next/server";
import { getClientIdentifier } from "@/lib/requestIdentity";
import { checkSignatureRateLimit, registerViolation } from "@/lib/rateLimit";
import { supabaseServer } from "@/lib/supabaseServer";
import { normalizeSignature } from "@/lib/validation";

const SIGNATURE_EDIT_WINDOW_MS = 12 * 60 * 1000;

type PatchBody = {
  signature?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  }

  const { rateLimitKey } = getClientIdentifier(request);
  const rateLimit = checkSignatureRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    registerViolation(rateLimitKey);
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

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    registerViolation(rateLimitKey);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const normalized = normalizeSignature(body.signature);
  if (normalized === null) {
    return NextResponse.json({ error: "Signature required or invalid" }, { status: 400 });
  }

  const { data: row, error: fetchError } = await supabaseServer
    .from("entries")
    .select("id, created_at, signature")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const createdAt = new Date(row.created_at as string).getTime();
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SIGNATURE_EDIT_WINDOW_MS) {
    return NextResponse.json({ error: "Signature can no longer be updated" }, { status: 410 });
  }

  const existingSignature =
    typeof row.signature === "string" ? row.signature : null;
  if (existingSignature === normalized) {
    return NextResponse.json({ success: true, unchanged: true }, { status: 200 });
  }

  const { error: updateError } = await supabaseServer
    .from("entries")
    .update({ signature: normalized })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update signature" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
