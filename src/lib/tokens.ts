// Confirmation-token helpers for the double opt-in flow. The raw token travels
// in the email link; only its SHA-256 hash is stored, so a database read alone
// never yields a usable confirmation link.
import { randomBytes, createHash } from "node:crypto";

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
