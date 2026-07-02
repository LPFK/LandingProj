-- Waitlist table for the landing page signups (CLAUDE.md sections 7 and 10).
-- Row-level security is enabled with no anon/authenticated policies, so only
-- the service role (used server-side in /api/waitlist) can read or write.

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

-- Enforce shape at the database level, mirroring the zod contract.
alter table public.waitlist
  add constraint waitlist_first_name_len check (char_length(first_name) between 1 and 60),
  add constraint waitlist_age_ranges_nonempty check (array_length(child_age_ranges, 1) >= 1),
  add constraint waitlist_postal_code_fmt check (postal_code is null or postal_code ~ '^\d{5}$'),
  add constraint waitlist_referral_source_vals check (
    referral_source is null
    or referral_source in ('instagram', 'friend', 'search', 'other')
  ),
  add constraint waitlist_consent_true check (consent_marketing = true);

alter table public.waitlist enable row level security;

-- No policies are defined on purpose. RLS with no policy denies all access to
-- anon and authenticated roles; the service role bypasses RLS entirely.

-- service_role bypasses RLS but still needs table-level privileges; grant the
-- DML the serverless endpoint uses (upsert = insert + update) plus select for
-- later server-side querying. anon and authenticated are granted nothing, so
-- they stay locked out even if RLS were ever relaxed (CLAUDE.md section 10).
revoke all on public.waitlist from anon, authenticated;
grant select, insert, update, delete on public.waitlist to service_role;
