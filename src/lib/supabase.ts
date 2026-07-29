import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WaitlistInput } from "./validation";
import { CONSENT_VERSION } from "./validation";

const NETWORK_TIMEOUT_MS = 8000;

export type WaitlistResult =
  | { ok: true }
  | { ok: false; reason: "config" | "timeout" | "database" };

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

export async function insertWaitlist(input: WaitlistInput): Promise<WaitlistResult> {
  const db = getClient();
  if (!db) return { ok: false, reason: "config" };

  try {
    const { error } = await db.from("waitlist").upsert(
      {
        first_name: input.first_name,
        email: input.email,
        child_age_ranges: input.child_age_ranges,
        postal_code: input.postal_code || null,
        referral_source: input.referral_source || null,
        consent_marketing: input.consent_marketing,
        consent_version: CONSENT_VERSION,
      },
      { onConflict: "email" },
    );

    if (error) return { ok: false, reason: "database" };
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "database" };
  }
}
