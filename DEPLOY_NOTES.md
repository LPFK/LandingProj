# Deploy notes

Known limitations and pre-launch checklist. The app is fully functional in local
development. The items below must be resolved before the waitlist opens to the
public. See CLAUDE.md section 12 for the related open decisions.

## Blocking before launch

### 1. Confirmation email sender (Resend)

Current state: `RESEND_FROM` uses Resend's shared test sender
`onboarding@resend.dev`. In test mode Resend only delivers to the address that
owns the Resend account, so real signups will not receive the email.

To fix:
- Verify a domain you control in the Resend dashboard (add the SPF and DKIM DNS
  records Resend provides, wait for verification).
- Set `RESEND_FROM` to an address on that domain, for example
  `"Nom du service <bonjour@votredomaine.fr>"`.
- No code change is needed. The sending path is already verified end to end.

### 2. Legal pages content

`src/pages/mentions-legales.astro` and
`src/pages/politique-de-confidentialite.astro` are drafted but contain bracketed
placeholders (marked `TODO_LEGAL`) for details only the operator can supply:
company legal identity (raison sociale, forme juridique, capital, SIREN or RCS,
siège social, TVA), the publication director, the real contact email, the final
hosting provider, the exact data retention period, and the definitive list of
sub-processors. The whole text must be reviewed by a lawyer before launch.

The placeholder contact email in both pages and in the footer is
`contact@exemple.fr`. Replace it with the real address.

### 3. Production Supabase

Current state: the app points at a local Supabase stack
(`SUPABASE_URL=http://127.0.0.1:54321`) running under Docker.

To fix:
- Create a hosted Supabase project in an EU region.
- Apply the migration in `supabase/migrations/` (it now grants `service_role`
  the DML it needs; a fresh database works without manual steps).
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` as environment variables in the
  hosting provider (Vercel), never in the client bundle.

### 4. Hosting and environment variables

- Deploy target is Vercel (astro.config.mjs uses the Vercel adapter).
- Set all server env vars in the Vercel project: `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE`, `RESEND_API_KEY`, `RESEND_FROM`, and the public
  `PUBLIC_PLAUSIBLE_DOMAIN`.
- Confirm `site` in `astro.config.mjs` is set to the real production URL (it is
  currently `https://example.com`), which drives canonical and Open Graph URLs.

## Non-blocking, deferred by design

- Analytics: `PUBLIC_PLAUSIBLE_DOMAIN` is empty, so the Plausible script is not
  injected. Set it once the domain is chosen.
- Double opt-in: not implemented in v1 (see `TODO_DOUBLE_OPTIN` in
  `src/pages/api/waitlist.ts`). The insert stays; only the email step would
  change to a tokenised confirmation.

## Local development setup (for reference)

- Docker Desktop data was relocated off the C: drive to
  `E:\Docker_data` via a directory junction at
  `C:\Users\<user>\AppData\Local\Docker\wsl`. This survives restarts.
- Start the local backend with `npx supabase start`, apply the schema with
  `npx supabase db reset`, then run the site with `npm run dev`.
- Local Supabase Studio: http://localhost:54323. Local mail catcher (Mailpit):
  http://localhost:54324 (note: the app uses Resend, not Mailpit).
