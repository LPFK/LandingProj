/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Supabase project URL (EU region). Server-only. */
  readonly SUPABASE_URL: string;
  /** Supabase service role key. Server-only, never exposed to the client. */
  readonly SUPABASE_SERVICE_ROLE: string;
  /** Resend API key for the confirmation email. Server-only. */
  readonly RESEND_API_KEY: string;
  /** Verified sender identity for Resend, e.g. "Marque <bonjour@exemple.fr>". */
  readonly RESEND_FROM: string;
  /** Plausible domain, exposed to the client for the analytics script. */
  readonly PUBLIC_PLAUSIBLE_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
