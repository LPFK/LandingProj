# Deploy notes

Known limitations and pre-launch checklist. The app is fully functional in local
development. The items below must be resolved before the waitlist opens to the
public. See CLAUDE.md section 12 for the related open decisions.

## Quick checklist

- [ ] **Resend** — verified sender domain (SPF/DKIM), `RESEND_FROM` set to it
- [ ] **Legal** — all `TODO_LEGAL` filled, real contact email, lawyer review
- [ ] **Supabase** — hosted EU project, both migrations applied, env vars set
- [ ] **Turnstile** — widget created, `TURNSTILE_SECRET_KEY` + `PUBLIC_TURNSTILE_SITE_KEY` set
- [ ] **`astro.config.mjs`** — `site` = real production URL (drives OG + confirmation links)
- [ ] **DNS + HTTPS** — domain pointed at the O2switch host, AutoSSL enabled
- [ ] **Production `.env`** — all seven variables present at build time
- [ ] **Post-deploy verification** — run the smoke test at the bottom of this file

## Blocking before launch

### 1. Confirmation email sender (Resend)

Current state: `RESEND_FROM` uses Resend's shared test sender
`onboarding@resend.dev`. In test mode Resend only delivers to the address that
owns the Resend account, so real signups will not receive the email.

To fix:
- Verify a domain you control in the Resend dashboard (add the SPF and DKIM DNS
  records Resend provides, wait for verification).
- Set `RESEND_FROM` to an address on that domain, for example
  `"Nom du service <bonjour@votredomaine.fr>"`.
- No code change is needed. The sending path is already verified end to end.

### 2. Legal pages content

`src/pages/mentions-legales.astro` and
`src/pages/politique-de-confidentialite.astro` are drafted but contain bracketed
placeholders (marked `TODO_LEGAL`) for details only the operator can supply:
company legal identity (raison sociale, forme juridique, capital, SIREN or RCS,
siège social, TVA), the publication director, the real contact email, the exact
data retention period, and confirmation of the o2switch host's postal address.
The whole text must be reviewed by a lawyer before launch.

The host is now documented as **o2switch** (France) in both the mentions
légales and the privacy policy; only its exact postal address is left as a
`TODO_LEGAL` to verify against your contract. The sub-processor list is
Supabase, Resend, o2switch, and Cloudflare Turnstile — keep it in sync with any
change to the stack.

The placeholder contact email in both pages and in the footer is
`contact@exemple.fr` / `contact@pazapas.fr`. Replace it with the real address.

### 3. Production Supabase

Current state: the app points at a local Supabase stack
(`SUPABASE_URL=http://127.0.0.1:54321`) running under Docker.

To fix:
- Create a hosted Supabase project in an EU region.
- Apply both migrations in `supabase/migrations/` (base table + the double
  opt-in columns). They grant `service_role` the DML it needs; a fresh database
  works without manual steps.
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` as environment variables in the
  hosting provider (O2switch), never in the client bundle.

### 4. Cloudflare Turnstile (bot protection)

The waitlist API enforces a Turnstile check whenever `TURNSTILE_SECRET_KEY` is
set; the widget renders whenever `PUBLIC_TURNSTILE_SITE_KEY` is set. Both are
empty locally (check disabled for development).

To fix:
- Create a Turnstile widget at
  https://dash.cloudflare.com/?to=/:account/turnstile (add the production
  domain to the widget's hostname list).
- Set `TURNSTILE_SECRET_KEY` (server) and `PUBLIC_TURNSTILE_SITE_KEY` (client)
  in the hosting environment. If these are left empty in production, the form
  still works but has **no bot protection** — do not launch without them.

### 5. Hosting and environment variables (O2switch cPanel)

Deploy target is **O2switch** (Pro offer, cPanel shared hosting). The site runs
as a Node app served by **Phusion Passenger** via cPanel's **Setup Node.js App**
tool, using the `@astrojs/node` standalone adapter (`astro.config.mjs`). Passenger
manages the process and the socket — there is no `PORT` to configure and no
reverse proxy to set up.

Deploy procedure:

1. **Upload the project** to an Application Root *outside* `public_html`
   (e.g. `/home/USER/landingproj`) via git or SFTP. Exclude `node_modules/` and
   your local `.env`.
2. **cPanel → Setup Node.js App → Create Application:**
   - Node.js version: 20 (LTS) or 22 — match the local major version.
   - Application mode: Production.
   - Application root: the folder from step 1.
   - Application URL: the production domain/subdomain.
   - Application startup file: `app.cjs` (the Passenger loader that imports the
     ESM build output `dist/server/entry.mjs`).
3. **Environment variables.** The app reads `import.meta.env.*`, and the build
   runs on the server, so create a production `.env` in the Application Root
   (chmod 600) *before building* with the real hosted values: `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE`, `RESEND_API_KEY`, `RESEND_FROM`,
   `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, and
   `PUBLIC_PLAUSIBLE_DOMAIN`. (Optionally also add them in the cPanel app's
   Environment variables UI for runtime.) Do not upload the local `.env` — it
   points at the local Supabase stack and the Resend test sender.
4. **Install and build over SSH.** Use the `source .../bin/activate` command
   shown in the cPanel Node.js App panel to enter the app's Node environment,
   then run `npm ci` and `npm run build` (produces `dist/server/entry.mjs`).
5. **Restart** the app from the cPanel panel (or `touch tmp/restart.txt`).
6. **DNS:** point the domain (and `www`) at the O2switch server. If the domain
   is registered/managed at O2switch this is automatic for the primary domain;
   otherwise set the `A` record (or nameservers) per the values in cPanel. Wait
   for propagation before enabling SSL.
7. **HTTPS:** enable AutoSSL for the domain in cPanel → SSL/TLS Status (free
   Let's Encrypt), then confirm the site loads over `https://`. HSTS is sent by
   the app, so verify HTTPS works before relying on it.
8. Confirm `site` in `astro.config.mjs` is set to the real production URL (it is
   currently `https://example.com`). It drives canonical and Open Graph URLs
   (and, if double opt-in is ever re-enabled, the absolute confirmation link).

Updates: `git pull && npm ci && npm run build`, then Restart the app.

Security headers (CSP, HSTS, X-Frame-Options, etc.) are set in
`src/middleware.ts` and apply automatically to every rendered response — no
`.htaccess` configuration is required. The CSP already allow-lists Turnstile and
Plausible.

## Implemented in the security pass

- **Opt-in mode:** **single opt-in is active** (`DOUBLE_OPTIN = false` in
  `src/pages/api/waitlist.ts`). Signups are stored as `confirmed = true`
  immediately and receive a simple welcome email (no link). The full double
  opt-in flow (hashed 72h token → `/confirmer?token=…` → confirmed) is kept
  intact behind that flag; flip it to `true` to re-enable, and also revert the
  form success copy (`waitlist.successTitle`/`successBody` in copy.fr.json) to
  the "check your email" wording. Either way the migration columns are used.
- **Rate limiting:** per-IP throttle (5 requests / 10 min) on `/api/waitlist`
  (`src/lib/rateLimit.ts`). In-memory; fine for a single Passenger worker.
- **Bot protection:** Cloudflare Turnstile (see item 4).
- **Security headers:** CSP, HSTS, X-Frame-Options, etc. via `src/middleware.ts`.

## Non-blocking, deferred by design

- Analytics: `PUBLIC_PLAUSIBLE_DOMAIN` is empty, so the Plausible script is not
  injected. Set it once the domain is chosen.
- Rate limiting is in-memory per Passenger worker. If the app is ever scaled to
  multiple workers/instances, move it to a shared store (e.g. Redis/Upstash);
  see the note in `src/lib/rateLimit.ts`.

## Dependency maintenance

- `npm audit` currently reports highs in `sharp`/libvips, `svgo`, and `tar`.
  These are **build-time only** (image optimisation / tooling) and are not
  reachable at runtime on this site, so the real-world risk is low.
- Run `npm audit fix` for the non-breaking updates. Avoid `npm audit fix --force`
  unless you re-test the build — it pulls a major Astro bump.
- Keep `@astrojs/node` and `astro` on matching majors when upgrading.

## Post-deploy verification

Run these once after the first production deploy (and after any change to the
signup flow):

1. **Security headers** — `curl -sI https://votredomaine.fr | grep -iE 'content-security|strict-transport|x-frame|x-content-type|referrer|permissions'`
   should list all six.
2. **Bot check** — load the form and confirm the Turnstile widget renders; a
   submission with the widget solved returns success.
3. **Signup, end to end** — submit a real address; the on-page success message
   appears and a welcome email arrives (no confirmation link, since single
   opt-in is active).
4. **Database state** — in Supabase, the row exists with `confirmed = true` and
   `confirmed_at` set.
5. **Rate limit** — six rapid POSTs to `/api/waitlist` from one IP; the sixth
   returns HTTP 429.
6. *(Only if double opt-in is re-enabled)* clicking the `/confirmer?token=…`
   link shows "Inscription confirmée"; a bogus/absent token shows the
   invalid-link page, not a server error.

## Local development setup (for reference)

- Docker Desktop data was relocated off the C: drive to
  `E:\Docker_data` via a directory junction at
  `C:\Users\<user>\AppData\Local\Docker\wsl`. This survives restarts.
- Start the local backend with `npx supabase start`, apply the schema with
  `npx supabase db reset`, then run the site with `npm run dev`.
- Local Supabase Studio: http://localhost:54323. Local mail catcher (Mailpit):
  http://localhost:54324 (note: the app uses Resend, not Mailpit).
