# Prompt — integrate the shoe-assembly widget into this project

Paste the message below into Claude Code, from the root of your website project,
with the `motion-widget/` folder already placed somewhere in the project.

---

I've dropped a folder called `motion-widget/` into this project. It contains a
self-contained Web Component that animates a shoe assembly (3 slices sliding
in, alternating tri-color combinations, seamless loop). Please integrate it
into the site.

**What's in the folder:**
- `motion-widget/shoe-assembly.js` — the Web Component (defines `<shoe-assembly>`)
- `motion-widget/assets/` — 9 transparent PNG slices (haut/mid/bas × gris/marron/rose)
- `motion-widget/README.md` — full API reference and framework snippets
- `motion-widget/demo.html` — standalone preview

**What I want you to do:**

1. Detect the framework this site uses (plain HTML, React/Next, Vue/Nuxt, Astro,
   SvelteKit, etc.) by inspecting `package.json` and the file layout.

2. Move `motion-widget/` to whatever folder serves static assets in this
   framework (e.g. `/public/motion-widget/` for Next/Vite/Astro, `/static/` for
   SvelteKit, project root for plain HTML). Preserve the folder structure —
   the component finds its PNGs via a `src` attribute pointing to
   `<framework-static-path>/motion-widget/assets`.

3. Pick a good place to show the animation. Ask me if the answer isn't obvious.
   Reasonable defaults:
   - Landing page hero (side-by-side with headline copy)
   - Product page (large centered visual)
   - "How it's made" or brand story section

4. Add the integration snippet using the framework-appropriate pattern from
   `motion-widget/README.md`:
   - **Plain HTML**: `<script src="…/shoe-assembly.js"></script>` + `<shoe-assembly src="…/assets"></shoe-assembly>`
   - **React/Next**: import the script in a `useEffect`, render `<shoe-assembly>`; add TS declaration if project is TypeScript
   - **Vue/Nuxt**: import in `onMounted`; register `shoe-assembly` as a custom element in the Vue compiler options
   - **Astro/Svelte**: use directly in the template with a `<script src>` tag

5. Wrap the element in a container that constrains its width (it fills 100% of
   its parent and keeps 1:1 aspect ratio). Suggested max-width: 500–800px.

6. Check that:
   - The PNGs load (Network tab, no 404s)
   - The animation actually plays (should see slices sliding in every ~2s)
   - No console errors
   - It looks right on mobile (the component is responsive by default)

7. Read `motion-widget/README.md` for the full attribute list if you want to
   tune timing (`hold`, `enter`, `exit`, `stagger`, `overlap`).

**Constraints:**
- Do NOT modify `motion-widget/shoe-assembly.js` or the PNGs — treat them as
  a vendored library.
- Do NOT strip the Shadow DOM boundary — that's what keeps the component's
  CSS from clashing with the rest of the site.
- If the site is server-rendered (Next, Nuxt, SvelteKit), the component only
  runs client-side. Make sure the script import happens after hydration
  (in a `useEffect`, `onMounted`, or `client:load` directive) or with SSR
  disabled for that block.

Report back with the file(s) you changed, where the animation now lives, and a
one-line "how to view it" instruction (e.g. `npm run dev` and open which route).
