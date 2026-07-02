// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// The API route (/api/waitlist) needs on-demand rendering, so we run in
// server output with a Vercel adapter. Static sections are still prerendered
// per-page via `export const prerender = true` where relevant.
export default defineConfig({
  site: "https://example.com",
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
