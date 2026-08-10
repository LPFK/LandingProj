import { defineMiddleware } from "astro:middleware";

// Security headers applied to every server-rendered response. All pages here
// are on-demand rendered (no `prerender = true`), so this middleware runs for
// each HTML document and the API route.
//
// The CSP allows the small first-party inline theme script and the inline
// styles Astro/React emit (`'unsafe-inline'`), plus the two third parties the
// page loads: Cloudflare Turnstile (bot check) and Plausible (analytics).
// Supabase and Resend are called server-side only, so they need no client
// directives. It is only sent in production because Vite's dev server relies on
// inline scripts and a websocket that a strict policy would block.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://plausible.io",
  "connect-src 'self' https://challenges.cloudflare.com https://plausible.io",
  "frame-src https://challenges.cloudflare.com",
].join("; ");

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = response.headers;

  if (import.meta.env.PROD) {
    headers.set("Content-Security-Policy", CSP);
  }
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  return response;
});
