import { useEffect, useRef, useState } from "react";
import { waitlistSchema } from "../lib/validation";
import copy from "../content/copy.fr.json";

type Field = "first_name" | "email" | "child_age_ranges" | "postal_code" | "consent_marketing";
type Errors = Partial<Record<Field, string>>;

const AGE_OPTIONS = copy.waitlist.childAgeOptions;
const REFERRAL_OPTIONS = copy.waitlist.referralOptions;

// Public site key is inlined at build time. When it is absent (local dev with
// no Turnstile configured) the widget is not rendered and the server skips the
// bot check, so the form still works end to end.
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;

interface TurnstileApi {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: string }) => string;
  getResponse: (id?: string) => string | undefined;
  reset: (id?: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function WaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [ages, setAges] = useState<string[]>([]);
  const [postalCode, setPostalCode] = useState("");
  const [referral, setReferral] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  // Bumped on each error so the alert banner remounts and replays its shake.
  const [errorNonce, setErrorNonce] = useState(0);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Explicitly render the Turnstile widget once its script has loaded. Explicit
  // render is more reliable than implicit auto-render for an element mounted by
  // React after the script tag.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const timer = setInterval(() => {
      if (window.turnstile && turnstileRef.current && turnstileWidgetId.current === null) {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
        });
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  function toggleAge(value: string) {
    const next = ages.includes(value) ? ages.filter((a) => a !== value) : [...ages, value];
    setAges(next);
    // Age is chosen by tapping, so re-check the moment a selection exists.
    if (errors.child_age_ranges) revalidate("child_age_ranges", { child_age_ranges: next });
  }

  function currentPayload() {
    return {
      first_name: firstName,
      email,
      child_age_ranges: ages,
      postal_code: postalCode || undefined,
      referral_source: referral || undefined,
      consent_marketing: consent,
    };
  }

  // Validate a single field (on blur, or live once it already shows an error).
  // Overrides let callers pass the just-changed value before state commits.
  function revalidate(field: Field, overrides: Record<string, unknown> = {}) {
    const parsed = waitlistSchema.safeParse({ ...currentPayload(), ...overrides });
    setErrors((prev) => {
      const nextErrors = { ...prev };
      const issue = parsed.success
        ? undefined
        : parsed.error.issues.find((i) => i.path[0] === field);
      if (issue) {
        nextErrors[field] =
          copy.waitlist.errors[field as keyof typeof copy.waitlist.errors] ?? issue.message;
      } else {
        delete nextErrors[field];
      }
      return nextErrors;
    });
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

    // Require a completed bot check when Turnstile is active.
    let turnstileToken: string | undefined;
    if (TURNSTILE_SITE_KEY) {
      turnstileToken = window.turnstile?.getResponse(turnstileWidgetId.current ?? undefined);
      if (!turnstileToken) {
        setStatus("error");
        setErrorNonce((n) => n + 1);
        return;
      }
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed.data, turnstileToken }),
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorNonce((n) => n + 1);
        // Let the visitor retry the challenge on failure.
        if (TURNSTILE_SITE_KEY) window.turnstile?.reset(turnstileWidgetId.current ?? undefined);
      }
    } catch {
      setStatus("error");
      setErrorNonce((n) => n + 1);
      if (TURNSTILE_SITE_KEY) window.turnstile?.reset(turnstileWidgetId.current ?? undefined);
    }
  }

  if (status === "success") {
    return (
      <div className="success-panel" style={{ textAlign: "center", padding: "48px 0" }}>
        <div
          className="success-badge"
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
            <path className="success-check" d="M5 12l5 5L20 7" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.first_name) revalidate("first_name", { first_name: e.target.value });
            }}
            onBlur={() => revalidate("first_name")}
            placeholder={copy.waitlist.placeholders.firstName}
            autoComplete="given-name"
            className={`form-input${errors.first_name ? " has-error" : ""}`}
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) revalidate("email", { email: e.target.value });
            }}
            onBlur={() => revalidate("email")}
            placeholder={copy.waitlist.placeholders.email}
            autoComplete="email"
            inputMode="email"
            className={`form-input${errors.email ? " has-error" : ""}`}
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
                className="age-chip"
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
            onChange={(e) => {
              setPostalCode(e.target.value);
              if (errors.postal_code) revalidate("postal_code", { postal_code: e.target.value || undefined });
            }}
            onBlur={() => revalidate("postal_code")}
            placeholder={copy.waitlist.placeholders.postalCode}
            inputMode="numeric"
            maxLength={5}
            className={`form-input${errors.postal_code ? " has-error" : ""}`}
          />
        </Field>

        <Field label={copy.waitlist.labels.referralSource}>
          <select
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            className="form-input"
            style={{ color: referral ? "var(--color-ink)" : "var(--color-ink-muted)" }}
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
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errors.consent_marketing) revalidate("consent_marketing", { consent_marketing: e.target.checked });
              }}
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

      {/* Cloudflare Turnstile widget (rendered only when configured) */}
      {TURNSTILE_SITE_KEY && <div ref={turnstileRef} />}

      {status === "error" && (
        <p
          key={errorNonce}
          role="alert"
          className="shake"
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
        className={status === "submitting" ? undefined : "btn-primary"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "16px 32px",
          borderRadius: "var(--radius-pill)",
          background: status === "submitting" ? "var(--color-ink-muted)" : "var(--color-accent)",
          color: "var(--color-ink-on-accent)",
          fontSize: "1rem",
          fontWeight: 500,
          border: "none",
          cursor: status === "submitting" ? "not-allowed" : "pointer",
          fontFamily: "var(--font-body)",
          alignSelf: "flex-start",
        }}
      >
        {status === "submitting" && <span className="spinner" aria-hidden="true" />}
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
