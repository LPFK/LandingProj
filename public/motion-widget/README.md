# shoe-assembly

Animated shoe assembly as a self-contained Web Component. Drops into any web
page — plain HTML, React, Vue, Astro, Next.js, whatever — with two lines.

## Contents

```
motion-widget/
├── assets/               ← 9 sliced PNGs (transparent background)
├── shoe-assembly.js      ← the Web Component (~5 KB)
├── demo.html             ← standalone preview
├── README.md
└── PROMPT.md             ← paste this into Claude to integrate it for you
```

Total footprint: ~1.2 MB (mostly the PNGs).

## Quick start (plain HTML)

Copy the whole `motion-widget/` folder into your site, then anywhere in a page:

```html
<script src="motion-widget/shoe-assembly.js"></script>

<shoe-assembly src="motion-widget/assets"></shoe-assembly>
```

The `<shoe-assembly>` element fills 100% of its parent's width and keeps a
1:1 aspect ratio. Wrap it in a container to size it:

```html
<div style="max-width: 600px">
  <shoe-assembly src="motion-widget/assets"></shoe-assembly>
</div>
```

Open `demo.html` in a browser (via a local server — file:// blocks image loads)
to see it in isolation.

## Attributes (all optional)

| Attribute | Default | What it does |
|-----------|---------|--------------|
| `src`     | `assets` | Path (relative to the page) to the folder holding the 9 PNGs |
| `hold`    | `1000`  | Ms to hold each assembled shoe on-stage |
| `stagger` | `100`   | Ms between the 3 slices sliding in |
| `enter`   | `500`   | Slide-in duration in ms |
| `exit`    | `320`   | Slide-out duration in ms |
| `overlap` | `140`   | Ms next combo starts entering while current is still exiting |

Example — slower, more theatrical:

```html
<shoe-assembly src="motion-widget/assets" hold="1400" enter="700" exit="400"></shoe-assembly>
```

## Framework snippets

### React / Next.js

Copy `motion-widget/` into `/public/motion-widget/`.

```jsx
import { useEffect } from 'react';

export function ShoeAssembly() {
  useEffect(() => {
    import(/* @vite-ignore */ '/motion-widget/shoe-assembly.js');
  }, []);
  return <shoe-assembly src="/motion-widget/assets" />;
}
```

If TypeScript complains about the custom element, add to your global types:

```ts
declare namespace JSX {
  interface IntrinsicElements {
    'shoe-assembly': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string; hold?: string | number;
      stagger?: string | number; enter?: string | number;
      exit?: string | number; overlap?: string | number;
    };
  }
}
```

### Vue / Nuxt

Copy `motion-widget/` into `/public/motion-widget/`.

```vue
<template>
  <shoe-assembly src="/motion-widget/assets" />
</template>

<script setup>
import { onMounted } from 'vue';
onMounted(() => import('/motion-widget/shoe-assembly.js'));
</script>
```

Tell Vue the tag is a custom element (in `vite.config.js`):

```js
export default {
  plugins: [vue({
    template: { compilerOptions: { isCustomElement: (tag) => tag === 'shoe-assembly' } }
  })],
};
```

### Astro

Copy `motion-widget/` into `/public/motion-widget/`.

```astro
---
---
<shoe-assembly src="/motion-widget/assets"></shoe-assembly>
<script src="/motion-widget/shoe-assembly.js"></script>
```

## Design notes

- **Motion personality**: Premium — ease-out `cubic-bezier(0.05, 0.7, 0.1, 1)`
  (MD3 emphasized) for entry, `cubic-bezier(0.3, 0, 1, 1)` (MD3 accelerate) for exit.
- **Choreography**: haut → mid → bas, alternating left/right/left slide.
- **Sequence rhythm**: two random tri-color combos, then a solid pair rotating
  through gris → marron → rose. Never repeats the same combo back-to-back.
- **Shadow DOM**: fully isolated CSS. Zero chance of clashing with host styles.
- **Accessibility**: honors `prefers-reduced-motion` (animation collapses to 1ms).
- **Performance**: GPU-accelerated transforms only. No layout thrash. Loop pauses
  automatically when the element is removed from the DOM.
