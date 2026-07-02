import { z } from "zod";

/*
 * Single source of truth for the waitlist form contract (CLAUDE.md section 7).
 * Imported by both the client island (WaitlistForm.tsx) and the server endpoint
 * (api/waitlist.ts) so client and server validation cannot drift apart.
 */

export const CHILD_AGE_RANGES = [
  "0-12m",
  "12-24m",
  "2-3y",
  "3-5y",
  "5-7y",
] as const;

export const REFERRAL_SOURCES = [
  "instagram",
  "friend",
  "search",
  "other",
] as const;

// Current RGPD consent copy version stored alongside each row (section 10).
export const CONSENT_VERSION = "v1";

const emailSchema = z.string().trim().min(1).email().max(320);

export const waitlistSchema = z.object({
  first_name: z.string().trim().min(1).max(60),
  email: emailSchema,
  child_age_ranges: z
    .array(z.enum(CHILD_AGE_RANGES))
    .min(1)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "duplicate age range",
    }),
  postal_code: z
    .string()
    .trim()
    .regex(/^\d{5}$/)
    .optional()
    .or(z.literal("")),
  referral_source: z.enum(REFERRAL_SOURCES).optional().or(z.literal("")),
  consent_marketing: z.literal(true),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type ChildAgeRange = (typeof CHILD_AGE_RANGES)[number];
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];
