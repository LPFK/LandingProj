// Cloudflare Turnstile server-side verification for the waitlist endpoint.
// Turnstile is a free, privacy-friendly CAPTCHA alternative (no cookies, no
// personal-data profiling), which suits a French/EU audience. When the secret
// key is not configured the check is skipped so local development still works;
// production MUST set both TURNSTILE_SECRET_KEY and PUBLIC_TURNSTILE_SITE_KEY.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const NETWORK_TIMEOUT_MS = 8000;

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "missing_token" | "failed" };

export function turnstileConfigured(): boolean {
  return Boolean(import.meta.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<TurnstileResult> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, reason: "unconfigured" };
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true ? { ok: true } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
