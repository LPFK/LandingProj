import type { APIRoute } from "astro";
import { waitlistSchema } from "../../lib/validation";
import { insertWaitlist } from "../../lib/supabase";
import { sendConfirmationEmail } from "../../lib/resend";

export const prerender = false;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "invalid_content_type" }, 415);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const parsed = waitlistSchema.safeParse(payload);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join("."));
    return json({ ok: false, error: "validation", fields }, 422);
  }

  const stored = await insertWaitlist(parsed.data);
  if (!stored.ok) {
    const status = stored.reason === "config" ? 503 : 502;
    return json({ ok: false, error: "storage" }, status);
  }

  // TODO_DOUBLE_OPTIN: replace direct confirmation with tokenised verification
  // email and mark the row unconfirmed until the token is followed.
  await sendConfirmationEmail(parsed.data.email);

  return json({ ok: true }, 201);
};
