// Phusion Passenger startup file for O2switch cPanel ("Setup Node.js App").
//
// Passenger loads this file to boot the app. Astro's standalone Node build
// output (dist/server/entry.mjs) is an ES module and starts its own HTTP
// server on import, so we just dynamically import it. A .cjs wrapper is used
// because package.json sets "type": "module"; dynamic import() works from
// CommonJS and lets Passenger hook the server's listen() call (it swaps the
// port for a Unix socket automatically — no PORT handling needed here).
//
// Prerequisite: run `npm install` and `npm run build` on the server first so
// that dist/ exists, then set this file as the "Application startup file".
import("./dist/server/entry.mjs").catch((err) => {
  console.error("Failed to start Astro server:", err);
  process.exit(1);
});
