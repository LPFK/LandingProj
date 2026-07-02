import { Resend } from "resend";
import copy from "../content/copy.fr.json";

/*
 * Server-only Resend access for the French confirmation email (section 3).
 * Failure here must not fail the whole signup: the row is already stored, so
 * the endpoint treats a missed email as non-blocking and logs no PII.
 */

const NETWORK_TIMEOUT_MS = 8000;

export type EmailResult = { ok: true } | { ok: false; reason: "config" | "send" };

function buildHtml(): string {
  const { heading, body, signature } = copy.email;
  return `<!doctype html>
<html lang="fr">
  <body style="font-family: Inter, Arial, sans-serif; color: #1e1a17; line-height: 1.6;">
    <h1 style="font-size: 20px;">${heading}</h1>
    <p>${body}</p>
    <p>${signature}</p>
  </body>
</html>`;
}

function buildText(): string {
  const { heading, body, signature } = copy.email;
  return `${heading}\n\n${body}\n\n${signature}`;
}

/**
 * Sends the confirmation email. Returns a typed result instead of throwing.
 */
export async function sendConfirmationEmail(to: string): Promise<EmailResult> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM;
  if (!apiKey || !from) return { ok: false, reason: "config" };

  const resend = new Resend(apiKey);

  // The Resend SDK does not forward an abort signal, so we race the call
  // against an explicit timeout to guarantee a bounded network wait.
  const timeout = new Promise<EmailResult>((resolve) =>
    setTimeout(() => resolve({ ok: false, reason: "send" }), NETWORK_TIMEOUT_MS),
  );

  const send = (async (): Promise<EmailResult> => {
    try {
      const { error } = await resend.emails.send({
        from,
        to,
        subject: copy.email.subject,
        html: buildHtml(),
        text: buildText(),
      });
      if (error) return { ok: false, reason: "send" };
      return { ok: true };
    } catch {
      return { ok: false, reason: "send" };
    }
  })();

  return Promise.race([send, timeout]);
}
