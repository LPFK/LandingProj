import { useState, type FormEvent } from "react";
import { waitlistSchema, type ChildAgeRange } from "../lib/validation";
import copy from "../content/copy.fr.json";

const t = copy.waitlist;

type FieldErrors = Partial<Record<string, string>>;

// Maps a zod issue path to the French message reviewed in copy.fr.json.
function messageFor(field: string): string {
  const map = t.errors as Record<string, string>;
  return map[field] ?? t.genericError;
}

export default function WaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [ages, setAges] = useState<Set<ChildAgeRange>>(new Set());
  const [postalCode, setPostalCode] = useState("");
  const [referral, setReferral] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function toggleAge(value: ChildAgeRange) {
    setAges((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const candidate = {
      first_name: firstName.trim(),
      email: email.trim(),
      child_age_ranges: Array.from(ages),
      postal_code: postalCode.trim(),
      referral_source: referral,
      consent_marketing: consent,
    };

    const parsed = waitlistSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = messageFor(key);
      }
      setErrors(next);
      setStatus("idle");
      return;
    }

    setErrors({});

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("request_failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    // CSS fade-in-up (globals.css) keeps the island light; it is disabled under
    // prefers-reduced-motion by the same stylesheet.
    return (
      <div role="status" className="fade-in-up rounded-card border border-border bg-surface p-8 text-center">
        <h3 className="text-2xl text-ink">{t.successTitle}</h3>
        <p className="mt-3 text-ink-muted">{t.successBody}</p>
      </div>
    );
  }

  const invalid = (field: string) => (errors[field] ? true : undefined);
  const describedBy = (field: string) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form noValidate onSubmit={handleSubmit} className="rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="grid gap-5">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-ink">
            {t.labels.firstName}
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t.placeholders.firstName}
            aria-invalid={invalid("first_name")}
            aria-describedby={describedBy("first_name")}
            className="mt-1 w-full rounded-input border border-border bg-bg px-3 py-2 text-ink"
          />
          {errors.first_name && (
            <p id="first_name-error" className="mt-1 text-sm text-accent">
              {errors.first_name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            {t.labels.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholders.email}
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
            className="mt-1 w-full rounded-input border border-border bg-bg px-3 py-2 text-ink"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-accent">
              {errors.email}
            </p>
          )}
        </div>

        <fieldset aria-invalid={invalid("child_age_ranges")} aria-describedby={describedBy("child_age_ranges")}>
          <legend className="text-sm font-medium text-ink">{t.labels.childAgeRanges}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.childAgeOptions.map((opt) => {
              const checked = ages.has(opt.value as ChildAgeRange);
              return (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-pill border px-4 py-2 text-sm transition-colors ${
                    checked
                      ? "border-accent bg-accent text-surface"
                      : "border-border bg-bg text-ink-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="child_age_ranges"
                    value={opt.value}
                    checked={checked}
                    onChange={() => toggleAge(opt.value as ChildAgeRange)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
          {errors.child_age_ranges && (
            <p id="child_age_ranges-error" className="mt-1 text-sm text-accent">
              {errors.child_age_ranges}
            </p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-ink">
              {t.labels.postalCode}
            </label>
            <input
              id="postal_code"
              name="postal_code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={t.placeholders.postalCode}
              aria-invalid={invalid("postal_code")}
              aria-describedby={describedBy("postal_code")}
              className="mt-1 w-full rounded-input border border-border bg-bg px-3 py-2 text-ink"
            />
            {errors.postal_code && (
              <p id="postal_code-error" className="mt-1 text-sm text-accent">
                {errors.postal_code}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="referral_source" className="block text-sm font-medium text-ink">
              {t.labels.referralSource}
            </label>
            <select
              id="referral_source"
              name="referral_source"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              className="mt-1 w-full rounded-input border border-border bg-bg px-3 py-2 text-ink"
            >
              <option value="">{t.referralPlaceholder}</option>
              {t.referralOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="consent_marketing"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={invalid("consent_marketing")}
              aria-describedby={describedBy("consent_marketing")}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span>{copy.consent.v1}</span>
          </label>
          {errors.consent_marketing && (
            <p id="consent_marketing-error" className="mt-1 text-sm text-accent">
              {errors.consent_marketing}
            </p>
          )}
        </div>

        {status === "error" && (
          <p role="alert" className="text-sm text-accent">
            {t.genericError}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-pill bg-accent px-6 py-3 text-base font-medium text-surface shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "submitting" ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  );
}
