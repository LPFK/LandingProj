import { z } from "zod";

export const CONSENT_VERSION = "v1";

const AGE_RANGES = ["0-12m", "12-24m", "2-3y", "3-5y", "5-7y"] as const;
const REFERRAL_SOURCES = ["instagram", "friend", "search", "other"] as const;

export const waitlistSchema = z.object({
  first_name: z.string().min(1).max(60),
  email: z.string().email(),
  child_age_ranges: z
    .array(z.enum(AGE_RANGES))
    .min(1, "At least one age range required"),
  postal_code: z
    .string()
    .regex(/^\d{5}$/)
    .optional()
    .or(z.literal("")),
  referral_source: z.enum(REFERRAL_SOURCES).optional(),
  consent_marketing: z.literal(true),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
