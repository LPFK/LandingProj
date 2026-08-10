# Landing page | children's shoe subscription (waitlist)

Static-first Astro landing page in French to build a qualified waitlist. See
`CLAUDE.md` for the authoritative spec and `BRIEF.md` for the short brief.

## Stack

- Astro 5 (static-first, one React island for the form)
- Tailwind CSS v4 (design tokens in `src/styles/globals.css` under `@theme`)
- Fonts self-hosted via fontsource (Fraunces, Inter)
- `zod` shared validation (client and server)
- Supabase (`waitlist` table, RLS) for storage
- Resend for the confirmation email
- Plausible (cookieless) for analytics
- Node standalone adapter for the `/api/waitlist` endpoint (self-hosted on O2switch cPanel + Passenger)

## Setup

```bash
npm install
cp .env.example .env   # then fill the values
npm run dev
```

Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`.

## Environment

All keys are documented in `.env.example`. `SUPABASE_*` and `RESEND_*` are
server-only. `PUBLIC_PLAUSIBLE_DOMAIN` is exposed to the client; leave it empty
in local development to keep the analytics script off.

## Supabase table

The schema is a versioned migration at
`supabase/migrations/20260702133334_waitlist.sql`. Row-level security is enabled
with no anon/authenticated policy, so only the service role (used server-side in
the endpoint) can read or write. Apply it by one of:

- Local dev database (needs Docker Desktop running):

  ```bash
  npx supabase start        # boots Postgres and applies migrations, prints keys
  ```

  `.env` is pre-filled with the CLI's standard local keys, so the app works
  against local Supabase once `start` is up.

- Cloud project (needs the Supabase CLI logged in):

  ```bash
  npx supabase link --project-ref <your-ref>
  npx supabase db push
  ```

- Manual: paste the contents of the migration file into the dashboard SQL
  editor and run it.

After applying to cloud, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in
`.env` from Supabase dashboard > Project Settings > API.

## Form contract

The single source of truth is `src/lib/validation.ts` (zod schema), imported by
both `src/components/WaitlistForm.tsx` and `src/pages/api/waitlist.ts`. It must
stay in lockstep with CLAUDE.md section 7.

## Notes

- No double opt-in in v1. See `TODO_DOUBLE_OPTIN` in `src/pages/api/waitlist.ts`.
- Legal pages are stubs. See `TODO_LEGAL` in the two legal pages.
- Lighthouse targets (section 11) need a deploy with real assets to score.
