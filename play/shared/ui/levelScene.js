

























const STYLE_ID = 'mg-scene-style';




const CSS = `
html[data-scene] body { background: transparent !important; }
.mg-scene { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none;
  background: var(--mg-scene-ground, #FBF5E4); }
.mg-scene picture { position: absolute; inset: 0; opacity: 0; transition: opacity .6s ease; }
.mg-scene picture.on { opacity: 1; }
.mg-scene img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (prefers-reduced-motion: reduce) { .mg-scene picture { transition: none; } }
html[data-scene] main { gap: 14px; padding: 16px 16px 32px; }
html[data-scene] main > :not(.mg-own):not(.mg-again):not(:empty) {
  background: rgba(255, 253, 246, 0.93); border-radius: 14px; padding: 8px 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28); }
html[data-scene] main > :empty { min-height: 0; }
html[data-scene] main > .mg-own { max-width: 100%; }
`;






export const TALL_MEDIA = '(max-aspect-ratio: 4/5)';

function injectStyle(doc) {
  if (!doc?.head || doc.getElementById?.(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  doc.head.appendChild(s);
}


export function sceneFiles(base, level) {
  return { tall: `${base}/${level}-tall.webp`, wide: `${base}/${level}-wide.webp` };
}


export function pressedLevel(root, levels) {
  for (const b of root.querySelectorAll('[data-level]')) {
    if (b.getAttribute('aria-pressed') === 'true' && levels.includes(b.dataset.level)) return b.dataset.level;
  }
  return null;
}






export function mountLevelScene({ levels, base = './assets/levels', doc = document } = {}) {
  injectStyle(doc);
  const layer = doc.createElement('div');
  layer.className = 'mg-scene';
  layer.setAttribute('aria-hidden', 'true');
  doc.body.prepend(layer);
  let current = null;

  function set(level) {
    if (!levels.includes(level) || level === current) return;
    current = level;
    doc.documentElement.dataset.scene = level;
    const f = sceneFiles(base, level);
    const pic = doc.createElement('picture');
    const src = doc.createElement('source');
    src.media = TALL_MEDIA;
    src.srcset = f.tall;
    const img = doc.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.setAttribute('fetchpriority', 'low');
    img.src = f.wide;
    pic.append(src, img);
    layer.append(pic);
    const show = () => {
      if (current !== level) { pic.remove(); return; }  
      pic.classList.add('on');
      for (const old of [...layer.querySelectorAll('picture')]) {
        if (old !== pic) setTimeout(() => old.remove(), 700);
      }
    };
    const ready = img.decode ? img.decode() : Promise.resolve();
    ready.then(show, () => pic.remove());  
  }

  set(pressedLevel(doc, levels) ?? levels[0]);
  const MO = doc.defaultView?.MutationObserver;
  if (MO) {
    new MO(() => { const l = pressedLevel(doc, levels); if (l) set(l); })
      .observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  }
  return { set, current: () => current };
}
