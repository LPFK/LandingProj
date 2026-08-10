import type { APIRoute } from "astro";
import { waitlistSchema } from "../../lib/validation";
import { insertWaitlist } from "../../lib/supabase";
import { sendConfirmationEmail, sendWelcomeEmail } from "../../lib/resend";
import { rateLimit, getClientIp } from "../../lib/rateLimit";
import { turnstileConfigured, verifyTurnstile } from "../../lib/turnstile";
import { generateToken } from "../../lib/tokens";

export const prerender = false;

// Double opt-in (email confirmation link) is DISABLED for now: commercially the
// extra click hurts signup conversion. When false, signups are stored as
// confirmed immediately and receive a simple welcome email (no link). Flip to
// true to re-enable the full tokenised confirmation flow — the code path, the
// /confirmer page, and the DB columns are all kept intact.
//
// If you re-enable it, also revert the form success copy in copy.fr.json
// (`waitlist.successTitle`/`successBody`) to the "check your email" wording.
const DOUBLE_OPTIN = false;

// Confirmation link lifetime for the double opt-in email.
const TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

// Per-IP throttle: at most 5 signups per 10 minutes.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  const ip = getClientIp(request, clientAddress);

  // 1. Rate limit before doing any work (cheap abuse protection).
  const limit = rateLimit(`waitlist:${ip}`, { windowMs: RATE_WINDOW_MS, max: RATE_MAX });
  if (!limit.ok) {
    return json({ ok: false, error: "rate_limited" }, 429, {
      "retry-after": String(limit.retryAfterSec),
    });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "invalid_content_type" }, 415);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // 2. Bot check (only enforced when Turnstile is configured).
  if (turnstileConfigured()) {
    const token =
      typeof (payload as Record<string, unknown>)?.turnstileToken === "string"
        ? ((payload as Record<string, unknown>).turnstileToken as string)
        : undefined;
    const check = await verifyTurnstile(token, ip);
    if (!check.ok) {
      return json({ ok: false, error: "bot_check" }, 403);
    }
  }

  // 3. Validate the payload (unknown keys like turnstileToken are stripped).
  const parsed = waitlistSchema.safeParse(payload);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join("."));
    return json({ ok: false, error: "validation", fields }, 422);
  }

  // 4. Store the signup, and prepare a confirmation link if double opt-in is on.
  let confirmUrl: string | null = null;
  let stored;
  if (DOUBLE_OPTIN) {
    const { raw, hash } = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    stored = await insertWaitlist(parsed.data, { mode: "pending", tokenHash: hash, tokenExpiresAt: expiresAt });
    const base = (site?.toString() ?? new URL(request.url).origin).replace(/\/$/, "");
    confirmUrl = `${base}/confirmer?token=${encodeURIComponent(raw)}`;
  } else {
    stored = await insertWaitlist(parsed.data, { mode: "confirmed" });
  }

  if (!stored.ok) {
    const status = stored.reason === "config" ? 503 : 502;
    return json({ ok: false, error: "storage" }, status);
  }

  // 5. Send the appropriate email. Failures here are non-fatal: the signup is
  // already stored, so the visitor still sees success.
  if (DOUBLE_OPTIN) {
    if (!stored.alreadyConfirmed && confirmUrl) {
      await sendConfirmationEmail(parsed.data.email, confirmUrl);
    }
  } else {
    await sendWelcomeEmail(parsed.data.email);
  }

  return json({ ok: true }, 201);
};
