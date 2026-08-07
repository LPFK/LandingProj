/**
 * <shoe-assembly> — Web Component
 *
 * Drop-in animated shoe assembly for any web page.
 *
 * Usage:
 *   <script src="shoe-assembly.js"></script>
 *   <shoe-assembly src="assets"></shoe-assembly>
 *
 * Attributes (all optional):
 *   src        Folder containing the 9 slice PNGs. Default: "assets"
 *              Expected files: haut_gris.png, mid_gris.png, bas_gris.png,
 *                              haut_marron.png, mid_marron.png, bas_marron.png,
 *                              haut_rose.png, mid_rose.png, bas_rose.png
 *   hold       Milliseconds to hold each assembled shoe. Default: 1000
 *   stagger    Milliseconds between the 3 slices sliding in. Default: 100
 *   enter      Slide-in duration in ms.  Default: 500
 *   exit       Slide-out duration in ms. Default: 320
 *   overlap    Ms next combo starts entering while current exits. Default: 140
 *
 * Sizing: takes 100% of its parent's width, maintains 1:1 aspect ratio.
 */
(() => {
  if (customElements.get('shoe-assembly')) return;

  const Y = { haut: 0, mid: 342, bas: 683 };
  const COLORS = ['gris', 'marron', 'rose'];
  const DIRS   = { haut: 'left', mid: 'right', bas: 'left' };
  const ORDER  = ['haut', 'mid', 'bas'];

  const MIXED = [
    { haut: 'gris',   mid: 'marron', bas: 'rose'   },
    { haut: 'gris',   mid: 'rose',   bas: 'marron' },
    { haut: 'marron', mid: 'gris',   bas: 'rose'   },
    { haut: 'marron', mid: 'rose',   bas: 'gris'   },
    { haut: 'rose',   mid: 'gris',   bas: 'marron' },
    { haut: 'rose',   mid: 'marron', bas: 'gris'   },
  ];
  const solid = (c) => ({ haut: c, mid: c, bas: c });

  const shuffled = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const CSS = `
    :host {
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      contain: layout paint;
    }
    .wrap { position: relative; width: 100%; height: 100%; }
    .stage {
      position: absolute; top: 0; left: 0;
      width: 1024px; height: 1024px;
      transform-origin: top left;
      overflow: hidden;
    }
    .part {
      position: absolute;
      left: 0; width: 100%;
      transform: translateX(-1400px);
      will-change: transform, filter;
      transition:
        transform var(--dur-enter, 500ms) cubic-bezier(0.05, 0.7, 0.1, 1),
        filter    var(--dur-enter, 500ms) cubic-bezier(0.05, 0.7, 0.1, 1);
      filter: drop-shadow(0 30px 30px rgba(0, 0, 0, 0));
    }
    .part img {
      display: block; width: 100%; height: auto;
      pointer-events: none; user-select: none; -webkit-user-drag: none;
    }
    .part[data-state="off-left"]  { transform: translateX(-1400px); }
    .part[data-state="off-right"] { transform: translateX( 1400px); }
    .part[data-state="in"] {
      transform: translateX(0);
      filter: drop-shadow(0 30px 30px rgba(0, 0, 0, 0.12));
    }
    .part[data-exit="1"] {
      transition:
        transform var(--dur-exit, 320ms) cubic-bezier(0.3, 0, 1, 1),
        filter    var(--dur-exit, 320ms) cubic-bezier(0.3, 0, 1, 1);
      filter: drop-shadow(0 30px 30px rgba(0, 0, 0, 0));
    }
    @media (prefers-reduced-motion: reduce) {
      .part {
        transition-duration: 1ms !important;
      }
    }
  `;

  class ShoeAssembly extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._timers = new Set();
      this._running = false;
    }

    connectedCallback() {
      const src     = (this.getAttribute('src') || 'assets').replace(/\/$/, '');
      const HOLD    = parseInt(this.getAttribute('hold')    || '1000', 10);
      const STAGGER = parseInt(this.getAttribute('stagger') || '100',  10);
      const ENTER   = parseInt(this.getAttribute('enter')   || '500',  10);
      const EXIT    = parseInt(this.getAttribute('exit')    || '320',  10);
      const OVERLAP = parseInt(this.getAttribute('overlap') || '140',  10);

      this._shadow.innerHTML = `
        <style>${CSS}</style>
        <div class="wrap">
          <div class="stage"
               style="--dur-enter:${ENTER}ms;--dur-exit:${EXIT}ms;"
               part="stage"
               aria-label="Assemblage de chaussure en 3 parties"></div>
        </div>
      `;
      const wrap  = this._shadow.querySelector('.wrap');
      const stage = this._shadow.querySelector('.stage');

      // Build 9 parts (3 bands × 3 colors)
      const parts = {};
      for (const band of Object.keys(Y)) {
        parts[band] = {};
        for (const color of COLORS) {
          const el = document.createElement('div');
          el.className = 'part';
          el.style.top = Y[band] + 'px';
          el.dataset.state = (DIRS[band] === 'left') ? 'off-left' : 'off-right';
          el.style.visibility = 'hidden';
          const img = new Image();
          img.src = `${src}/${band}_${color}.png`;
          img.alt = '';
          el.appendChild(img);
          stage.appendChild(el);
          parts[band][color] = el;
        }
      }

      // Preload all 9
      const preload = Promise.all(
        Object.values(parts).flatMap(bp =>
          Object.values(bp).map(el => new Promise(res => {
            const img = el.querySelector('img');
            if (img.complete) return res();
            img.onload = img.onerror = res;
          }))
        )
      );

      // Responsive scale
      const fit = () => {
        const w = wrap.getBoundingClientRect().width;
        if (w > 0) stage.style.transform = `scale(${w / 1024})`;
      };
      fit();
      this._ro = new ResizeObserver(fit);
      this._ro.observe(wrap);

      // Sequence: two random mixed combos, then a rotating solid.
      const sequence = (function* () {
        const solids = ['gris', 'marron', 'rose'];
        let solidIdx = 0;
        let pool = [];
        const nextMixed = () => {
          if (pool.length < 1) pool = shuffled(MIXED);
          return pool.pop();
        };
        while (true) {
          yield nextMixed();
          yield nextMixed();
          yield solid(solids[solidIdx]);
          solidIdx = (solidIdx + 1) % solids.length;
        }
      })();

      const wait = (ms) => new Promise(r => {
        const id = setTimeout(() => { this._timers.delete(id); r(); }, ms);
        this._timers.add(id);
      });

      const resetOffStage = (el, band) => {
        el.dataset.exit = '';
        el.style.transition = 'none';
        el.dataset.state = (DIRS[band] === 'left') ? 'off-left' : 'off-right';
        void el.offsetWidth;
        requestAnimationFrame(() => { el.style.transition = ''; });
      };

      const enter = async (combo) => {
        for (const band of ORDER) {
          const color = combo[band];
          for (const c of COLORS) {
            const el = parts[band][c];
            resetOffStage(el, band);
            el.style.visibility = (c === color) ? 'visible' : 'hidden';
          }
        }
        ORDER.forEach((band, i) => {
          const el = parts[band][combo[band]];
          const id = setTimeout(() => {
            this._timers.delete(id);
            void el.offsetWidth;
            el.dataset.state = 'in';
          }, i * STAGGER);
          this._timers.add(id);
        });
        await wait((ORDER.length - 1) * STAGGER + ENTER);
      };

      const exit = async (combo) => {
        for (const band of ORDER) {
          const el = parts[band][combo[band]];
          el.dataset.exit = '1';
          el.dataset.state = 'off-right';
        }
        await wait(EXIT);
      };

      const loop = async () => {
        this._running = true;
        while (this._running) {
          const combo = sequence.next().value;
          await enter(combo);
          if (!this._running) return;
          await wait(HOLD);
          if (!this._running) return;
          exit(combo);
          await wait(OVERLAP);
        }
      };

      preload.then(() => { if (this.isConnected) loop(); });
    }

    disconnectedCallback() {
      this._running = false;
      this._timers.forEach(clearTimeout);
      this._timers.clear();
      if (this._ro) this._ro.disconnect();
    }
  }

  customElements.define('shoe-assembly', ShoeAssembly);
})();
