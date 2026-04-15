type TurnstileVerifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

type TurnstileValidationResult = {
  ok: boolean;
};

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function validateTurnstileToken(
  token: string,
  ip: string,
): Promise<TurnstileValidationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: true };
  }

  const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME;
  const expectedAction = process.env.TURNSTILE_EXPECTED_ACTION ?? "submit";

  const params = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip,
  });

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = (await response.json()) as TurnstileVerifyResponse;
  if (!data.success) {
    return { ok: false };
  }

  if (expectedHostname && data.hostname !== expectedHostname) {
    return { ok: false };
  }

  if (data.action !== expectedAction) {
    return { ok: false };
  }

  return { ok: true };
}
