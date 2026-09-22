// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// DEMO BRANCH ONLY — do not merge into master.
//
// master targets O2switch (cPanel + Phusion Passenger) via the @astrojs/node
// standalone adapter; see DEPLOY_NOTES.md. This branch swaps in the Vercel
// adapter so clients can preview the site at a URL before the real deploy.
// Output stays `server`: /api/waitlist still needs on-demand rendering.
export default defineConfig({
  // Vercel exposes the generated deployment host at build time, so canonical
  // and Open Graph URLs match whatever preview URL this lands on.
  site: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://example.com",
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
