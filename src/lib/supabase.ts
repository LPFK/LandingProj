import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WaitlistInput } from "./validation";
import { CONSENT_VERSION } from "./validation";

const NETWORK_TIMEOUT_MS = 8000;

export type WaitlistResult =
  | { ok: true; alreadyConfirmed: boolean }
  | { ok: false; reason: "config" | "timeout" | "database" };

export type ConfirmResult =
  | { ok: true }
  | { ok: false; reason: "config" | "invalid" | "expired" | "database" };

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  const url = import.meta.env.SUPABASE_URL;
  const serviceRole = import.meta.env.SUPABASE_SERVICE_ROLE;
  if (!url || !serviceRole) return null;
  if (!client) {
    client = createClient(url, serviceRole, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) }),
      },
    });
  }
  return client;
}

// Storage supports two modes:
//   - "confirmed" (single opt-in, current default): the signup counts
//     immediately; `confirmed` is set true and any token fields are cleared.
//   - "pending" (double opt-in): the row is stored unconfirmed with a hashed,
//     expiring token. `confirmed` is intentionally omitted from the payload so a
//     new row defaults to false and an existing row keeps its state (a
//     re-submit cannot silently un-confirm someone).
// The prior `confirmed` value is returned so callers can decide whether to
// re-send an email.
export type InsertOptions =
  | { mode: "confirmed" }
  | { mode: "pending"; tokenHash: string; tokenExpiresAt: Date };

export async function insertWaitlist(
  input: WaitlistInput,
  options: InsertOptions,
): Promise<WaitlistResult> {
  const db = getClient();
  if (!db) return { ok: false, reason: "config" };

  const row: Record<string, unknown> = {
    first_name: input.first_name,
    email: input.email,
    child_age_ranges: input.child_age_ranges,
    postal_code: input.postal_code || null,
    referral_source: input.referral_source || null,
    consent_marketing: input.consent_marketing,
    consent_version: CONSENT_VERSION,
  };

  if (options.mode === "confirmed") {
    row.confirmed = true;
    row.confirmed_at = new Date().toISOString();
    row.confirmation_token_hash = null;
    row.token_expires_at = null;
  } else {
    row.confirmation_token_hash = options.tokenHash;
    row.confirmation_sent_at = new Date().toISOString();
    row.token_expires_at = options.tokenExpiresAt.toISOString();
  }

  try {
    const { data, error } = await db
      .from("waitlist")
      .upsert(row, { onConflict: "email" })
      .select("confirmed")
      .single();

    if (error) return { ok: false, reason: "database" };
    return { ok: true, alreadyConfirmed: data?.confirmed === true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "database" };
  }
}

// Mark the row that owns `tokenHash` as confirmed. Idempotent: an already
// confirmed row returns ok. An unknown hash is "invalid"; a known but stale one
// is "expired". The token hash is cleared on success so the link is single-use.
export async function confirmWaitlist(tokenHash: string): Promise<ConfirmResult> {
  const db = getClient();
  if (!db) return { ok: false, reason: "config" };

  try {
    const { data, error } = await db
      .from("waitlist")
      .select("id, confirmed, token_expires_at")
      .eq("confirmation_token_hash", tokenHash)
      .maybeSingle();

    if (error) return { ok: false, reason: "database" };
    if (!data) return { ok: false, reason: "invalid" };
    if (data.confirmed === true) return { ok: true };
    if (data.token_expires_at && new Date(data.token_expires_at).getTime() < Date.now()) {
      return { ok: false, reason: "expired" };
    }

    const { error: updateError } = await db
      .from("waitlist")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmation_token_hash: null,
      })
      .eq("id", data.id);

    if (updateError) return { ok: false, reason: "database" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "database" };
  }
}
