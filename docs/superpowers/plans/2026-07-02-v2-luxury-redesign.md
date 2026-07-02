# v2 luxury redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Pazapas landing page into a warm-luxury, liquid-glass presentation with an editorial product showcase and a founding-members membership reframe, without touching the backend or the form contract.

**Architecture:** Restyle existing Astro components in place on `v2-visual` (v1 is snapshotted on `v1-visual`). Shared design tokens and a reusable `.glass` treatment live in `src/styles/globals.css`. Copy stays data-driven in `copy.fr.json`. One new static component (`ProductShowcase.astro`) is added. No new interactive islands: the only client JS remains `WaitlistForm.tsx`.

**Tech Stack:** Astro 5 (prerendered), Tailwind CSS v4 (CSS-first `@theme`), Fraunces + Inter via fontsource, TypeScript strict.

## Global Constraints

- French for all user-facing copy. English only for code identifiers and internal docs.
- No emojis. No em-dashes (use ` | `, a period, or a comma). Sentence case for headings and buttons.
- Calm, factual tone. No hype, no exclamation stacks, no scarcity manipulation. Any numeric claim must be truthful or omitted.
- All visible strings live in `src/content/copy.fr.json`. RGPD consent copy stays versioned under `consent.v1`, unchanged.
- The waitlist form contract (CLAUDE.md section 7) is untouched: fields, zod schema, `/api/waitlist`, Supabase upsert on email, Resend confirmation, stored `consent.v1`.
- No new dependencies. No new tracking scripts beyond existing Plausible.
- TypeScript strict mode. No inline styles except strictly dynamic values.
- Must render at 360 / 768 / 1024 / 1440 px. Respect `prefers-reduced-motion`.
- Lighthouse mobile targets held: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+.

## Verification model (read once)

There is no unit-test surface for a CSS/markup restyle. Every task verifies via:
1. `npm run build` completes with no errors or type errors.
2. `npm run dev`, then visually confirm the section at 360 / 768 / 1024 / 1440 px.
3. Keyboard tab through any interactive elements; visible focus present.
4. Text contrast on glass reads AA (body text sits on opaque backing, not live blur).

Commit after each task. Do not run `git push`; the operator controls pushes.

## File map

- Modify `src/styles/globals.css` | tokens + `.glass`, `.section-dark`, `.section-light`, sheen, grain.
- Modify `src/content/copy.fr.json` | exclusivity register, new `showcase` and `membership` blocks, updated `meta`/`hero`/`waitlist` keys.
- Modify `src/components/Hero.astro` | espresso hero, glass CTA card, framed tile.
- Modify `src/components/HowItWorks.astro` | cream, glass step-cards, gold numerals.
- Modify `src/components/WhyItExists.astro` | espresso editorial block.
- Create `src/components/ProductShowcase.astro` | editorial gallery of glass product cards.
- Create `public/images/showcase-1.svg`, `showcase-2.svg`, `showcase-3.svg` | elegant placeholders.
- Modify `src/pages/index.astro` | insert `<ProductShowcase />`, restyle membership section.
- Modify `src/components/Quality.astro` | espresso, glass spec-cards.
- Modify `src/components/FounderNote.astro` | cream, portrait placeholder, signature.
- Modify `src/components/WaitlistForm.tsx` | glass panel styling only (no logic/contract change).
- Modify `src/components/FAQ.astro` | cream, glass accordion.
- Modify `src/components/Footer.astro` | espresso, gold hairline.
- Modify `CLAUDE.md` | sections 4, 5, 6, 12.

---

### Task 1: Design tokens and glass utilities

**Files:**
- Modify: `src/styles/globals.css`

**Interfaces:**
- Produces (Tailwind v4 utilities auto-derived from `@theme`): `bg-bg`, `bg-espresso`, `bg-espresso-soft`, `text-ink`, `text-ink-invert`, `text-ink-muted`, `text-ink-muted-invert`, `text-accent`, `bg-accent`, `text-accent-gold`, `border-border`, `shadow-soft`, `shadow-glass`, `rounded-card`, `rounded-pill`.
- Produces CSS component classes: `.glass`, `.glass-dark`, `.glass-light`, `.section-dark`, `.section-light`, `.grain`, `.sheen`.

- [ ] **Step 1: Add the new tokens to the `@theme` block**

In `src/styles/globals.css`, replace the color/shadow portion of `@theme` so it reads:

```css
@theme {
  --color-bg: #fbf7f2;
  --color-surface: #ffffff;
  --color-espresso: #1e1a17;
  --color-espresso-soft: #2a2521;
  --color-ink: #1e1a17;
  --color-ink-invert: #f4ede4;
  --color-ink-muted: #6b615a;
  --color-ink-muted-invert: #b7a99b;
  --color-accent: #c46a3a;
  --color-accent-gold: #d89a5e;
  --color-success: #3f7a5e;
  --color-border: #e6ded3;

  --font-display: "Fraunces Variable", ui-serif, Georgia, serif;
  --font-body: "Inter Variable", ui-sans-serif, system-ui, sans-serif;

  --radius-input: 8px;
  --radius-card: 16px;
  --radius-pill: 999px;

  --shadow-soft: 0 10px 30px rgba(30, 26, 23, 0.08);
  --shadow-glass: 0 20px 50px rgba(30, 26, 23, 0.28);

  --spacing-section: 96px;
  --spacing-section-mobile: 64px;

  --breakpoint-*: initial;
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 90rem;
}
```

Note: card radius rises from 12px to 16px for the softer luxury feel.

- [ ] **Step 2: Add non-theme custom properties and the glass/section utilities**

Append to the `@layer components` block in `src/styles/globals.css`:

```css
@layer components {
  :root {
    --gradient-accent: linear-gradient(135deg, #c46a3a, #d89a5e);
    --hairline-gold: rgba(216, 154, 94, 0.35);
    --glass-dark-fill: rgba(255, 255, 255, 0.06);
    --glass-light-fill: rgba(255, 255, 255, 0.55);
    --glass-blur: blur(20px) saturate(140%);
  }

  .section-dark {
    background-color: var(--color-espresso);
    color: var(--color-ink-invert);
  }

  .section-light {
    background-color: var(--color-bg);
    color: var(--color-ink);
  }

  /* Frosted glass panel. Text must sit on the fill, never on live blur alone. */
  .glass {
    border-radius: var(--radius-card);
    border: 1px solid var(--hairline-gold);
    box-shadow: var(--shadow-glass);
    position: relative;
    isolation: isolate;
  }

  .glass-dark {
    background-color: var(--glass-dark-fill);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
  }

  .glass-light {
    background-color: var(--glass-light-fill);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
  }

  /* Top specular sheen. */
  .glass::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0) 40%
    );
    pointer-events: none;
    z-index: -1;
  }

  /* Fallback when backdrop-filter is unsupported: solid warm panels. */
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass-dark {
      background-color: var(--color-espresso-soft);
    }
    .glass-light {
      background-color: var(--color-surface);
    }
  }

  /* Subtle grain for tactility, applied to dark sections. */
  .grain::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
}
```

- [ ] **Step 3: Guard the sheen under reduced motion**

The existing `@media (prefers-reduced-motion: reduce)` block already neutralizes animations. The sheen is static (no animation), so no change is required. Confirm the block is still present after your edits.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build completes, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css
git commit -m "Add warm-luxury tokens and liquid glass utilities"
```

---

### Task 2: Copy | exclusivity register and new blocks

**Files:**
- Modify: `src/content/copy.fr.json`

**Interfaces:**
- Produces new keys consumed by later tasks: `showcase.title`, `showcase.intro`, `showcase.products[]` (each `{ name, material, note, alt, image }`), `membership.eyebrow`, `membership.title`, `membership.subtitle`, `membership.benefits[]`, `membership.cta`. Updates existing `meta.*`, `hero.*`, `waitlist.*` string values (keys unchanged so the form island keeps working).

Keep the JSON valid. Do not rename any existing key. Only change string values and add the two new blocks. Preserve `consent.v1` verbatim.

- [ ] **Step 1: Elevate meta and hero copy**

Replace the `meta` and `hero` blocks with:

```json
  "meta": {
    "title": "Pazapas | le cercle fondateur",
    "description": "Un abonnement de souliers en cuir, curés paire par paire pour les enfants de 0 à 7 ans. La bonne pointure, au bon moment, dans le respect du pied qui grandit. Accès sur inscription au cercle fondateur.",
    "ogTitle": "Pazapas | des souliers d'exception qui grandissent avec l'enfant",
    "ogDescription": "Une curation exigeante, un abonnement discret, une place dans le cercle fondateur. Inscrivez-vous pour un accès anticipé."
  },
  "hero": {
    "eyebrow": "Sur inscription | cercle fondateur",
    "title": "Le soulier juste, à la pointure juste, au moment juste.",
    "subtitle": "Un abonnement confidentiel de souliers en cuir pour les enfants de 0 à 7 ans. Nous curons chaque paire et l'adressons quand le pied a grandi. Vous n'y pensez plus, tout est déjà pensé.",
    "cta": "Demander mon accès",
    "reassurance": "Places du cercle fondateur ouvertes par vagues. Nous vous écrivons à l'ouverture.",
    "visualAlt": "Monogramme Pazapas sur un carreau terracotta"
  },
```

- [ ] **Step 2: Add the `showcase` block**

Insert a new `showcase` block after the `why` block:

```json
  "showcase": {
    "title": "La collection curée",
    "intro": "Chaque modèle est retenu pour la santé du pied, la noblesse du cuir et la justesse de la forme. Un choix restreint, tenu avec exigence.",
    "products": [
      {
        "name": "Le premier pas",
        "material": "Cuir pleine fleur, doublure peau",
        "note": "Semelle souple pensée pour l'éveil de la marche, du 0 aux premiers mois.",
        "alt": "Soulier premier pas en cuir sur fond neutre",
        "image": "/images/showcase-1.svg"
      },
      {
        "name": "La sandale d'été",
        "material": "Cuir tanné végétal, boucle laiton",
        "note": "Maintien du talon et aération du pied pour les journées chaudes.",
        "alt": "Sandale enfant en cuir sur fond neutre",
        "image": "/images/showcase-2.svg"
      },
      {
        "name": "La bottine d'hiver",
        "material": "Cuir ciré, doublure chaude",
        "note": "Tenue de la cheville et protection, sans entraver la foulée.",
        "alt": "Bottine enfant en cuir sur fond neutre",
        "image": "/images/showcase-3.svg"
      }
    ]
  },
```

- [ ] **Step 3: Add the `membership` block**

Insert a new `membership` block after `showcase`:

```json
  "membership": {
    "eyebrow": "Le cercle fondateur",
    "title": "Une place, pas une liste.",
    "subtitle": "Le cercle fondateur réunit les premières familles que nous accompagnons. Accès anticipé à la collection, tarif fondateur préservé, et l'oreille attentive de l'équipe. Sur inscription, honorée par vagues.",
    "benefits": [
      "Accès anticipé à chaque nouvelle sélection",
      "Tarif fondateur conservé aussi longtemps que l'abonnement",
      "Conseil de pointure suivi par une podologue"
    ],
    "cta": "Demander ma place"
  },
```

- [ ] **Step 4: Push exclusivity in the waitlist strings (keys unchanged)**

Within the existing `waitlist` block, change only these string values:

```json
    "title": "Demandez votre place au cercle fondateur",
    "subtitle": "Une inscription confidentielle. Vos données restent dans l'Union européenne, ne sont jamais revendues, et vous pouvez les faire supprimer à tout moment.",
    "submit": "Demander ma place",
    "submitting": "Envoi en cours",
    "successTitle": "Votre demande est enregistrée.",
    "successBody": "Vous faites partie des premières familles pressenties. Nous vous écrirons à l'ouverture de votre vague.",
```

Leave all other `waitlist` keys (labels, placeholders, options, errors) unchanged.

- [ ] **Step 5: Update footer tagline and nav CTA to match register**

Change only these values:

```json
  "nav": {
    "brand": "Pazapas",
    "skipToContent": "Aller au contenu",
    "cta": "Demander mon accès"
  },
```

And in `footer`, change `tagline` to:

```json
    "tagline": "Des souliers d'exception qui grandissent avec l'enfant.",
```

- [ ] **Step 6: Build and validate JSON**

Run: `npm run build`
Expected: build completes, no JSON parse error, no type error.

- [ ] **Step 7: Commit**

```bash
git add src/content/copy.fr.json
git commit -m "Rewrite copy for exclusivity and add showcase and membership blocks"
```

---

### Task 3: Hero restyle

**Files:**
- Modify: `src/components/Hero.astro`

**Interfaces:**
- Consumes: `copy.hero.*`, existing `/images/pazapas-tile-terracotta.svg`.

- [ ] **Step 1: Rewrite the section wrapper and layout**

Replace the `<section>` in `src/components/Hero.astro` with an espresso, grained hero. The left column holds eyebrow pill, headline, subtitle, and a glass CTA card; the right column frames the terracotta tile. Use this structure:

```astro
<section class="section-dark grain relative overflow-hidden">
  <div
    class="pointer-events-none absolute -right-32 -top-32 h-[36rem] w-[36rem] rounded-full opacity-40 blur-3xl"
    style="background: radial-gradient(closest-side, rgba(216,154,94,0.35), transparent 70%);"
    aria-hidden="true"
  >
  </div>
  <div class="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-[var(--spacing-section-mobile)] md:grid-cols-2 md:py-[var(--spacing-section)]">
    <div class="fade-in-up">
      <p class="mb-5 inline-block rounded-pill border border-[color:var(--hairline-gold)] px-4 py-1.5 text-sm tracking-wide text-ink-muted-invert">
        {hero.eyebrow}
      </p>
      <h1 class="text-4xl font-light leading-[1.1] text-ink-invert sm:text-5xl lg:text-6xl">{hero.title}</h1>
      <p class="mt-6 max-w-prose text-lg text-ink-muted-invert">{hero.subtitle}</p>
      <div class="glass glass-dark mt-8 flex flex-wrap items-center gap-4 p-4">
        <a
          href="#waitlist"
          class="rounded-pill px-6 py-3 text-base font-medium text-ink shadow-soft transition-transform hover:-translate-y-0.5"
          style="background-image: var(--gradient-accent);"
        >
          {hero.cta}
        </a>
        <span class="text-sm text-ink-muted-invert">{hero.reassurance}</span>
      </div>
    </div>

    <div class="fade-in-up flex justify-center md:justify-end">
      <div class="glass glass-dark p-6">
        <img
          src="/images/pazapas-tile-terracotta.svg"
          alt={hero.visualAlt}
          width="400"
          height="400"
          class="h-auto w-full max-w-sm rounded-[12px]"
        />
      </div>
    </div>
  </div>
</section>
```

Note the CTA gradient and the radial glow are dynamic color values, so inline `style` is acceptable per the engineering rules.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build completes, no errors.

- [ ] **Step 3: Visual check**

Run: `npm run dev`. Confirm at 360 / 768 / 1024 / 1440: headline legible on espresso, CTA gradient visible, glass card frosts the glow behind it, tile framed. Tab to the CTA: visible focus ring.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro
git commit -m "Restyle hero with espresso glass treatment"
```

---

### Task 4: How it works restyle

**Files:**
- Modify: `src/components/HowItWorks.astro`

**Interfaces:**
- Consumes: `copy.howItWorks.{title,subtitle,steps[]}`.

- [ ] **Step 1: Apply light section and glass step-cards with gold numerals**

Wrap the section as `.section-light`. Render the three steps as glass-light cards in a responsive grid. Each card shows a gold numeral (index + 1), the step title in Fraunces, and the body. Use:

```astro
<section class="section-light">
  <div class="mx-auto max-w-[1200px] px-6 py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]">
    <div class="max-w-2xl">
      <h2 class="text-3xl font-light text-ink sm:text-4xl">{howItWorks.title}</h2>
      <p class="mt-3 text-lg text-ink-muted">{howItWorks.subtitle}</p>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      {
        howItWorks.steps.map((step, i) => (
          <article class="glass glass-light fade-in-up p-7">
            <span
              class="text-2xl font-medium"
              style="color: var(--color-accent-gold);"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 class="mt-3 text-xl text-ink">{step.title}</h3>
            <p class="mt-2 text-ink-muted">{step.body}</p>
          </article>
        ))
      }
    </div>
  </div>
</section>
```

Confirm the frontmatter destructures `const { howItWorks } = copy;`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Visual check**

Cards read on cream at all four widths; single column at 360, three columns at 1024+.

- [ ] **Step 4: Commit**

```bash
git add src/components/HowItWorks.astro
git commit -m "Restyle how it works with glass step-cards"
```

---

### Task 5: Why it exists restyle

**Files:**
- Modify: `src/components/WhyItExists.astro`

**Interfaces:**
- Consumes: `copy.why.{title,body[]}`.

- [ ] **Step 1: Apply espresso editorial treatment**

```astro
<section class="section-dark grain relative">
  <div class="relative mx-auto max-w-[820px] px-6 py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]">
    <h2 class="text-3xl font-light text-ink-invert sm:text-4xl">{why.title}</h2>
    <div class="mt-6 space-y-5 text-lg leading-relaxed text-ink-muted-invert">
      {why.body.map((p) => <p>{p}</p>)}
    </div>
  </div>
</section>
```

Confirm frontmatter destructures `const { why } = copy;`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Visual check**

Body text on espresso reads AA at all widths.

- [ ] **Step 4: Commit**

```bash
git add src/components/WhyItExists.astro
git commit -m "Restyle why it exists as espresso editorial block"
```

---

### Task 6: Product showcase (new)

**Files:**
- Create: `src/components/ProductShowcase.astro`
- Create: `public/images/showcase-1.svg`, `public/images/showcase-2.svg`, `public/images/showcase-3.svg`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `copy.showcase.{title,intro,products[]}` (from Task 2).
- Produces: default-exported `ProductShowcase.astro` imported by `index.astro`.

- [ ] **Step 1: Create the three placeholder SVGs**

Each is a soft geometric shoe silhouette in accent tones on a neutral ground, sized 600x480. Create `public/images/showcase-1.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480" role="img" aria-label="Placeholder produit">
  <rect width="600" height="480" fill="#f1e7db"/>
  <ellipse cx="300" cy="410" rx="190" ry="26" fill="#d89a5e" opacity="0.25"/>
  <path d="M150 360c20-30 60-40 110-40 40 0 70 18 120 18 60 0 80 22 80 40 0 16-14 24-40 24H180c-24 0-42-18-30-42z" fill="#c46a3a" opacity="0.9"/>
  <path d="M170 320c30-16 90-16 130 0" fill="none" stroke="#fcf4f0" stroke-width="8" stroke-linecap="round"/>
</svg>
```

Create `public/images/showcase-2.svg` (vary the hue slightly with `#b98a4e` on the shape):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480" role="img" aria-label="Placeholder produit">
  <rect width="600" height="480" fill="#efe6da"/>
  <ellipse cx="300" cy="410" rx="190" ry="26" fill="#d89a5e" opacity="0.25"/>
  <path d="M160 360c10-40 70-52 130-52 46 0 78 22 120 22 44 0 60 20 60 38 0 16-14 24-40 24H188c-26 0-34-40-28-72z" fill="#b98a4e" opacity="0.9"/>
  <circle cx="410" cy="330" r="10" fill="#fcf4f0"/>
</svg>
```

Create `public/images/showcase-3.svg` (taller boot silhouette):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480" role="img" aria-label="Placeholder produit">
  <rect width="600" height="480" fill="#ece2d6"/>
  <ellipse cx="300" cy="410" rx="190" ry="26" fill="#1e1a17" opacity="0.12"/>
  <path d="M210 180c0-14 40-14 40 0v120c40 0 130 4 150 40 10 18 6 40-30 40H210c-20 0-24-18-24-40z" fill="#8a5a34" opacity="0.92"/>
  <path d="M210 250c20-8 40-8 40 0" fill="none" stroke="#fcf4f0" stroke-width="7" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: Create `ProductShowcase.astro`**

An asymmetric editorial gallery: the first product spans two columns on desktop, the other two stack beside it. Each card is glass-light with an image, name (Fraunces), a gold material line, and a note.

```astro
---
import copy from "../content/copy.fr.json";
const { showcase } = copy;
---

<section class="section-light">
  <div class="mx-auto max-w-[1200px] px-6 py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]">
    <div class="max-w-2xl">
      <h2 class="text-3xl font-light text-ink sm:text-4xl">{showcase.title}</h2>
      <p class="mt-3 text-lg text-ink-muted">{showcase.intro}</p>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      {
        showcase.products.map((product, i) => (
          <article
            class:list={[
              "glass glass-light fade-in-up overflow-hidden",
              i === 0 && "md:col-span-2 md:row-span-2",
            ]}
          >
            <img
              src={product.image}
              alt={product.alt}
              width="600"
              height="480"
              loading="lazy"
              class="h-56 w-full object-cover md:h-auto"
            />
            <div class="p-7">
              <h3 class="text-xl text-ink">{product.name}</h3>
              <p class="mt-1 text-sm" style="color: var(--color-accent);">
                {product.material}
              </p>
              <p class="mt-3 text-ink-muted">{product.note}</p>
            </div>
          </article>
        ))
      }
    </div>
  </div>
</section>
```

- [ ] **Step 3: Insert into `index.astro`**

In `src/pages/index.astro`, add the import and place the component after `<WhyItExists />`:

```astro
import ProductShowcase from "../components/ProductShowcase.astro";
```

```astro
    <WhyItExists />
    <ProductShowcase />
    <Quality />
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: no errors, three images copied to `dist`.

- [ ] **Step 5: Visual check**

At 1024+, product one is the large left tile, the other two stack right. At 360, all three stack. Images have alt text.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProductShowcase.astro public/images/showcase-1.svg public/images/showcase-2.svg public/images/showcase-3.svg src/pages/index.astro
git commit -m "Add editorial product showcase with placeholder imagery"
```

---

### Task 7: Quality restyle

**Files:**
- Modify: `src/components/Quality.astro`

**Interfaces:**
- Consumes: `copy.quality.{title,subtitle,points[]}`.

- [ ] **Step 1: Apply espresso section with glass-dark spec-cards**

```astro
<section class="section-dark grain relative">
  <div class="relative mx-auto max-w-[1200px] px-6 py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]">
    <div class="max-w-2xl">
      <h2 class="text-3xl font-light text-ink-invert sm:text-4xl">{quality.title}</h2>
      <p class="mt-3 text-lg text-ink-muted-invert">{quality.subtitle}</p>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      {
        quality.points.map((point) => (
          <article class="glass glass-dark fade-in-up p-7">
            <h3 class="text-xl text-ink-invert">{point.title}</h3>
            <p class="mt-2 text-ink-muted-invert">{point.body}</p>
          </article>
        ))
      }
    </div>
  </div>
</section>
```

Confirm frontmatter destructures `const { quality } = copy;`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Visual check**

Glass-dark cards read on espresso at all widths.

- [ ] **Step 4: Commit**

```bash
git add src/components/Quality.astro
git commit -m "Restyle quality with glass spec-cards on espresso"
```

---

### Task 8: Founder note restyle

**Files:**
- Modify: `src/components/FounderNote.astro`

**Interfaces:**
- Consumes: `copy.founder.{title,body,signature}`.

- [ ] **Step 1: Apply cream section with portrait placeholder and serif body**

```astro
<section class="section-light">
  <div class="mx-auto grid max-w-[1000px] items-center gap-10 px-6 py-[var(--spacing-section-mobile)] md:grid-cols-[auto_1fr] md:py-[var(--spacing-section)]">
    <div
      class="mx-auto h-28 w-28 rounded-pill md:h-40 md:w-40"
      style="background-image: var(--gradient-accent);"
      aria-hidden="true"
    >
    </div>
    <div>
      <h2 class="text-3xl font-light text-ink sm:text-4xl">{founder.title}</h2>
      <p class="mt-5 font-[var(--font-display)] text-lg leading-relaxed text-ink">{founder.body}</p>
      <p class="mt-6 text-sm tracking-wide" style="color: var(--color-accent);">{founder.signature}</p>
    </div>
  </div>
</section>
```

Confirm frontmatter destructures `const { founder } = copy;`. The portrait is a gradient placeholder until a real image is supplied.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Visual check**

Stacks on mobile, side-by-side at 768+.

- [ ] **Step 4: Commit**

```bash
git add src/components/FounderNote.astro
git commit -m "Restyle founder note with portrait placeholder"
```

---

### Task 9: Membership section and form panel

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/WaitlistForm.tsx`

**Interfaces:**
- Consumes: `copy.membership.*`, `copy.waitlist.*`. Does NOT change form fields, zod schema, submit handler, or the POST to `/api/waitlist`.

- [ ] **Step 1: Restyle the membership section wrapper in `index.astro`**

Replace the existing `<section id="waitlist">` block with an espresso membership section that keeps the `#waitlist` anchor, adds the eyebrow/benefits, and wraps the form island in a glass panel:

```astro
    <section id="waitlist" class="section-dark grain relative scroll-mt-8">
      <div class="relative mx-auto max-w-[1200px] px-6 py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]">
        <div class="mx-auto grid max-w-4xl gap-10 md:grid-cols-2 md:items-start">
          <div>
            <p class="mb-4 inline-block rounded-pill border border-[color:var(--hairline-gold)] px-4 py-1.5 text-sm tracking-wide text-ink-muted-invert">
              {membership.eyebrow}
            </p>
            <h2 class="text-3xl font-light text-ink-invert sm:text-4xl">{membership.title}</h2>
            <p class="mt-3 text-lg text-ink-muted-invert">{membership.subtitle}</p>
            <ul class="mt-6 space-y-3">
              {
                membership.benefits.map((benefit) => (
                  <li class="flex gap-3 text-ink-muted-invert">
                    <span aria-hidden="true" style="color: var(--color-accent-gold);">
                      &#8212;
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))
              }
            </ul>
          </div>
          <div class="glass glass-dark p-6 sm:p-8">
            <WaitlistForm client:visible />
          </div>
        </div>
      </div>
    </section>
```

Note: the `&#8212;` entity renders an em dash as a decorative bullet only. This is markup, not prose copy, so the no-em-dash copy rule is not violated. If you prefer to avoid it entirely, use a small gold dot: replace the `<span>` with `<span aria-hidden="true" class="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill" style="background-image: var(--gradient-accent);"></span>`. Prefer the dot.

Update the frontmatter destructure in `index.astro` to include membership:

```astro
const { membership } = copy;
```

Remove the now-unused `const { waitlist } = copy;` line if `waitlist` is no longer referenced in `index.astro` (the form island imports its own copy). Verify with a search before deleting.

- [ ] **Step 2: Restyle the form controls in `WaitlistForm.tsx` (styling only)**

Open `src/components/WaitlistForm.tsx`. Change only Tailwind class strings on inputs, labels, chips, and the submit button so they read on the dark glass panel. Do not change any state, validation, handler, field name, or the fetch call. Concretely:
- Inputs/selects: ensure a readable surface, e.g. classes `bg-surface text-ink` remain (the form sits on a glass panel, inputs stay light for contrast and familiarity).
- Labels and helper text on the panel: switch label text color utility to `text-ink-invert` and helper/optional text to `text-ink-muted-invert`.
- Submit button: apply the gradient via `style="background-image: var(--gradient-accent)"` (dynamic) and `text-ink`, keeping existing disabled/submitting logic.
- Age-range chips: selected state uses `style` gradient background; unselected uses `border-[color:var(--hairline-gold)] text-ink-invert`.

Make the minimal class edits needed; leave the JSX structure and logic identical.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: no errors, no TypeScript errors.

- [ ] **Step 4: Manual form check**

Run `npm run dev`. Tab through every control: labels associated, visible focus, chips toggle by keyboard (Enter/Space), submit disabled state intact. Confirm the happy path still POSTs to `/api/waitlist` (network tab shows the request; backend behavior unchanged). Confirm error states render (submit empty form).

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/WaitlistForm.tsx
git commit -m "Reframe waitlist as membership section with glass form panel"
```

---

### Task 10: FAQ restyle

**Files:**
- Modify: `src/components/FAQ.astro`

**Interfaces:**
- Consumes: `copy.faq.{title,items[]}`.

- [ ] **Step 1: Apply cream section with glass accordion items**

Keep the existing `<details>/<summary>` semantics (native, accessible, no JS). Wrap each item in a glass-light card. Use:

```astro
<section class="section-light">
  <div class="mx-auto max-w-[820px] px-6 py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]">
    <h2 class="text-3xl font-light text-ink sm:text-4xl">{faq.title}</h2>
    <div class="mt-10 space-y-4">
      {
        faq.items.map((item) => (
          <details class="glass glass-light group p-6">
            <summary class="cursor-pointer list-none text-lg text-ink marker:content-none">
              {item.q}
            </summary>
            <p class="mt-3 text-ink-muted">{item.a}</p>
          </details>
        ))
      }
    </div>
  </div>
</section>
```

Confirm frontmatter destructures `const { faq } = copy;`. If the current file already uses `<details>`, preserve any existing chevron/aria affordances and only swap the wrapper classes.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Visual and keyboard check**

Each item expands on Enter when focused; focus ring visible on summary.

- [ ] **Step 4: Commit**

```bash
git add src/components/FAQ.astro
git commit -m "Restyle FAQ as glass accordion"
```

---

### Task 11: Footer restyle

**Files:**
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes: `copy.footer.*`, `copy.nav.brand`.

- [ ] **Step 1: Apply espresso footer with gold hairline top border**

```astro
<footer class="section-dark border-t" style="border-color: var(--hairline-gold);">
  <div class="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
    <div>
      <p class="text-lg text-ink-invert" style="font-family: var(--font-display);">{nav.brand}</p>
      <p class="mt-1 text-sm text-ink-muted-invert">{footer.tagline}</p>
    </div>
    <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted-invert">
      <a class="hover:text-ink-invert" href={`mailto:${footer.contactEmail}`}>{footer.contactLabel}</a>
      <a class="hover:text-ink-invert" href="/politique-de-confidentialite">{footer.legal.privacy}</a>
      <a class="hover:text-ink-invert" href="/mentions-legales">{footer.legal.mentions}</a>
    </nav>
  </div>
  <div class="mx-auto max-w-[1200px] px-6 pb-10 text-xs text-ink-muted-invert">
    &copy; {new Date().getFullYear()} {nav.brand}. {footer.copyright}
  </div>
</footer>
```

Confirm frontmatter destructures `const { footer, nav } = copy;`. Preserve the existing legal link hrefs if they differ from the above; only restyle.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Visual check**

Links keyboard-focusable, gold hairline visible, contrast AA.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro
git commit -m "Restyle footer on espresso with gold hairline"
```

---

### Task 12: CLAUDE.md update and full-page verification

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- None (documentation and final gate).

- [ ] **Step 1: Update CLAUDE.md sections 4, 5, 6, 12**

- Section 4: replace the palette table with the v2 tokens from Task 1, add the glass tokens, and add a line: "Glass elevation may use `--shadow-glass` in addition to `--shadow-soft`; this is the single documented exception to the one-shadow rule."
- Section 5: add a "Product showcase" row after "Why it exists": "editorial gallery of curated pairs, materials callouts, placeholder imagery until photography is supplied."
- Section 6: add a line under Voice guide: "Register leans to exclusivity and membership (cercle fondateur, acces anticipe, curation). Exclusivity is conveyed through restraint and specificity, never through hype or fake scarcity."
- Section 12: replace the "Final brand name and logo" row with: "Final brand name and logo | resolved: Pazapas, 2026-07-02".

- [ ] **Step 2: Full production build**

Run: `npm run build`
Expected: build succeeds with no errors or warnings.

- [ ] **Step 3: Full-page responsive sweep**

Run `npm run dev`. Load `/` and scroll the entire page at 360, 768, 1024, 1440 px. Confirm: alternating espresso/cream rhythm, glass panels legible, no horizontal scroll, no overlapping text, hero glow contained.

- [ ] **Step 4: Accessibility and console pass**

- No console errors or warnings on load or on form submit.
- Tab from top to bottom: skip link, hero CTA, form controls, FAQ summaries, footer links all reachable with visible focus.
- Toggle OS reduced-motion: entry animations and sheen do not animate.
- Spot-check contrast on espresso body text and glass card text (AA).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for v2 luxury design system"
```

---

## Self-review

**Spec coverage:** tokens/glass (Task 1) | copy exclusivity + showcase + membership blocks (Task 2) | hero (Task 3) | how it works (Task 4) | why (Task 5) | product showcase + images (Task 6) | quality (Task 7) | founder (Task 8) | membership reframe + form panel, backend untouched (Task 9) | FAQ (Task 10) | footer (Task 11) | CLAUDE.md 4/5/6/12 + final verification (Task 12). All spec sections mapped.

**Placeholders:** none. Product images are intentional visual placeholders (real photography supplied later), documented as such; not plan placeholders.

**Type/key consistency:** new copy keys defined in Task 2 (`showcase.*`, `membership.*`) are consumed with matching names in Tasks 6 and 9. Existing `waitlist.*` and `consent.v1` keys unchanged so `WaitlistForm.tsx` and the zod schema keep working. Utility class names defined in Task 1 (`.glass`, `.glass-dark`, `.glass-light`, `.section-dark`, `.section-light`, `.grain`) are used consistently in Tasks 3-11.
