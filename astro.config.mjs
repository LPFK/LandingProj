// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

// The API route (/api/waitlist) needs on-demand rendering, so we run in
// server output with the standalone Node adapter. This produces a self-hosted
// server (dist/server/entry.mjs) suitable for O2switch cPanel + Phusion
// Passenger. Static sections are still prerendered per-page via
// `export const prerender = true` where relevant.
export default defineConfig({
  site: "https://example.com", // TODO: set to the real production URL before launch
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
