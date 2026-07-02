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
- Vercel adapter for the `/api/waitlist` endpoint

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

Run this in the Supabase SQL editor. Row-level security is enabled and no anon
policy is added, so only the service role (used server-side in the endpoint)
can insert.

```sql
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  email text not null unique,
  child_age_ranges text[] not null,
  postal_code text,
  referral_source text,
  consent_marketing boolean not null,
  consent_version text not null
);

alter table public.waitlist enable row level security;
-- No policies for anon/authenticated: only the service role bypasses RLS.
```

## Form contract

The single source of truth is `src/lib/validation.ts` (zod schema), imported by
both `src/components/WaitlistForm.tsx` and `src/pages/api/waitlist.ts`. It must
stay in lockstep with CLAUDE.md section 7.

## Notes

- No double opt-in in v1. See `TODO_DOUBLE_OPTIN` in `src/pages/api/waitlist.ts`.
- Legal pages are stubs. See `TODO_LEGAL` in the two legal pages.
- Lighthouse targets (section 11) need a deploy with real assets to score.
