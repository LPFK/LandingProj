import { useState } from "react";
import { waitlistSchema } from "../lib/validation";
import copy from "../content/copy.fr.json";

type Field = "first_name" | "email" | "child_age_ranges" | "postal_code" | "consent_marketing";
type Errors = Partial<Record<Field, string>>;

const AGE_OPTIONS = copy.waitlist.childAgeOptions;
const REFERRAL_OPTIONS = copy.waitlist.referralOptions;

export default function WaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [ages, setAges] = useState<string[]>([]);
  const [postalCode, setPostalCode] = useState("");
  const [referral, setReferral] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function toggleAge(value: string) {
    setAges((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      first_name: firstName,
      email,
      child_age_ranges: ages,
      postal_code: postalCode || undefined,
      referral_source: referral || undefined,
      consent_marketing: consent,
    };

    const parsed = waitlistSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        if (key) fieldErrors[key] = copy.waitlist.errors[key as keyof typeof copy.waitlist.errors] ?? issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-ink)", marginBottom: 12 }}>
          {copy.waitlist.successTitle}
        </h3>
        <p style={{ fontSize: "0.9375rem", color: "var(--color-ink-muted)", lineHeight: 1.65 }}>
          {copy.waitlist.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Row 1: name + email */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="form-row">
        <Field
          label={copy.waitlist.labels.firstName}
          error={errors.first_name}
          required
        >
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={copy.waitlist.placeholders.firstName}
            autoComplete="given-name"
            style={inputStyle(!!errors.first_name)}
          />
        </Field>

        <Field
          label={copy.waitlist.labels.email}
          error={errors.email}
          required
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.waitlist.placeholders.email}
            autoComplete="email"
            inputMode="email"
            style={inputStyle(!!errors.email)}
          />
        </Field>
      </div>

      {/* Age ranges */}
      <Field
        label={copy.waitlist.labels.childAgeRanges}
        error={errors.child_age_ranges}
        required
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AGE_OPTIONS.map((opt) => {
            const selected = ages.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleAge(opt.value)}
                aria-pressed={selected}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-pill)",
                  border: `1.5px solid ${selected ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: selected ? "var(--color-accent)" : "transparent",
                  color: selected ? "var(--color-ink-on-accent)" : "var(--color-ink-muted)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "var(--font-body)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Row 3: postal + referral */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="form-row">
        <Field label={copy.waitlist.labels.postalCode} error={errors.postal_code}>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder={copy.waitlist.placeholders.postalCode}
            inputMode="numeric"
            maxLength={5}
            style={inputStyle(!!errors.postal_code)}
          />
        </Field>

        <Field label={copy.waitlist.labels.referralSource}>
          <select
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            style={{ ...inputStyle(false), color: referral ? "var(--color-ink)" : "var(--color-ink-muted)" }}
          >
            <option value="">{copy.waitlist.referralPlaceholder}</option>
            {REFERRAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Consent */}
      <div>
        <label
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            cursor: "pointer",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ position: "absolute", opacity: 0, width: 20, height: 20, cursor: "pointer" }}
            />
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                border: `1.5px solid ${errors.consent_marketing ? "#C0392B" : consent ? "var(--color-accent)" : "var(--color-border)"}`,
                background: consent ? "var(--color-accent)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {consent && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--color-ink-on-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span style={{ fontSize: "0.875rem", color: "var(--color-ink-muted)", lineHeight: 1.55 }}>
            {copy.consent.v1}
          </span>
        </label>
        {errors.consent_marketing && (
          <p style={{ marginTop: 8, fontSize: "0.8125rem", color: "#C0392B" }}>
            {copy.waitlist.errors.consentMarketing}
          </p>
        )}
      </div>

      {status === "error" && (
        <p
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(192,57,43,0.08)",
            color: "#C0392B",
            fontSize: "0.875rem",
          }}
        >
          {copy.waitlist.genericError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        style={{
          padding: "16px 32px",
          borderRadius: "var(--radius-pill)",
          background: status === "submitting" ? "var(--color-ink-muted)" : "var(--color-accent)",
          color: "var(--color-ink-on-accent)",
          fontSize: "1rem",
          fontWeight: 500,
          border: "none",
          cursor: status === "submitting" ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          transition: "background 0.15s",
          alignSelf: "flex-start",
        }}
      >
        {status === "submitting" ? copy.waitlist.submitting : copy.waitlist.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink)" }}>
        {label}
        {required && <span style={{ color: "var(--color-accent)", marginLeft: 4 }} aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" style={{ fontSize: "0.8125rem", color: "#C0392B" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-input)",
    border: `1.5px solid ${hasError ? "#C0392B" : "var(--color-border)"}`,
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    fontSize: "0.9375rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.15s",
  };
}
