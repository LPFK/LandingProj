import type { APIRoute } from "astro";
import { waitlistSchema } from "../../lib/validation";
import { insertWaitlist } from "../../lib/supabase";
import { sendConfirmationEmail } from "../../lib/resend";

// On-demand rendering: this endpoint must run per request, not at build time.
export const prerender = false;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // Guard the content type before touching the body.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "invalid_content_type" }, 415);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Server-side validation mirrors the client using the shared schema.
  const parsed = waitlistSchema.safeParse(payload);
  if (!parsed.success) {
    // Do not echo the payload back; report field names only, no PII (section 10).
    const fields = parsed.error.issues.map((i) => i.path.join("."));
    return json({ ok: false, error: "validation", fields }, 422);
  }

  const stored = await insertWaitlist(parsed.data);
  if (!stored.ok) {
    const status = stored.reason === "config" ? 503 : 502;
    return json({ ok: false, error: "storage" }, status);
  }

  // The signup is safe once stored. Email is best-effort and never blocks it.
  // TODO_DOUBLE_OPTIN: to add double opt-in, replace this direct confirmation
  // with a tokenised verification email and mark the row unconfirmed until the
  // token is followed. Keep the insert above; gate the marketing consent on it.
  await sendConfirmationEmail(parsed.data.email);

  return json({ ok: true }, 201);
};
