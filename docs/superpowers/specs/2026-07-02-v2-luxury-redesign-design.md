# v2 luxury redesign | design spec

Date: 2026-07-02
Branch: `v2-visual`
Status: approved (design), pending implementation plan

## 1. Goal

Restyle the Pazapas lead-capture landing page from its warm-editorial v1 into an
elegant, luxury e-commerce presentation. Keep the same storytelling arc, the same
backend, and the same waitlist form contract. Emphasize sophistication,
exclusivity, and children's foot health. Reframe the waitlist as an exclusive
founding-members circle.

Non-goals are unchanged from CLAUDE.md: no checkout, no catalog, no login, no
dashboard. This remains a single static page whose job is qualified signups.

## 2. Approach

Restyle the existing Astro components in place on `v2-visual`. The v1 look is
already snapshotted on the `v1-visual` branch, so there is no need to fork
parallel components. This keeps the file structure documented in CLAUDE.md intact
and produces a clean, reviewable diff.

No new interactive islands. The only client-side JS remains the existing
`WaitlistForm.tsx` island. Liquid glass and motion are pure CSS.

## 3. Visual direction | warm luxury

Alternating vertical rhythm of full-bleed espresso sections and cream sections so
that frosted glass has depth to sit on. Terracotta is elevated to a bronze-gold
gradient used for accents, hairline rules, numerals, and the primary CTA.

### Design tokens (edit in `src/styles/globals.css` @theme)

| Role | Token | Value |
| --- | --- | --- |
| Base background (cream) | `--color-bg` | `#FBF7F2` |
| Deep surface (espresso) | `--color-espresso` | `#1E1A17` |
| Espresso raised | `--color-espresso-soft` | `#2A2521` |
| Surface | `--color-surface` | `#FFFFFF` |
| Ink primary | `--color-ink` | `#1E1A17` |
| Ink on dark | `--color-ink-invert` | `#F4EDE4` |
| Ink muted | `--color-ink-muted` | `#6B615A` |
| Ink muted on dark | `--color-ink-muted-invert` | `#B7A99B` |
| Accent (bronze-terracotta) | `--color-accent` | `#C46A3A` |
| Accent bright (gold) | `--color-accent-gold` | `#D89A5E` |
| Accent gradient | `--gradient-accent` | `linear-gradient(135deg, #C46A3A, #D89A5E)` |
| Success | `--color-success` | `#3F7A5E` |
| Border hairline | `--color-border` | `#E6DED3` |
| Gold hairline | `--color-hairline-gold` | `rgba(216, 154, 94, 0.35)` |
| Glass fill (on dark) | `--glass-dark` | `rgba(255, 255, 255, 0.06)` |
| Glass fill (on light) | `--glass-light` | `rgba(255, 255, 255, 0.55)` |
| Glass blur | `--glass-blur` | `blur(20px) saturate(140%)` |
| Glass shadow | `--shadow-glass` | `0 20px 50px rgba(30, 26, 23, 0.28)` |
| Soft shadow (kept) | `--shadow-soft` | `0 10px 30px rgba(30, 26, 23, 0.08)` |

Typography unchanged in family: Fraunces (display) and Inter (body), self-hosted
via fontsource. Fraunces is used at lighter optical weights and larger sizes with
tighter tracking for couture headlines.

### Liquid glass technique

A reusable `.glass` treatment: semi-transparent fill, `backdrop-filter` blur and
saturate, a 1px inner light highlight, a soft outer shadow (`--shadow-glass`), and
a faint top specular sheen via a CSS gradient. On dark sections it uses
`--glass-dark`; on light sections `--glass-light`.

Accessibility and fallback:
- Body text sits on sufficiently opaque backing, never directly on live blur, so
  contrast stays WCAG 2.2 AA.
- `@supports not (backdrop-filter: blur(1px))` falls back to a solid warm-tinted
  panel.
- The specular sheen animation is disabled under `prefers-reduced-motion`.

This relaxes the CLAUDE.md "do not stack shadows" rule for the glass elevation
only. Recorded in section 6 below and to be reflected in CLAUDE.md section 4.

## 4. Section plan (same storytelling arc)

Order is unchanged. New product showcase inserted after Why it exists.

| Section | Background | Treatment |
| --- | --- | --- |
| Hero | espresso | Bronze radial glow, glass CTA card, framed product tile, exclusivity headline, anchor CTA to membership |
| How it works | cream | Three glass step-cards, gold numerals, sign up / receive / grow |
| Why it exists | espresso | Editorial block, foot health + parent load, calm premium tone |
| Product showcase (NEW) | cream | Editorial gallery: asymmetric grid of glass product cards, materials callouts, elegant placeholders now, real images later |
| Quality | espresso | Materials / French curation / ethical make as glass spec-cards |
| Founder note | cream | Intimate serif, portrait placeholder, signed |
| Membership (was Waitlist) | espresso | Reframed as "cercle fondateur", exclusive language, glass form panel, unchanged fields |
| FAQ | cream | Glass accordion |
| Footer | espresso | Refined, gold hairline, mentions legales + contact |

Product showcase images are placeholders (soft geometric SVG in accent tones on
neutral grounds) until real editorial photography is supplied. They drop into
`public/images/` and are swapped by filename with no layout change.

## 5. Copy | pushed harder on exclusivity

All visible copy stays in `src/content/copy.fr.json`, French, following the voice
rules in CLAUDE.md section 6 (short sentences, present tense, no hype stacks, no
emoji, no em-dash, sentence case).

Register shifts firmly toward exclusivity and membership:
- Reframe the waitlist as **le cercle fondateur** (founding members' circle).
- Language of selection, curation, access, and belonging: "acces anticipe",
  "places limitees" (only if truthful, no fake scarcity), "curation", "membres
  fondateurs", "sur invitation".
- Add a `showcase` block (title, intro, per-product material callouts).
- Add `membership` framing keys used by the form section headline and CTA.
- Keep it calm and confident, not loud. Exclusivity is conveyed through restraint
  and specificity, not exclamation. No scarcity manipulation: any numeric claim
  must be real or omitted.
- RGPD consent copy is unchanged and stays versioned under `consent.v1`.

## 6. Unchanged guarantees

- Waitlist form contract (CLAUDE.md section 7) is untouched: same fields, same zod
  schema, same `/api/waitlist` endpoint, same Supabase upsert on email, same
  Resend confirmation, same stored `consent.v1`.
- Backend, environment keys, and data/privacy rules unchanged.
- Static-first: page stays prerendered, only `/api/waitlist` is SSR. No new
  dependencies. No new tracking scripts.
- Accessibility WCAG 2.2 AA: keyboard, visible focus, alt text on every product
  placeholder, contrast verified on glass.
- `prefers-reduced-motion` respected across new motion.
- Renders at 360 / 768 / 1024 / 1440. Lighthouse targets from section 11 held.

## 7. CLAUDE.md updates (same change set)

- Section 4: replace palette and add glass tokens, note the single glass shadow
  exception.
- Section 5: add the product showcase section to the page structure table.
- Section 6: nuance the voice toward exclusivity/membership while preserving all
  hard voice rules.
- Section 12: resolve "Final brand name and logo" to Pazapas, dated 2026-07-02.

Contract sections 7 and 10 remain authoritative and unchanged.

## 8. Risks and mitigations

- Glass legibility: mitigated by opaque text backing and contrast checks.
- Dark sections and images: ensure product placeholders read on both espresso and
  cream grounds.
- Performance from backdrop-filter: limit the number of simultaneously blurred
  layers; prefer static glass panels over animated blur.
