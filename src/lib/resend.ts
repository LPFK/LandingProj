import { Resend } from "resend";
import copy from "../content/copy.fr.json";

const NETWORK_TIMEOUT_MS = 8000;

export type EmailResult = { ok: true } | { ok: false; reason: "config" | "send" };

// Basic HTML-attribute escaping for the one dynamic value (the confirmation
// URL) that lands inside an href. The URL is app-generated, but escaping keeps
// the template safe if that ever changes.
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(confirmUrl: string): string {
  const { heading, body, cta, fallback, expiry, ignore, signature } = copy.email;
  const href = escapeAttr(confirmUrl);
  return `<!doctype html>
<html lang="fr">
  <body style="font-family: Inter, Arial, sans-serif; color: #1a1612; line-height: 1.65; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <p style="font-size: 13px; color: #6B5F57; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 32px;">Pazapas</p>
    <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">${heading}</h1>
    <p style="color: #6B5F57; margin-bottom: 24px;">${body}</p>
    <p style="margin: 0 0 24px;">
      <a href="${href}" style="display: inline-block; background: #C4643B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 500;">${cta}</a>
    </p>
    <p style="color: #6B5F57; font-size: 13px; margin-bottom: 8px;">${fallback}</p>
    <p style="font-size: 13px; margin-bottom: 24px; word-break: break-all;"><a href="${href}" style="color: #C4643B;">${href}</a></p>
    <p style="color: #6B5F57; font-size: 13px; margin-bottom: 24px;">${expiry}</p>
    <p style="color: #9a8f86; font-size: 12px; margin-bottom: 24px;">${ignore}</p>
    <p style="color: #6B5F57;">${signature}</p>
  </body>
</html>`;
}

function buildText(confirmUrl: string): string {
  const { heading, body, cta, expiry, ignore, signature } = copy.email;
  return `${heading}\n\n${body}\n\n${cta} : ${confirmUrl}\n\n${expiry}\n\n${ignore}\n\n${signature}`;
}

// Single opt-in welcome email: no confirmation link, just an acknowledgement.
function buildWelcomeHtml(): string {
  const { heading, body, signature } = copy.emailWelcome;
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

function buildWelcomeText(): string {
  const { heading, body, signature } = copy.emailWelcome;
  return `${heading}\n\n${body}\n\n${signature}`;
}

// Shared send with a hard timeout. `payload` provides the subject/html/text.
async function sendEmail(
  to: string,
  payload: { subject: string; html: string; text: string },
): Promise<EmailResult> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM;
  if (!apiKey || !from) return { ok: false, reason: "config" };

  const resend = new Resend(apiKey);

  const timeout = new Promise<EmailResult>((resolve) =>
    setTimeout(() => resolve({ ok: false, reason: "send" }), NETWORK_TIMEOUT_MS),
  );

  const send = (async (): Promise<EmailResult> => {
    try {
      const { error } = await resend.emails.send({ from, to, ...payload });
      if (error) return { ok: false, reason: "send" };
      return { ok: true };
    } catch {
      return { ok: false, reason: "send" };
    }
  })();

  return Promise.race([send, timeout]);
}

// Double opt-in confirmation email (kept for when double opt-in is re-enabled).
export function sendConfirmationEmail(to: string, confirmUrl: string): Promise<EmailResult> {
  return sendEmail(to, {
    subject: copy.email.subject,
    html: buildHtml(confirmUrl),
    text: buildText(confirmUrl),
  });
}

// Single opt-in welcome email (no confirmation link).
export function sendWelcomeEmail(to: string): Promise<EmailResult> {
  return sendEmail(to, {
    subject: copy.emailWelcome.subject,
    html: buildWelcomeHtml(),
    text: buildWelcomeText(),
  });
}
