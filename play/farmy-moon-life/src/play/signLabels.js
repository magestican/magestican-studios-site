

















const STYLE_ID = 'fml-sign-labels-style';
const CSS = `
.fml-sign-label{position:absolute;left:0;top:0;display:flex;align-items:center;gap:.28em;padding:.18em .5em .2em .34em;
  border-radius:.9em;background:rgba(255,248,232,.94);color:#5b3f35;font:700 16px/1 "Nunito","Quicksand",system-ui,sans-serif;
  letter-spacing:.01em;white-space:nowrap;pointer-events:none;box-shadow:0 .1em .35em rgba(80,50,60,.22);will-change:transform,opacity}
.fml-sign-label canvas,.fml-sign-label i{width:1.15em;height:1.15em;flex:none}
.fml-sign-label i{border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3b8 0 18%,#f2c14e 45%,#c98f1f 100%);box-shadow:inset 0 0 0 .08em #d9a232}
`;

export const SIGN_LABELS = Object.freeze({ maxDistanceM: 15, fadeFromM: 11, minPx: 11, maxPx: 22, textOfBoard: 0.3 });

export function createSignLabels({ layer, screenOf, iconFor = null, cfg = SIGN_LABELS }) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const pool = new Map();
  let visible = 0, priceText = '';

  function coinIcon() {
    if (!iconFor) return document.createElement('i');
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    iconFor('coin', { size: 48 }).then((src) => c.getContext('2d').drawImage(src, 0, 0, 48, 48)).catch(() => {});
    return c;
  }

  function entry(id) {
    let e = pool.get(id);
    if (!e) {
      const el = document.createElement('div');
      el.className = 'fml-sign-label';
      el.setAttribute('aria-hidden', 'true');
      
      
      
      
      
      
      
      
      
      
      el.style.display = 'none';
      const num = document.createElement('b');
      el.append(coinIcon(), num);
      layer.appendChild(el);
      e = { el, num, text: '', px: 0, w: 0, h: 0, shown: false, x: NaN, y: NaN, o: -1 };
      pool.set(id, e);
    }
    return e;
  }

  const snap = (v) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(v * dpr) / dpr;
  };

  function hide(e) {
    if (e.shown) { e.el.style.display = 'none'; e.shown = false; }
  }

  
  function update(points, { player, price }) {
    if (price !== null && price !== undefined) priceText = Number(price).toLocaleString('en-AU');
    const live = new Set();
    visible = 0;
    for (const p of points) {
      live.add(p.id);
      const e = entry(p.id);
      const d = player ? Math.hypot(p.x - player.x, p.z - player.z) : 0;
      if (price === null || price === undefined || d > cfg.maxDistanceM) { hide(e); continue; }
      const c = screenOf(p.x, p.y, p.z);
      const r = screenOf(p.x + p.halfWidth.x, p.y, p.z + p.halfWidth.z);
      if (!c.inView) { hide(e); continue; }
      const boardPx = 2 * Math.hypot(r.x - c.x, r.y - c.y);
      const px = Math.max(cfg.minPx, Math.min(cfg.maxPx, Math.round(boardPx * cfg.textOfBoard)));
      let measure = false;
      if (e.text !== priceText) { e.num.textContent = priceText; e.text = priceText; measure = true; }
      if (e.px !== px) { e.el.style.fontSize = `${px}px`; e.px = px; measure = true; }
      if (!e.shown) { e.el.style.display = ''; e.shown = true; measure = true; }
      if (measure) { e.w = e.el.offsetWidth; e.h = e.el.offsetHeight; }
      const x = snap(c.x - e.w / 2), y = snap(c.y - e.h / 2);
      if (x !== e.x || y !== e.y) { e.el.style.transform = `translate3d(${x}px,${y}px,0)`; e.x = x; e.y = y; }
      const o = d <= cfg.fadeFromM ? 1 : Math.max(0, 1 - (d - cfg.fadeFromM) / (cfg.maxDistanceM - cfg.fadeFromM));
      const oq = Math.round(o * 20) / 20;
      if (oq !== e.o) { e.el.style.opacity = String(oq); e.o = oq; }
      visible++;
    }
    for (const [id, e] of pool) if (!live.has(id)) hide(e);
  }

  function dispose() {
    for (const e of pool.values()) e.el.remove();
    pool.clear();
  }

  return { update, dispose, get stats() { return { visible, pooled: pool.size }; } };
}
