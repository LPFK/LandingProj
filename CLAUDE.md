# CLAUDE.md

## 1. Project overview

We are building a **lead-capture landing page** for a subscription service selling children's shoes in France. Model reference: trottino.fr (quality leather, French design, Portuguese make, foot-health positioning). Our angle adds a subscription layer: parents receive a curated number of pairs per year, sized correctly for a fast-growing foot, without repeat sourcing effort.

The service is **not live yet**. The landing page's single job is to build a qualified waitlist of parents who want early access when the subscription opens.

Primary success metric | qualified email signups
Secondary metric | time-on-page and scroll depth as proxies for message clarity
Non-goals | no checkout, no product catalog, no login, no dashboard

## 2. Positioning brief

Audience | French parents of children age 0 to 7, urban to peri-urban, digitally comfortable, sensitive to child foot health and to household logistics.

Core promise | the right shoes, the right size, delivered at the right cadence, without you thinking about it.

Emotional anchors | relief of decision fatigue, trust in expert curation, pride in product quality.

Rational anchors | podological respect, growth-adapted sizing, materials quality, French curation.

Avoid | infantilizing cutesy tone, discount-shopping language, corporate SaaS coldness, greenwashing without proof.

## 3. Tech stack

Default choice unless overridden in the initial prompt:

Framework | Astro 5 with a single interactive island for the form. Rationale: static-first, tiny bundle, ideal for a landing page, easy to swap to Next.js later if the product surface grows.
Styling | Tailwind CSS v4, custom design tokens defined in `tailwind.config.mjs`.
Fonts | self-hosted via `fontsource` to avoid Google Fonts calls.
Animations | `motion` (Framer Motion successor) inside the interactive island only. Use sparingly.
Icons | `lucide-astro`.
Form handling | client-side validation with `zod`, POST to the `/api/waitlist` endpoint. The endpoint enforces per-IP rate limiting, a Cloudflare Turnstile bot check, and server-side `zod` re-validation before storing.
Waitlist storage | **Supabase** table `waitlist` with row-level security. Rationale: SQL-shaped storage that we can query with Python later, free tier fits early volume, less lock-in than Mailchimp.
Confirmation email | Resend. **Single opt-in is active** (`DOUBLE_OPTIN = false` in `src/pages/api/waitlist.ts`): the signup is stored as confirmed and gets a welcome email with no link. Double opt-in (hashed 72h token → `/confirmer` link → confirmed) is implemented and kept behind that flag for easy re-enable.
Analytics | Plausible, self-hosted or cloud, cookieless.
Hosting | O2switch (cPanel shared hosting, Node app served via Phusion Passenger, `@astrojs/node` standalone adapter).

Alternate stacks the operator may request | plain HTML/CSS/JS + Vite, or Next.js 15 App Router. If asked, migrate the whole file structure and update this section.

Alternate waitlist storage | Airtable, Mailchimp, or a custom FastAPI endpoint if we already have infrastructure. Do not silently swap. Ask.

## 4. Design system

The tone is **modern, warm, editorial**. Not corporate, not childish.

Palette (edit here if changed):

Role | Token | Value
Base background | `--color-bg` | `#FBF7F2` (warm off-white)
Surface | `--color-surface` | `#FFFFFF`
Ink primary | `--color-ink` | `#1E1A17` (near-black warm)
Ink muted | `--color-ink-muted` | `#6B615A`
Accent primary | `--color-accent` | `#C46A3A` (warm terracotta)
Accent secondary | `--color-accent-soft` | `#E8C9B0`
Success | `--color-success` | `#3F7A5E`
Border | `--color-border` | `#E6DED3`

Typography:

Role | Family | Notes
Display | Fraunces (variable) | soft-serif, used for hero and section titles
Body | Inter (variable) | 16 px base, 1.6 line-height

Layout | 12-column responsive grid, max content width 1200 px, section vertical rhythm 96 px desktop and 64 px mobile.

Radius | 12 px on cards, 999 px on pills, 8 px on inputs.

Shadow | one soft elevation `0 10px 30px rgba(30, 26, 23, 0.08)`. Do not stack shadows.

Motion | fade-in-up 400 ms with 40 ms stagger on section entry. Respect `prefers-reduced-motion`.

Imagery | editorial product photography on neutral backgrounds. Placeholder if unavailable: soft geometric SVGs in the accent-soft tone. Never use stock photos of laughing families.

## 5. Page structure

Single long page, one route.

Section | Purpose
Hero | one-line promise, sub-hero clarifier, primary CTA to the form, quiet product visual
How it works | three steps, illustrated. Sign up | Receive curated pairs | Grow together
Why it exists | short editorial block on foot health and parent load
Product quality | materials, French curation, ethical manufacture. Evidence-based, no vague claims
Founder note | one paragraph, first person, signed
Waitlist form | headline, name, email, child age range multi-select, optional postal code, consent checkbox, submit
FAQ | five questions, accordion
Footer | mentions légales links, contact email, social if any

The form must appear twice: an anchor button in the hero jumps to the form, and the form section itself sits above the FAQ.

## 6. Content and language

**Site copy is in French.** All visible strings, meta tags, and confirmation email content are French. Placeholder copy goes in `src/content/copy.fr.json` so it can be reviewed as data.

Voice guide:

Do | short sentences, present tense, concrete nouns, honest tone
Don't | slogans in English, exclamation marks stacked, emoji, corporate jargon, urgency scarcity manipulation

Legal | RGPD-compliant. Consent checkbox with explicit language. Link to a `politique-de-confidentialite` page (stub is acceptable at first pass, flag as `TODO_LEGAL`).

## 7. Waitlist form contract

Fields:

Field | Type | Required | Validation
`first_name` | string | yes | 1 to 60 chars
`email` | string | yes | RFC email
`child_age_ranges` | string array | yes | subset of `["0-12m","12-24m","2-3y","3-5y","5-7y"]`, at least one
`postal_code` | string | no | 5 digit French postal
`referral_source` | enum | no | `["instagram","friend","search","other"]`
`consent_marketing` | boolean | yes | must be true

Behavior:

On submit, validate client-side. On success, POST JSON to `/api/waitlist`. The endpoint upserts on `email`, inserts to Supabase, then triggers Resend to send a French confirmation. On failure, show a friendly inline error. Never console-log the payload in production.

Do not implement double opt-in in v1 unless requested. Log a `TODO_DOUBLE_OPTIN` comment where it would slot in.

## 8. File structure

```
.
|-- CLAUDE.md
|-- BRIEF.md              # short human brief, edit freely
|-- README.md
|-- astro.config.mjs
|-- tailwind.config.mjs
|-- package.json
|-- .env.example          # SUPABASE_URL, SUPABASE_SERVICE_ROLE, RESEND_API_KEY
|-- src
|   |-- pages
|   |   |-- index.astro
|   |   |-- api
|   |   |   `-- waitlist.ts
|   |   |-- politique-de-confidentialite.astro
|   |   `-- mentions-legales.astro
|   |-- components
|   |   |-- Hero.astro
|   |   |-- HowItWorks.astro
|   |   |-- WhyItExists.astro
|   |   |-- Quality.astro
|   |   |-- FounderNote.astro
|   |   |-- WaitlistForm.tsx      # island
|   |   |-- FAQ.astro
|   |   `-- Footer.astro
|   |-- content
|   |   `-- copy.fr.json
|   |-- lib
|   |   |-- supabase.ts
|   |   |-- resend.ts
|   |   `-- validation.ts
|   `-- styles
|       `-- globals.css
`-- public
    |-- fonts/
    `-- images/
```

## 9. Workflow modes

The operator will start each session by declaring a mode. Default to **REVIEW** if unclear and ask. Never invent scope.

### MAKE

Purpose | build a new section, component, endpoint, or page from scratch.

Rules:
1. Read `BRIEF.md` and this file first.
2. State the plan in three to seven bullets before writing code. Wait for a go signal on non-trivial work.
3. Prefer creating new files over editing many at once. One component per file.
4. Write copy in French, placeholders in `copy.fr.json`.
5. Do not install new dependencies without listing them and their weight.
6. End with a self-check against the definition of done in section 11.

### DEBUG

Purpose | investigate a reported issue, no fixes yet.

Rules:
1. Restate the symptom in one sentence.
2. Form a short hypothesis list, rank by likelihood.
3. Add targeted `console.debug` or Astro dev logs only. Do not restructure code.
4. Reproduce in the smallest possible slice.
5. Deliverable is a written diagnosis with file paths and line references. **No code changes.** Await a FIX instruction.

### FIX

Purpose | apply a targeted fix to a known issue.

Rules:
1. Cite the diagnosis or the exact symptom being addressed.
2. Change the minimum surface. No opportunistic refactors.
3. Remove any debug logs left over from DEBUG.
4. Add a one-line comment above the fix explaining why, not what.
5. If the fix touches the form contract in section 7, update that section in this file in the same commit.

### REVIEW

Purpose | audit existing code against this file and against quality standards.

Rules:
1. Cover accessibility (WCAG 2.2 AA, keyboard, focus, alt text, aria), performance (Lighthouse targets in section 11), SEO (meta, OG, hreflang if extended, structured data), RGPD, and copy tone.
2. Output a structured report grouped by severity: blocking | should-fix | nice-to-have.
3. Reference files with paths and line numbers.
4. Do not fix during REVIEW. Fixes are a separate FIX pass.

## 10. Rules and constraints

Style rules for all generated content:
- No emojis anywhere in code, comments, commits, or copy.
- No em-dashes. Use a pipe with spaces around it, a period, or a comma.
- Sentence case for headings and buttons. Not Title Case.
- French for user-facing text. English acceptable for code identifiers and internal docs.
- Factual, calm tone. No hype, no exclamation stacks, no scarcity tricks.

Engineering rules:
- TypeScript strict mode on.
- ESLint and Prettier configured, run on save.
- No inline styles except when strictly dynamic. Use Tailwind or CSS variables.
- No secrets committed. `.env.example` documents keys, `.env` is gitignored.
- Every network call has a timeout and a typed error path.
- Do not add tracking scripts beyond Plausible without an explicit go.

Data and privacy:
- Waitlist data lives in Supabase in EU region.
- Row-level security enforced. Only the service role in the serverless function can insert.
- No PII in analytics, no PII in logs.
- The RGPD consent copy is reviewed and versioned in `copy.fr.json` under `consent.v1`, `consent.v2` if changed. Store the accepted version alongside the row.

## 11. Definition of done

Before declaring any task complete:

- Renders correctly on 360 px, 768 px, 1024 px, 1440 px.
- Lighthouse mobile: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+.
- No console errors or warnings on load or on form submission.
- Form happy path and error paths both tested manually. Zod schema matches section 7 exactly.
- Copy proofread in French, no leftover Lorem, no stray English strings.
- `prefers-reduced-motion` respected.
- `.env.example` up to date with any new key introduced.
- Section of this file updated if the contract changed.

## 12. Open decisions

Track these here. When a decision is made, replace the row with the resolution and date.

Topic | Status
Final brand name and logo | open
Domain and hosting account | open
Confirmation email sender identity | open
Whether to add a referral capture beyond `referral_source` | open
Whether to add an SMS field for launch notification | open
