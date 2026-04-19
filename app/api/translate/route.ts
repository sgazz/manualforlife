import { NextResponse } from "next/server";
import { logAbuseAttempt } from "@/lib/logger";
import { getClientIdentifier } from "@/lib/requestIdentity";
import { checkTranslateRateLimit, registerViolation } from "@/lib/rateLimit";
import { ENTRY_MAX_LENGTH, validateEntryText } from "@/lib/validation";
import { isSupportedTranslationLang } from "@/lib/translationLocale";

const TRANSLATION_SYSTEM_PROMPT = `You translate very short personal reflections ("traces") for readers.

Strict rules:
- Preserve meaning exactly. Do not add facts, judgment, or interpretation.
- Preserve brevity and tone (calm, intimate, understated).
- Output ONLY the translated text: no title, no quotes, no preamble, no explanation, no notes.
- If the input is already in the target language, return it unchanged (still as plain text only).`;

type TranslateBody = {
  text?: unknown;
  targetLang?: unknown;
};

function stripModelFences(text: string) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "").trim();
  }
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

export async function POST(request: Request) {
  const { ip, rateLimitKey, userAgent } = getClientIdentifier(request);

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
  if (typeof contentLength === "number" && Number.isFinite(contentLength) && contentLength > 4096) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "payload_too_large",
      metadata: { contentLength },
    });
    registerViolation(rateLimitKey);
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const rateLimit = checkTranslateRateLimit(rateLimitKey);
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

  let body: TranslateBody;
  try {
    body = (await request.json()) as TranslateBody;
  } catch {
    registerViolation(rateLimitKey);
    logAbuseAttempt({ ip, userAgent, reason: "invalid_body" });
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!isSupportedTranslationLang(body.targetLang)) {
    registerViolation(rateLimitKey);
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  const targetLang = body.targetLang;
  const validation = validateEntryText(body.text);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }
  const text = validation.normalizedText;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Translation is temporarily unavailable." },
      { status: 503 },
    );
  }

  const model =
    process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-4o-mini";

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: Math.min(400, ENTRY_MAX_LENGTH * 3),
        messages: [
          { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Target language (BCP-47 primary tag): ${targetLang}\n\nTrace to translate:\n${text}`,
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  if (!upstream.ok) {
    logAbuseAttempt({
      ip: rateLimitKey,
      userAgent,
      reason: "translation_upstream_error",
      metadata: { status: upstream.status },
    });
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  const payload = (await upstream.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  const translated = stripModelFences(raw);
  if (!translated || translated.length > ENTRY_MAX_LENGTH * 4) {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  return NextResponse.json({ translated }, { status: 200 });
}
