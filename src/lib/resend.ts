import { Resend } from "resend";
import copy from "../content/copy.fr.json";

const NETWORK_TIMEOUT_MS = 8000;

export type EmailResult = { ok: true } | { ok: false; reason: "config" | "send" };

function buildHtml(): string {
  const { heading, body, signature } = copy.email;
  return `<!doctype html>
<html lang="fr">
  <body style="font-family: Inter, Arial, sans-serif; color: #1a1612; line-height: 1.65; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <p style="font-size: 13px; color: #6B5F57; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 32px;">Pazapas</p>
    <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">${heading}</h1>
    <p style="color: #6B5F57; margin-bottom: 12px;">${body}</p>
    <p style="color: #6B5F57;">${signature}</p>
  </body>
</html>`;
}

function buildText(): string {
  const { heading, body, signature } = copy.email;
  return `${heading}\n\n${body}\n\n${signature}`;
}

export async function sendConfirmationEmail(to: string): Promise<EmailResult> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM;
  if (!apiKey || !from) return { ok: false, reason: "config" };

  const resend = new Resend(apiKey);

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
