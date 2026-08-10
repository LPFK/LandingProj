-- Double opt-in for the waitlist (security pass).
-- Signups start unconfirmed; a hashed, expiring confirmation token is emailed
-- and must be followed to set confirmed = true. Only the service role touches
-- this table (RLS enabled, no policies from the initial migration), so the
-- existing grants already cover these columns and no new grants are needed.

alter table public.waitlist
  add column if not exists confirmed boolean not null default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmation_token_hash text,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists token_expires_at timestamptz;

-- Confirmation look-ups are by the SHA-256 token hash.
create index if not exists waitlist_confirmation_token_hash_idx
  on public.waitlist (confirmation_token_hash);
